// Servicios de la Tienda (vault/nuevas-features/marketplace/SPEC.md §11–§12)
// Catálogo por persona, compra atómica con idempotencia y reembolsos, y la administración de productos.
import { Prisma } from "@prisma/client";
import prisma from "../prisma.ts";
import { esPadre } from "../habitos/permisos.ts";
import { NoAutorizadoError, NoEncontradoError } from "../habitos/server.ts";
import { nivelDe, xpTotal } from "../niveles.ts";
import { rachaEfectiva } from "../cartas/racha.ts";
import { APP_TZ, esFiestaHoy } from "../cartas/eventos.ts";
import { comprarSobre, descuentoDeUsuario, SELECT_ECONOMIA } from "../cartas/server.ts";
import { BONO_FIESTA_TIENDA } from "../cartas/economia.ts";
import { MONEDAS, CLAVES_MONEDA, type Costo, type Moneda, type OpcionPrecio, type Saldos } from "./monedas.ts";
import { aplicarDescuento, faltantes } from "./precios.ts";
import { evaluarRequisitos, type ContextoRequisitos, type Requisito, type RequisitoEvaluado } from "./requisitos.ts";
import { estadoProducto, inicioPeriodo, type EstadoProducto, type PeriodoLimite } from "./estado.ts";
import { PreciosSchema, ProductoEntradaSchema, RequisitosSchema } from "./esquemas.ts";
import { PRODUCTOS_SISTEMA, CLAVE_FRAGMENTOS, precioDesdeFragmentos, precioSobre, requisitosSobre, sobreDeClave } from "./sistema.ts";

type Cliente = Prisma.TransactionClient | typeof prisma;

// ─── Tipos que viajan al cliente ───────────────────────────────────────────────────────────────────
export type OpcionVista = { costos: Costo[]; alcanza: boolean; faltan: Costo[] };
export type RequisitoVista = { texto: string; cumplido: boolean; actual: number; objetivo: number };

export type ProductoVista = {
  id: number;
  tipo: "sobre" | "fragmentos" | "fisico" | "vale";
  sistemaClave: string | null;
  titulo: string;
  descripcion: string | null;
  imagenUrl: string | null;
  categoria: string;
  destacado: boolean;
  estado: EstadoProducto;
  opciones: OpcionVista[];
  opcionSugerida: number;
  requisitos: RequisitoVista[];
  stockRestante: number | null;
  limite: { max: number; periodo: PeriodoLimite; usadas: number; proximaCompra: string | null } | null;
  disponibleDesde: string | null;
  disponibleHasta: string | null;
  requiereAprobacion: boolean;
  esMeta: boolean;
};

export type TiendaVista = {
  saldos: Saldos;
  nivel: number;
  xp: number;
  descuentoPct: number;
  productos: ProductoVista[];
  ofertaDia: { titulo: string; texto: string; cartaNombre: string; imagenUrl: string; termina: string } | null;
};

export class CompraError extends Error {
  status = 400;
}

const ordenCategorias = ["cartas", "premios", "vales"];

const saldosDe = (u: { availablePoints: number; stars: number; incienso: number }): Saldos => ({
  puntos: u.availablePoints,
  estrellas: u.stars,
  incienso: u.incienso,
});

const leerPrecios = (json: unknown, ruta: string): OpcionPrecio[] => {
  const r = PreciosSchema.safeParse(json);
  if (!r.success) {
    console.error(`[Tienda] precios inválidos en ${ruta}`);
    return [];
  }
  return r.data as OpcionPrecio[];
};

const leerRequisitos = (json: unknown): Requisito[] => {
  const r = RequisitosSchema.safeParse(json ?? []);
  return r.success ? (r.data as Requisito[]) : [];
};

const leerDestinatarios = (json: unknown): number[] | null =>
  Array.isArray(json) ? json.filter((n): n is number => typeof n === "number") : null;

const iso = (d: Date | null) => (d ? d.toISOString() : null);

// ─── Productos del sistema ─────────────────────────────────────────────────────────────────────────
/** Crea las filas de los sobres y los fragmentos la primera vez (idempotente, sin pisar lo que editó un padre) */
export async function asegurarProductosSistema() {
  const existentes = await prisma.productoTienda.findMany({ where: { sistemaClave: { not: null } }, select: { sistemaClave: true } });
  const tiene = new Set(existentes.map((e) => e.sistemaClave));
  const faltan = PRODUCTOS_SISTEMA.filter((p) => !tiene.has(p.sistemaClave));
  if (faltan.length === 0) return;
  await prisma.productoTienda.createMany({
    skipDuplicates: true,
    data: faltan.map((p) => ({
      tipo: p.tipo,
      origen: "sistema",
      sistemaClave: p.sistemaClave,
      titulo: p.titulo,
      descripcion: p.descripcion,
      categoria: "cartas",
      precios: [p.tipo === "sobre" ? precioSobre(sobreDeClave(p.sistemaClave)!) : precioDesdeFragmentos()] as unknown as Prisma.InputJsonValue,
      descuentoRacha: p.tipo === "sobre",
      orden: p.orden,
    })),
  });
}

/** Precios y requisitos efectivos: los del sistema salen del código, los manuales de la base */
type FilaProducto = Awaited<ReturnType<typeof prisma.productoTienda.findMany>>[number];

function definicionEfectiva(p: FilaProducto) {
  const sobre = sobreDeClave(p.sistemaClave);
  if (sobre) {
    return { precios: [precioSobre(sobre)], requisitos: [...requisitosSobre(sobre), ...leerRequisitos(p.requisitos)] };
  }
  if (p.sistemaClave === CLAVE_FRAGMENTOS) return { precios: [precioDesdeFragmentos()], requisitos: leerRequisitos(p.requisitos) };
  return { precios: leerPrecios(p.precios, `producto ${p.id}`), requisitos: leerRequisitos(p.requisitos) };
}

// ─── Contexto de la persona ────────────────────────────────────────────────────────────────────────
async function cargarPersona(cliente: Cliente, usuarioId: number) {
  const [u, cartas, compras, desbloqueos] = await Promise.all([
    cliente.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, rolFamiliar: true, totalTasksCompleted: true, ...SELECT_ECONOMIA },
    }),
    cliente.cartaUsuario.findMany({ where: { usuarioId }, select: { cartaId: true, gradoReclamado: true } }),
    cliente.compraTienda.findMany({
      where: { usuarioId, estado: { in: ["completada", "pendiente_aprobacion"] } },
      select: { productoId: true, createdAt: true },
    }),
    cliente.desbloqueoProducto.findMany({ where: { usuarioId }, select: { productoId: true } }),
  ]);
  if (!u) throw new NoEncontradoError("Usuario no encontrado");
  return { u, cartas, compras, desbloqueos: new Set(desbloqueos.map((d) => d.productoId)) };
}

type Persona = Awaited<ReturnType<typeof cargarPersona>>;

function contextoPara(persona: Persona, productoId: number, nombres: { cartas: Map<number, string>; productos: Map<number, string> }, ahora: Date): ContextoRequisitos {
  const xp = xpTotal(persona.u);
  return {
    nivel: nivelDe(xp).level,
    xp,
    racha: rachaEfectiva(persona.u.streakDays, persona.u.lastTaskCompletedDate, ahora),
    tareasCompletadas: persona.u.totalTasksCompleted ?? 0,
    rol: persona.u.rolFamiliar,
    gradoPorCarta: new Map(persona.cartas.map((c) => [c.cartaId, c.gradoReclamado])),
    productosComprados: new Set(persona.compras.map((c) => c.productoId)),
    desbloqueadoPorPadre: persona.desbloqueos.has(productoId),
    nombreCarta: nombres.cartas,
    nombreProducto: nombres.productos,
  };
}

async function nombresReferenciados(productos: { requisitos: Requisito[] }[]) {
  const cartaIds = new Set<number>();
  const productoIds = new Set<number>();
  for (const p of productos) {
    for (const r of p.requisitos) {
      if (r.tipo === "carta") cartaIds.add(r.cartaId);
      if (r.tipo === "compraPrevia") productoIds.add(r.productoId);
    }
  }
  const [cartas, prods] = await Promise.all([
    cartaIds.size ? prisma.carta.findMany({ where: { id: { in: [...cartaIds] } }, select: { id: true, nombre: true } }) : [],
    productoIds.size ? prisma.productoTienda.findMany({ where: { id: { in: [...productoIds] } }, select: { id: true, titulo: true } }) : [],
  ]);
  return { cartas: new Map(cartas.map((c) => [c.id, c.nombre])), productos: new Map(prods.map((p) => [p.id, p.titulo])) };
}

const vistaRequisitos = (rs: RequisitoEvaluado[]): RequisitoVista[] =>
  rs.map((r) => ({ texto: r.texto, cumplido: r.cumplido, actual: r.actual, objetivo: r.objetivo }));

// ─── Catálogo para una persona ─────────────────────────────────────────────────────────────────────
export async function obtenerTienda(usuarioId: number, ahora = new Date()): Promise<TiendaVista> {
  await asegurarProductosSistema();
  const [filas, persona, meta, cartasFiesta] = await Promise.all([
    prisma.productoTienda.findMany({ orderBy: [{ destacado: "desc" }, { orden: "asc" }, { id: "asc" }] }),
    cargarPersona(prisma, usuarioId),
    prisma.metaTienda.findUnique({ where: { usuarioId } }),
    prisma.carta.findMany({ where: { activa: true, celebracion: { not: null } }, select: { nombre: true, celebracion: true, imagenUrl: true } }),
  ]);

  const definidos = filas.map((f) => ({ fila: f, ...definicionEfectiva(f) }));
  const nombres = await nombresReferenciados(definidos);
  const saldos = saldosDe(persona.u);
  const descuentoPct = descuentoDeUsuario(persona.u, ahora);
  const productos: ProductoVista[] = [];

  for (const { fila, precios, requisitos } of definidos) {
    const ctx = contextoPara(persona, fila.id, nombres, ahora);
    const evaluados = evaluarRequisitos(requisitos, ctx);
    const periodo = fila.periodoLimite as PeriodoLimite;
    const desde = inicioPeriodo(periodo, ahora);
    const usadas = persona.compras.filter((c) => c.productoId === fila.id && (!desde || c.createdAt >= desde)).length;
    const r = estadoProducto(
      {
        activo: fila.activo,
        destinatarios: leerDestinatarios(fila.destinatarios),
        usuarioId,
        disponibleDesde: fila.disponibleDesde,
        disponibleHasta: fila.disponibleHasta,
        stockRestante: fila.stockRestante,
        limiteUsuario: fila.limiteUsuario,
        periodoLimite: periodo,
        descuentoRacha: fila.descuentoRacha,
        precios,
      },
      { ahora, saldos, descuentoPct, requisitos: evaluados, comprasEnPeriodo: usadas }
    );
    if (r.estado === "oculto") continue;
    productos.push({
      id: fila.id,
      tipo: fila.tipo,
      sistemaClave: fila.sistemaClave,
      titulo: fila.titulo,
      descripcion: fila.descripcion,
      imagenUrl: fila.imagenClave,
      categoria: fila.categoria,
      destacado: fila.destacado,
      estado: r.estado,
      opciones: r.opciones.map((o) => ({ costos: o.opcion.costos, alcanza: o.alcanza, faltan: faltantes(o.opcion, saldos) })),
      opcionSugerida: r.opcionSugerida,
      requisitos: vistaRequisitos(evaluados),
      stockRestante: fila.stockRestante,
      limite: fila.limiteUsuario !== null ? { max: fila.limiteUsuario, periodo, usadas, proximaCompra: iso(r.proximaCompra) } : null,
      disponibleDesde: iso(fila.disponibleDesde),
      disponibleHasta: iso(fila.disponibleHasta),
      requiereAprobacion: fila.requiereAprobacion,
      esMeta: meta?.productoId === fila.id,
    });
  }

  // Oferta del día: la fiesta litúrgica de hoy da ×1,5 en fragmentos (D17)
  const hoy = cartasFiesta.find((c) => esFiestaHoy(c.celebracion, ahora, APP_TZ));
  const finDia = new Date(ahora);
  finDia.setHours(23, 59, 59, 999);
  const xp = xpTotal(persona.u);
  return {
    saldos,
    nivel: nivelDe(xp).level,
    xp,
    descuentoPct,
    productos,
    ofertaDia: hoy
      ? {
          titulo: "¡Hoy es fiesta!",
          texto: `Hoy los sobres y los fragmentos de ${hoy.nombre} dan ×${String(BONO_FIESTA_TIENDA).replace(".", ",")}.`,
          cartaNombre: hoy.nombre,
          imagenUrl: hoy.imagenUrl,
          termina: finDia.toISOString(),
        }
      : null,
  };
}

// ─── Meta de ahorro ────────────────────────────────────────────────────────────────────────────────
export async function fijarMeta(usuarioId: number, productoId: number | null) {
  if (productoId === null) {
    await prisma.metaTienda.deleteMany({ where: { usuarioId } });
    return;
  }
  const p = await prisma.productoTienda.findUnique({ where: { id: productoId }, select: { id: true, activo: true } });
  if (!p || !p.activo) throw new NoEncontradoError("Producto no encontrado");
  await prisma.metaTienda.upsert({ where: { usuarioId }, create: { usuarioId, productoId }, update: { productoId } });
}

// ─── Compra ────────────────────────────────────────────────────────────────────────────────────────
export type ResultadoCompra = {
  compraId: number;
  tipo: ProductoVista["tipo"];
  estado: "completada" | "pendiente_aprobacion";
  titulo: string;
  costos: Costo[];
  saldos: Saldos;
  repetida: boolean;
  /** Solo sobres: el resultado de la apertura, tal como lo muestra ModalAperturaSobre */
  sobre?: Awaited<ReturnType<typeof comprarSobre>>;
};

const MENSAJES_ESTADO: Record<EstadoProducto, string> = {
  oculto: "Este producto ya no está disponible.",
  bloqueado: "Todavía no cumplís lo necesario para desbloquearlo.",
  proximamente: "Todavía no está a la venta.",
  agotado: "Se agotó. ¡Alguien lo compró antes!",
  limite: "Ya alcanzaste el límite de compras de este producto.",
  sinSaldo: "No te alcanzan las monedas.",
  comprable: "",
};

function exigirEstado(estado: EstadoProducto) {
  if (estado !== "comprable") throw new CompraError(MENSAJES_ESTADO[estado]);
}

const camposDebito = (costos: Costo[]) => Object.fromEntries(costos.map((c) => [MONEDAS[c.moneda].campo, { decrement: c.monto }]));
const camposMinimo = (costos: Costo[]) => Object.fromEntries(costos.map((c) => [MONEDAS[c.moneda].campo, { gte: c.monto }]));
const camposReembolso = (costos: Costo[]) => Object.fromEntries(costos.map((c) => [MONEDAS[c.moneda].campo, { increment: c.monto }]));

const leerCostos = (json: unknown): Costo[] =>
  Array.isArray(json)
    ? json.filter((c): c is Costo => !!c && typeof c === "object" && CLAVES_MONEDA.includes((c as Costo).moneda) && Number.isInteger((c as Costo).monto))
    : [];

const saldosActuales = async (cliente: Cliente, usuarioId: number): Promise<Saldos> => {
  const u = await cliente.usuario.findUnique({ where: { id: usuarioId }, select: { availablePoints: true, stars: true, incienso: true } });
  return u ? saldosDe(u) : { puntos: 0, estrellas: 0, incienso: 0 };
};

/** Entrega lo comprado: un premio por entregar (físico) o un vale ya abierto */
async function entregar(tx: Prisma.TransactionClient, usuarioId: number, p: { tipo: string; titulo: string }) {
  const ahora = new Date();
  if (p.tipo === "vale") {
    return tx.recompensa.create({
      data: {
        usuarioId,
        tipo: "vale",
        titulo: p.titulo,
        origen: "Tienda",
        estado: "entregado",
        reclamadaEn: ahora,
        entregadaEn: ahora,
        contenido: [{ tipo: "vale", texto: p.titulo }],
      },
    });
  }
  return tx.recompensa.create({
    data: { usuarioId, tipo: "compra", titulo: p.titulo, origen: "Tienda", estado: "reclamado", reclamadaEn: ahora },
  });
}

/**
 * Compra de un producto. `clave` es una clave de idempotencia por intento: repetir la misma no cobra dos veces.
 * Los sobres delegan en `comprarSobre`; los fragmentos se compran desde su propio detalle (`/api/cartas/comprar`).
 */
export async function comprarProducto(usuarioId: number, productoId: number, opcion: number, clave: string): Promise<ResultadoCompra> {
  if (!clave || clave.length > 80) throw new CompraError("Falta la clave de la compra");
  const previa = await prisma.compraTienda.findUnique({ where: { usuarioId_claveIdempotencia: { usuarioId, claveIdempotencia: clave } } });
  if (previa) {
    const snap = previa.productoSnapshot as { tipo: ProductoVista["tipo"]; titulo: string };
    return {
      compraId: previa.id,
      tipo: snap.tipo,
      estado: previa.estado === "pendiente_aprobacion" ? "pendiente_aprobacion" : "completada",
      titulo: snap.titulo,
      costos: leerCostos(previa.costos),
      saldos: await saldosActuales(prisma, usuarioId),
      repetida: true,
    };
  }

  const fila = await prisma.productoTienda.findUnique({ where: { id: productoId } });
  if (!fila) throw new NoEncontradoError("Producto no encontrado");
  if (fila.tipo === "fragmentos") throw new CompraError("Los fragmentos se compran eligiendo la carta.");
  const { precios, requisitos } = definicionEfectiva(fila);

  const evaluar = async (cliente: Cliente, ahora: Date) => {
    const persona = await cargarPersona(cliente, usuarioId);
    const nombres = await nombresReferenciados([{ requisitos }]);
    const ctx = contextoPara(persona, fila.id, nombres, ahora);
    const periodo = fila.periodoLimite as PeriodoLimite;
    const desde = inicioPeriodo(periodo, ahora);
    const usadas = persona.compras.filter((c) => c.productoId === fila.id && (!desde || c.createdAt >= desde)).length;
    const saldos = saldosDe(persona.u);
    const descuentoPct = descuentoDeUsuario(persona.u, ahora);
    const r = estadoProducto(
      {
        activo: fila.activo,
        destinatarios: leerDestinatarios(fila.destinatarios),
        usuarioId,
        disponibleDesde: fila.disponibleDesde,
        disponibleHasta: fila.disponibleHasta,
        stockRestante: fila.stockRestante,
        limiteUsuario: fila.limiteUsuario,
        periodoLimite: periodo,
        descuentoRacha: fila.descuentoRacha,
        precios,
      },
      { ahora, saldos, descuentoPct, requisitos: evaluarRequisitos(requisitos, ctx), comprasEnPeriodo: usadas }
    );
    return r;
  };

  const registrar = (cliente: Cliente, costos: Costo[], estado: "completada" | "pendiente_aprobacion", recompensaId: number | null) =>
    cliente.compraTienda.create({
      data: {
        productoId: fila.id,
        usuarioId,
        estado,
        opcionPago: opcion,
        costos: costos as unknown as Prisma.InputJsonValue,
        productoSnapshot: { tipo: fila.tipo, titulo: fila.titulo, imagenUrl: fila.imagenClave },
        recompensaId,
        claveIdempotencia: clave,
      },
    });

  // Sobres: el pago y el sorteo los hace `comprarSobre` (misma lógica de siempre)
  const tipoSobre = sobreDeClave(fila.sistemaClave);
  if (tipoSobre) {
    const r = await evaluar(prisma, new Date());
    exigirEstado(r.estado);
    const sobre = await comprarSobre(usuarioId, tipoSobre);
    const costos: Costo[] = [
      { moneda: "puntos", monto: sobre.puntosGastados },
      ...(sobre.estrellasGastadas > 0 ? [{ moneda: "estrellas" as const, monto: sobre.estrellasGastadas }] : []),
    ];
    const compra = await registrar(prisma, costos, "completada", null);
    return { compraId: compra.id, tipo: "sobre", estado: "completada", titulo: fila.titulo, costos, saldos: await saldosActuales(prisma, usuarioId), repetida: false, sobre };
  }

  if (fila.tipo !== "fisico" && fila.tipo !== "vale") throw new CompraError("Producto no comprable");

  return prisma.$transaction(async (tx) => {
    // Las compras de una misma persona se hacen de a una: el límite y el saldo no se pisan
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${usuarioId})`;
    const ahora = new Date();
    const r = await evaluar(tx, ahora);
    exigirEstado(r.estado);
    const elegida = r.opciones[opcion];
    if (!elegida) throw new CompraError("Elegí una forma de pago");
    if (!elegida.alcanza) throw new CompraError(MENSAJES_ESTADO.sinSaldo);

    const costos = elegida.opcion.costos;
    const debito = await tx.usuario.updateMany({ where: { id: usuarioId, ...camposMinimo(costos) }, data: camposDebito(costos) });
    if (debito.count === 0) throw new CompraError(MENSAJES_ESTADO.sinSaldo);

    if (fila.stockRestante !== null) {
      const stock = await tx.productoTienda.updateMany({ where: { id: fila.id, stockRestante: { gt: 0 } }, data: { stockRestante: { decrement: 1 } } });
      if (stock.count === 0) throw new CompraError(MENSAJES_ESTADO.agotado);
    }

    const aprobacion = fila.requiereAprobacion;
    const recompensa = aprobacion ? null : await entregar(tx, usuarioId, fila);
    const compra = await registrar(tx, costos, aprobacion ? "pendiente_aprobacion" : "completada", recompensa?.id ?? null);
    return {
      compraId: compra.id,
      tipo: fila.tipo,
      estado: aprobacion ? ("pendiente_aprobacion" as const) : ("completada" as const),
      titulo: fila.titulo,
      costos,
      saldos: await saldosActuales(tx, usuarioId),
      repetida: false,
    };
  });
}

// ─── Mis compras ───────────────────────────────────────────────────────────────────────────────────
export async function misCompras(usuarioId: number) {
  const compras = await prisma.compraTienda.findMany({ where: { usuarioId }, orderBy: { createdAt: "desc" }, take: 50 });
  return compras.map((c) => {
    const snap = c.productoSnapshot as { tipo: string; titulo: string; imagenUrl?: string | null };
    return { id: c.id, estado: c.estado, titulo: snap.titulo, tipo: snap.tipo, imagenUrl: snap.imagenUrl ?? null, costos: leerCostos(c.costos), motivo: c.motivo, createdAt: c.createdAt.toISOString() };
  });
}

// ─── Administración ────────────────────────────────────────────────────────────────────────────────
function exigirPadre(rol?: string) {
  if (!esPadre(rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden administrar la tienda");
}

export type ProductoAdminVista = {
  id: number;
  tipo: string;
  origen: string;
  sistemaClave: string | null;
  titulo: string;
  descripcion: string | null;
  imagenUrl: string | null;
  categoria: string;
  precios: OpcionPrecio[];
  requisitos: Requisito[];
  stockTotal: number | null;
  stockRestante: number | null;
  limiteUsuario: number | null;
  periodoLimite: string;
  disponibleDesde: string | null;
  disponibleHasta: string | null;
  destinatarios: number[] | null;
  requiereAprobacion: boolean;
  descuentoRacha: boolean;
  destacado: boolean;
  activo: boolean;
  orden: number;
  ventas: number;
};

export async function listarProductosAdmin(rol?: string): Promise<ProductoAdminVista[]> {
  exigirPadre(rol);
  await asegurarProductosSistema();
  const [filas, ventas] = await Promise.all([
    prisma.productoTienda.findMany({ orderBy: [{ orden: "asc" }, { id: "asc" }] }),
    prisma.compraTienda.groupBy({ by: ["productoId"], where: { estado: { in: ["completada", "pendiente_aprobacion"] } }, _count: { _all: true } }),
  ]);
  const cuenta = new Map(ventas.map((v) => [v.productoId, v._count._all]));
  return filas.map((f) => {
    const d = definicionEfectiva(f);
    return {
      id: f.id,
      tipo: f.tipo,
      origen: f.origen,
      sistemaClave: f.sistemaClave,
      titulo: f.titulo,
      descripcion: f.descripcion,
      imagenUrl: f.imagenClave,
      categoria: f.categoria,
      precios: d.precios,
      requisitos: f.sistemaClave ? leerRequisitos(f.requisitos) : d.requisitos,
      stockTotal: f.stockTotal,
      stockRestante: f.stockRestante,
      limiteUsuario: f.limiteUsuario,
      periodoLimite: f.periodoLimite,
      disponibleDesde: iso(f.disponibleDesde),
      disponibleHasta: iso(f.disponibleHasta),
      destinatarios: leerDestinatarios(f.destinatarios),
      requiereAprobacion: f.requiereAprobacion,
      descuentoRacha: f.descuentoRacha,
      destacado: f.destacado,
      activo: f.activo,
      orden: f.orden,
      ventas: cuenta.get(f.id) ?? 0,
    };
  });
}

const datosProducto = (e: ReturnType<typeof ProductoEntradaSchema.parse>) => ({
  tipo: e.tipo,
  titulo: e.titulo,
  descripcion: e.descripcion || null,
  imagenClave: e.imagenClave || null,
  categoria: e.tipo === "vale" ? "vales" : e.categoria === "cartas" ? "premios" : e.categoria,
  precios: e.precios as unknown as Prisma.InputJsonValue,
  requisitos: e.requisitos as unknown as Prisma.InputJsonValue,
  stockTotal: e.stockTotal ?? null,
  limiteUsuario: e.limiteUsuario ?? null,
  periodoLimite: e.periodoLimite,
  disponibleDesde: e.disponibleDesde ? new Date(e.disponibleDesde) : null,
  disponibleHasta: e.disponibleHasta ? new Date(e.disponibleHasta) : null,
  destinatarios: e.destinatarios && e.destinatarios.length > 0 ? (e.destinatarios as unknown as Prisma.InputJsonValue) : undefined,
  requiereAprobacion: e.requiereAprobacion,
  descuentoRacha: e.descuentoRacha,
  destacado: e.destacado,
  activo: e.activo,
});

export async function crearProducto(actor: { id: number; rol?: string }, entrada: unknown) {
  exigirPadre(actor.rol);
  const e = ProductoEntradaSchema.parse(entrada);
  const max = await prisma.productoTienda.aggregate({ _max: { orden: true } });
  const d = datosProducto(e);
  return prisma.productoTienda.create({
    data: { ...d, stockRestante: d.stockTotal, orden: (max._max.orden ?? 0) + 1, creadoPorId: actor.id },
  });
}

export async function actualizarProducto(actor: { id: number; rol?: string }, id: number, entrada: unknown) {
  exigirPadre(actor.rol);
  const actual = await prisma.productoTienda.findUnique({ where: { id } });
  if (!actual) throw new NoEncontradoError("Producto no encontrado");

  // Los productos del sistema solo cambian visibilidad, orden, destacado, requisitos y destinatarios
  if (actual.origen === "sistema") {
    const e = (entrada ?? {}) as Record<string, unknown>;
    return prisma.productoTienda.update({
      where: { id },
      data: {
        ...(typeof e.activo === "boolean" ? { activo: e.activo } : {}),
        ...(typeof e.destacado === "boolean" ? { destacado: e.destacado } : {}),
        ...(typeof e.orden === "number" ? { orden: Math.trunc(e.orden) } : {}),
        ...(e.requisitos !== undefined ? { requisitos: RequisitosSchema.parse(e.requisitos) as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  const e = ProductoEntradaSchema.parse(entrada);
  const d = datosProducto(e);
  // Si cambia el stock total, el restante acompaña la diferencia (sin dejarlo negativo)
  let stockRestante = actual.stockRestante;
  if (d.stockTotal === null) stockRestante = null;
  else if (actual.stockTotal === null) stockRestante = d.stockTotal;
  else stockRestante = Math.max(0, (actual.stockRestante ?? 0) + (d.stockTotal - actual.stockTotal));
  return prisma.productoTienda.update({
    where: { id },
    data: { ...d, destinatarios: d.destinatarios ?? Prisma.DbNull, stockRestante },
  });
}

/** Borra el producto si nunca se vendió; si tiene compras lo archiva (inactivo) */
export async function eliminarProducto(actor: { id: number; rol?: string }, id: number) {
  exigirPadre(actor.rol);
  const p = await prisma.productoTienda.findUnique({ where: { id }, select: { origen: true } });
  if (!p) throw new NoEncontradoError("Producto no encontrado");
  if (p.origen === "sistema") throw new CompraError("Los productos del sistema solo se pueden ocultar.");
  const ventas = await prisma.compraTienda.count({ where: { productoId: id } });
  if (ventas > 0) {
    await prisma.productoTienda.update({ where: { id }, data: { activo: false } });
    return { archivado: true };
  }
  await prisma.productoTienda.delete({ where: { id } });
  return { archivado: false };
}

export async function desbloquearProducto(actor: { id: number; rol?: string }, productoId: number, usuarioId: number, desbloquear: boolean) {
  exigirPadre(actor.rol);
  if (!desbloquear) {
    await prisma.desbloqueoProducto.deleteMany({ where: { productoId, usuarioId } });
    return;
  }
  await prisma.desbloqueoProducto.upsert({
    where: { productoId_usuarioId: { productoId, usuarioId } },
    create: { productoId, usuarioId, porId: actor.id },
    update: {},
  });
}

export type CompraAdminVista = {
  id: number;
  estado: string;
  titulo: string;
  tipo: string;
  imagenUrl: string | null;
  costos: Costo[];
  motivo: string | null;
  createdAt: string;
  entregada: boolean;
  usuario: { id: number; nombre: string; fotoUrl: string | null };
};

export async function listarComprasAdmin(rol?: string): Promise<CompraAdminVista[]> {
  exigirPadre(rol);
  const compras = await prisma.compraTienda.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { usuario: { select: { id: true, nombre: true, fotoUrl: true } } },
  });
  const ids = compras.map((c) => c.recompensaId).filter((x): x is number => x !== null);
  const recs = ids.length ? await prisma.recompensa.findMany({ where: { id: { in: ids } }, select: { id: true, estado: true } }) : [];
  const entregadas = new Set(recs.filter((r) => r.estado === "entregado").map((r) => r.id));
  return compras.map((c) => {
    const snap = c.productoSnapshot as { tipo: string; titulo: string; imagenUrl?: string | null };
    return {
      id: c.id,
      estado: c.estado,
      titulo: snap.titulo,
      tipo: snap.tipo,
      imagenUrl: snap.imagenUrl ?? null,
      costos: leerCostos(c.costos),
      motivo: c.motivo,
      createdAt: c.createdAt.toISOString(),
      entregada: c.recompensaId !== null && entregadas.has(c.recompensaId),
      usuario: c.usuario,
    };
  });
}

export async function contarComprasPorAprobar(rol?: string) {
  if (!esPadre(rol)) return 0;
  return prisma.compraTienda.count({ where: { estado: "pendiente_aprobacion" } });
}

/** Aprobar, rechazar (reembolsa) o cancelar y reembolsar una compra que todavía no se entregó */
export async function resolverCompra(actor: { id: number; rol?: string }, id: number, accion: "aprobar" | "rechazar" | "cancelar", motivo?: string) {
  exigirPadre(actor.rol);
  return prisma.$transaction(async (tx) => {
    const c = await tx.compraTienda.findUnique({ where: { id }, include: { producto: true } });
    if (!c) throw new NoEncontradoError("Compra no encontrada");
    const costos = leerCostos(c.costos);

    if (accion === "aprobar") {
      if (c.estado !== "pendiente_aprobacion") throw new CompraError("Esta compra no está esperando aprobación");
      const rec = await entregar(tx, c.usuarioId, c.producto);
      await tx.compraTienda.update({ where: { id }, data: { estado: "completada", recompensaId: rec.id, resueltaPorId: actor.id, resueltaEn: new Date() } });
      return { estado: "completada" as const };
    }

    // Rechazar o cancelar: se reembolsa, una sola vez
    const reembolsable = accion === "rechazar" ? c.estado === "pendiente_aprobacion" : c.estado === "completada" || c.estado === "pendiente_aprobacion";
    if (!reembolsable) throw new CompraError("Esta compra ya no se puede reembolsar");
    if (c.producto.tipo === "sobre" || c.producto.tipo === "fragmentos") throw new CompraError("Un sobre abierto no se puede reembolsar.");

    if (c.recompensaId !== null) {
      const rec = await tx.recompensa.findUnique({ where: { id: c.recompensaId }, select: { estado: true, tipo: true, usadoEn: true } });
      if (rec && (rec.estado === "entregado" && rec.tipo !== "vale")) throw new CompraError("Ya se entregó: no se puede reembolsar.");
      if (rec?.usadoEn) throw new CompraError("El vale ya se usó: no se puede reembolsar.");
      await tx.compraTienda.update({ where: { id }, data: { recompensaId: null } });
      await tx.recompensa.delete({ where: { id: c.recompensaId } });
    }
    await tx.usuario.update({ where: { id: c.usuarioId }, data: camposReembolso(costos) });
    if (c.producto.stockRestante !== null) await tx.productoTienda.update({ where: { id: c.productoId }, data: { stockRestante: { increment: 1 } } });
    const estado = accion === "rechazar" ? "rechazada" : "cancelada";
    await tx.compraTienda.update({ where: { id }, data: { estado, motivo: motivo?.slice(0, 200) || null, resueltaPorId: actor.id, resueltaEn: new Date() } });
    return { estado };
  });
}
