// Servicios de la Tienda (vault/nuevas-features/marketplace/SPEC.md §11–§12)
// Catálogo por persona, compra atómica con idempotencia y reembolsos, compra compartida (lane 238) y la administración de productos.
import { Prisma } from "@prisma/client";
import prisma from "../prisma.ts";
import { esPadre } from "../habitos/permisos.ts";
import { NoAutorizadoError, NoEncontradoError } from "../habitos/server.ts";
import { nivelDe, xpTotal } from "../niveles.ts";
import { rachaEfectiva } from "../cartas/racha.ts";
import { APP_TZ, esFiestaHoy } from "../cartas/eventos.ts";
import { abrirSobreEnTx, comprarSobre, descuentoDeUsuario, SELECT_ECONOMIA } from "../cartas/server.ts";
import { exigirSinSancion, rangoDelDia } from "../comportamiento/sancionServer.ts";
import { BONO_FIESTA_TIENDA } from "../cartas/economia.ts";
import { MONEDAS, CLAVES_MONEDA, type Costo, type OpcionPrecio, type Saldos } from "./monedas.ts";
import { alcanza, aplicarDescuento, faltantes } from "./precios.ts";
import { evaluarRequisitos, type ContextoRequisitos, type Requisito, type RequisitoEvaluado } from "./requisitos.ts";
import { estadoProducto, inicioPeriodo, type EstadoProducto, type PeriodoLimite } from "./estado.ts";
import { PreciosSchema, ProductoEntradaSchema, RequisitosSchema, SolicitudCompartidaSchema } from "./esquemas.ts";
import { PRODUCTOS_SISTEMA, CLAVE_FRAGMENTOS, precioDesdeFragmentos, precioSobre, requisitosSobre, sobreDeClave } from "./sistema.ts";
import { evaluarAptitudParticipante, validarDistribucion, type AptitudParticipante } from "./compartida.ts";

type Cliente = Prisma.TransactionClient | typeof prisma;

// ─── Tipos que viajan al cliente ───────────────────────────────────────────────────────────────────
export type OpcionVista = { costos: Costo[]; alcanza: boolean; faltan: Costo[] };
export type RequisitoVista = { texto: string; cumplido: boolean; actual: number; objetivo: number };

export type MiembroTiendaVista = {
  id: number;
  nombre: string;
  fotoUrl: string | null;
  rolFamiliar: string;
  nivel: number;
  xp: number;
  saldos: Saldos;
};

export type ParticipanteCompraVista = {
  usuarioId: number;
  nombre: string;
  fotoUrl: string | null;
  costos: Costo[];
  estado: "pendiente" | "aceptada" | "rechazada";
  alcanzaSaldo: boolean;
  respondidoEn: string | null;
};

export type CompraCompartidaVista = {
  id: number;
  productoId: number;
  titulo: string;
  tipo: ProductoVista["tipo"];
  imagenUrl: string | null;
  opcionPago: number;
  costosTotales: Costo[];
  estado: "pendiente" | "completada" | "rechazada" | "cancelada";
  solicitante: { id: number; nombre: string; fotoUrl: string | null };
  participantes: ParticipanteCompraVista[];
  createdAt: string;
  resueltaEn: string | null;
};

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
  /** Por cada integrante de la familia, si cumple las condiciones de este producto para una compra compartida */
  aptitudFamiliar: Record<number, AptitudParticipante>;
};

export type TiendaVista = {
  usuarioActualId: number;
  usuarioActualNombre: string;
  usuarioActualFotoUrl: string | null;
  saldos: Saldos;
  nivel: number;
  xp: number;
  descuentoPct: number;
  productos: ProductoVista[];
  ofertaDia: { titulo: string; texto: string; cartaNombre: string; imagenUrl: string; termina: string } | null;
  familia: MiembroTiendaVista[];
  comprasCompartidas: CompraCompartidaVista[];
};

export class CompraError extends Error {
  status = 400;
}

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

// ─── Contexto de las personas de la familia ────────────────────────────────────────────────────────
async function cargarPersonas(cliente: Cliente, usuarioIds: number[] | null, ahora = new Date()) {
  const filtroUsuario = usuarioIds ? { id: { in: usuarioIds } } : undefined;
  const filtroPorUsuario = usuarioIds ? { usuarioId: { in: usuarioIds } } : {};
  const { desde, hasta } = rangoDelDia(ahora);

  const [usuarios, cartas, comprasDirectas, comprasCompartidasPart, desbloqueos, sanciones] = await Promise.all([
    cliente.usuario.findMany({
      where: filtroUsuario,
      select: { id: true, nombre: true, fotoUrl: true, rolFamiliar: true, totalTasksCompleted: true, ...SELECT_ECONOMIA },
      orderBy: { id: "asc" },
    }),
    cliente.cartaUsuario.findMany({
      where: filtroPorUsuario,
      select: { usuarioId: true, cartaId: true, gradoReclamado: true },
    }),
    cliente.compraTienda.findMany({
      where: { ...filtroPorUsuario, estado: { in: ["completada", "pendiente_aprobacion"] } },
      select: { id: true, usuarioId: true, productoId: true, createdAt: true },
    }),
    cliente.participanteCompraTienda.findMany({
      where: {
        ...filtroPorUsuario,
        compraCompartida: {
          estado: "completada",
          compra: { estado: { in: ["completada", "pendiente_aprobacion"] } },
        },
      },
      select: {
        usuarioId: true,
        compraCompartida: { select: { compraId: true, productoId: true, createdAt: true } },
      },
    }),
    cliente.desbloqueoProducto.findMany({
      where: filtroPorUsuario,
      select: { usuarioId: true, productoId: true },
    }),
    cliente.comportamiento.findMany({
      where: { ...filtroPorUsuario, tipo: "Negativo", createdAt: { gte: desde, lt: hasta } },
      select: { usuarioId: true },
    }),
  ]);

  const sancionados = new Set(sanciones.map((s) => s.usuarioId));
  const mapa = new Map<
    number,
    {
      u: (typeof usuarios)[number];
      cartas: { cartaId: number; gradoReclamado: number }[];
      compras: { productoId: number; createdAt: Date }[];
      desbloqueos: Set<number>;
      sancionado: boolean;
    }
  >();

  for (const u of usuarios) {
    mapa.set(u.id, { u, cartas: [], compras: [], desbloqueos: new Set(), sancionado: sancionados.has(u.id) });
  }
  for (const c of cartas) {
    mapa.get(c.usuarioId)?.cartas.push({ cartaId: c.cartaId, gradoReclamado: c.gradoReclamado });
  }
  const comprasVistasPorUsuario = new Map<number, Set<number>>();
  for (const c of comprasDirectas) {
    mapa.get(c.usuarioId)?.compras.push({ productoId: c.productoId, createdAt: c.createdAt });
    if (!comprasVistasPorUsuario.has(c.usuarioId)) comprasVistasPorUsuario.set(c.usuarioId, new Set());
    comprasVistasPorUsuario.get(c.usuarioId)!.add(c.id);
  }
  for (const pc of comprasCompartidasPart) {
    const cid = pc.compraCompartida.compraId;
    if (cid && comprasVistasPorUsuario.get(pc.usuarioId)?.has(cid)) continue;
    mapa.get(pc.usuarioId)?.compras.push({
      productoId: pc.compraCompartida.productoId,
      createdAt: pc.compraCompartida.createdAt,
    });
  }
  for (const d of desbloqueos) {
    mapa.get(d.usuarioId)?.desbloqueos.add(d.productoId);
  }

  return mapa;
}

async function cargarPersona(cliente: Cliente, usuarioId: number, ahora = new Date()) {
  const mapa = await cargarPersonas(cliente, [usuarioId], ahora);
  const p = mapa.get(usuarioId);
  if (!p) throw new NoEncontradoError("Usuario no encontrado");
  return p;
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
  const [filas, personasMapa, meta, cartasFiesta, comprasCompartidas] = await Promise.all([
    prisma.productoTienda.findMany({ orderBy: [{ destacado: "desc" }, { orden: "asc" }, { id: "asc" }] }),
    cargarPersonas(prisma, null, ahora),
    prisma.metaTienda.findUnique({ where: { usuarioId } }),
    prisma.carta.findMany({ where: { activa: true, celebracion: { not: null } }, select: { nombre: true, celebracion: true, imagenUrl: true } }),
    listarComprasCompartidas(usuarioId),
  ]);

  const persona = personasMapa.get(usuarioId);
  if (!persona) throw new NoEncontradoError("Usuario no encontrado");

  const definidos = filas.map((f) => ({ fila: f, ...definicionEfectiva(f) }));
  const nombres = await nombresReferenciados(definidos);
  const saldos = saldosDe(persona.u);
  const descuentoPct = descuentoDeUsuario(persona.u, ahora);
  const productos: ProductoVista[] = [];

  for (const { fila, precios, requisitos } of definidos) {
    const destinatarios = leerDestinatarios(fila.destinatarios);
    const periodo = fila.periodoLimite as PeriodoLimite;
    const desde = inicioPeriodo(periodo, ahora);

    const ctx = contextoPara(persona, fila.id, nombres, ahora);
    const evaluados = evaluarRequisitos(requisitos, ctx);
    const usadas = persona.compras.filter((c) => c.productoId === fila.id && (!desde || c.createdAt >= desde)).length;
    const r = estadoProducto(
      {
        activo: fila.activo,
        destinatarios,
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

    // Aptitud de cada integrante de la familia para participar en compra compartida de este producto
    const aptitudFamiliar: Record<number, AptitudParticipante> = {};
    for (const [otroId, otraPersona] of personasMapa.entries()) {
      const ctxOtro = contextoPara(otraPersona, fila.id, nombres, ahora);
      const evalOtro = evaluarRequisitos(requisitos, ctxOtro);
      const usadasOtro = otraPersona.compras.filter((c) => c.productoId === fila.id && (!desde || c.createdAt >= desde)).length;
      aptitudFamiliar[otroId] = evaluarAptitudParticipante(
        {
          activo: fila.activo,
          destinatarios,
          usuarioId: otroId,
          disponibleDesde: fila.disponibleDesde,
          disponibleHasta: fila.disponibleHasta,
          stockRestante: fila.stockRestante,
          limiteUsuario: fila.limiteUsuario,
          periodoLimite: periodo,
          descuentoRacha: fila.descuentoRacha,
          precios,
        },
        {
          ahora,
          saldos: saldosDe(otraPersona.u),
          descuentoPct: descuentoDeUsuario(otraPersona.u, ahora),
          requisitos: evalOtro,
          comprasEnPeriodo: usadasOtro,
        },
        { sancionado: otraPersona.sancionado }
      );
    }

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
      aptitudFamiliar,
    });
  }

  const familia: MiembroTiendaVista[] = [];
  for (const [otroId, otraPersona] of personasMapa.entries()) {
    if (otroId === usuarioId) continue;
    const xpOtro = xpTotal(otraPersona.u);
    familia.push({
      id: otroId,
      nombre: otraPersona.u.nombre,
      fotoUrl: otraPersona.u.fotoUrl,
      rolFamiliar: otraPersona.u.rolFamiliar,
      nivel: nivelDe(xpOtro).level,
      xp: xpOtro,
      saldos: saldosDe(otraPersona.u),
    });
  }

  // Oferta del día: la fiesta litúrgica de hoy da ×1,5 en fragmentos (D17)
  const hoy = cartasFiesta.find((c) => esFiestaHoy(c.celebracion, ahora, APP_TZ));
  const finDia = new Date(ahora);
  finDia.setHours(23, 59, 59, 999);
  const xp = xpTotal(persona.u);
  return {
    usuarioActualId: usuarioId,
    usuarioActualNombre: persona.u.nombre,
    usuarioActualFotoUrl: persona.u.fotoUrl,
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
    familia,
    comprasCompartidas,
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
async function entregar(tx: Prisma.TransactionClient, usuarioId: number, p: { tipo: string; titulo: string }, compartidoCon?: string | null) {
  const ahora = new Date();
  const origen = compartidoCon ? "Tienda (compartida)" : "Tienda";
  const pedido = compartidoCon ? `Compra compartida entre ${compartidoCon}` : null;
  if (p.tipo === "vale") {
    return tx.recompensa.create({
      data: {
        usuarioId,
        tipo: "vale",
        titulo: p.titulo,
        origen,
        pedido,
        estado: "entregado",
        reclamadaEn: ahora,
        entregadaEn: ahora,
        contenido: [{ tipo: "vale", texto: p.titulo }],
      },
    });
  }
  return tx.recompensa.create({
    data: { usuarioId, tipo: "compra", titulo: p.titulo, origen, pedido, estado: "reclamado", reclamadaEn: ahora },
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

  // Día con sanción: la tienda está deshabilitada (vault/LANE_200_SANCION_Y_ENGAGEMENT.md)
  await exigirSinSancion(prisma, usuarioId, "tienda");

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

// ─── Compra compartida (lane 238) ──────────────────────────────────────────────────────────────────
const INCLUDE_COMPARTIDA = {
  solicitante: { select: { id: true, nombre: true, fotoUrl: true } },
  participantes: {
    orderBy: { id: "asc" as const },
    include: {
      usuario: { select: { id: true, nombre: true, fotoUrl: true, availablePoints: true, stars: true, incienso: true } },
    },
  },
} as const;

type FilaCompartida = Awaited<
  ReturnType<typeof prisma.compraCompartida.findMany<{ include: typeof INCLUDE_COMPARTIDA }>>
>[number];

function aVistaCompartida(c: FilaCompartida): CompraCompartidaVista {
  const snap = c.productoSnapshot as { tipo: ProductoVista["tipo"]; titulo: string; imagenUrl?: string | null };
  return {
    id: c.id,
    productoId: c.productoId,
    titulo: snap.titulo,
    tipo: snap.tipo,
    imagenUrl: snap.imagenUrl ?? null,
    opcionPago: c.opcionPago,
    costosTotales: leerCostos(c.costosTotales),
    estado: c.estado,
    solicitante: c.solicitante,
    participantes: c.participantes.map((p) => {
      const costos = leerCostos(p.costos);
      const saldos = saldosDe(p.usuario);
      return {
        usuarioId: p.usuarioId,
        nombre: p.usuario.nombre,
        fotoUrl: p.usuario.fotoUrl,
        costos,
        estado: p.estado,
        alcanzaSaldo: alcanza({ costos }, saldos),
        respondidoEn: iso(p.respondidoEn),
      };
    }),
    createdAt: c.createdAt.toISOString(),
    resueltaEn: iso(c.resueltaEn),
  };
}

/** Solicitudes de compra compartida en las que la persona participa (pendientes primero, luego recientes) */
export async function listarComprasCompartidas(usuarioId: number): Promise<CompraCompartidaVista[]> {
  const filas = await prisma.compraCompartida.findMany({
    where: {
      OR: [{ solicitanteId: usuarioId }, { participantes: { some: { usuarioId } } }],
    },
    include: INCLUDE_COMPARTIDA,
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return filas.map(aVistaCompartida);
}

/** Invitaciones de compra compartida que esperan respuesta de esta persona (para insignia del menú) */
export async function contarComprasCompartidasPendientes(usuarioId: number): Promise<number> {
  return prisma.participanteCompraTienda.count({
    where: {
      usuarioId,
      estado: "pendiente",
      compraCompartida: { estado: "pendiente" },
    },
  });
}

/**
 * Valida que TODOS los participantes seleccionados cumplan todas las condiciones del producto
 * (nivel, XP, racha, rol, límite, destinatario, sin sanción hoy), salvo tener monedas suficientes solos.
 */
async function verificarAptitudTodos(
  cliente: Cliente,
  fila: FilaProducto,
  precios: OpcionPrecio[],
  requisitos: Requisito[],
  idsParticipantes: number[],
  solicitanteId: number,
  ahora: Date
) {
  const personasMapa = await cargarPersonas(cliente, idsParticipantes, ahora);
  if (personasMapa.size !== idsParticipantes.length) {
    throw new NoEncontradoError("Uno de los participantes seleccionados no existe");
  }
  const nombres = await nombresReferenciados([{ requisitos }]);
  const destinatarios = leerDestinatarios(fila.destinatarios);
  const periodo = fila.periodoLimite as PeriodoLimite;
  const desde = inicioPeriodo(periodo, ahora);

  for (const uid of idsParticipantes) {
    const persona = personasMapa.get(uid)!;
    const ctx = contextoPara(persona, fila.id, nombres, ahora);
    const evaluados = evaluarRequisitos(requisitos, ctx);
    const usadas = persona.compras.filter((c) => c.productoId === fila.id && (!desde || c.createdAt >= desde)).length;
    const aptitud = evaluarAptitudParticipante(
      {
        activo: fila.activo,
        destinatarios,
        usuarioId: uid,
        disponibleDesde: fila.disponibleDesde,
        disponibleHasta: fila.disponibleHasta,
        stockRestante: fila.stockRestante,
        limiteUsuario: fila.limiteUsuario,
        periodoLimite: periodo,
        descuentoRacha: fila.descuentoRacha,
        precios,
      },
      {
        ahora,
        saldos: saldosDe(persona.u),
        descuentoPct: descuentoDeUsuario(persona.u, ahora),
        requisitos: evaluados,
        comprasEnPeriodo: usadas,
      },
      { sancionado: persona.sancionado }
    );
    if (!aptitud.apto) {
      if (uid === solicitanteId) {
        throw new CompraError(aptitud.motivo ?? "No cumplís las condiciones para comprar este producto.");
      }
      throw new CompraError(`${persona.u.nombre} no cumple las condiciones para esta compra (${aptitud.motivo}).`);
    }
  }

  return personasMapa;
}

/**
 * Crea una solicitud de compra compartida. El solicitante queda con su parte ya aceptada;
 * cuando todos los demás participantes aceptan, se debita a cada uno lo acordado y se concreta la compra.
 */
export async function crearCompraCompartida(solicitanteId: number, entrada: unknown, ahora = new Date()): Promise<CompraCompartidaVista> {
  const e = SolicitudCompartidaSchema.parse(entrada);
  if (!e.participantes.some((p) => p.usuarioId === solicitanteId)) {
    throw new CompraError("Tenés que estar incluido entre los participantes de la compra compartida.");
  }

  const fila = await prisma.productoTienda.findUnique({ where: { id: e.productoId } });
  if (!fila) throw new NoEncontradoError("Producto no encontrado");
  if (fila.tipo === "fragmentos") throw new CompraError("Los fragmentos se compran eligiendo la carta.");

  const { precios, requisitos } = definicionEfectiva(fila);
  const opcionBase = precios[e.opcion];
  if (!opcionBase) throw new CompraError("Elegí una forma de pago válida");

  const ids = [...new Set(e.participantes.map((p) => p.usuarioId))];
  const personasMapa = await verificarAptitudTodos(prisma, fila, precios, requisitos, ids, solicitanteId, ahora);
  const solicitante = personasMapa.get(solicitanteId)!;

  const opcionEfectiva = aplicarDescuento(opcionBase, descuentoDeUsuario(solicitante.u, ahora), fila.descuentoRacha);
  const validacion = validarDistribucion(
    opcionEfectiva.costos,
    e.participantes.map((p) => {
      const per = personasMapa.get(p.usuarioId);
      return {
        usuarioId: p.usuarioId,
        costos: p.costos as Costo[],
        saldos: per ? saldosDe(per.u) : undefined,
        nombre: per?.u.nombre,
      };
    })
  );
  if (!validacion.ok) throw new CompraError(validacion.error);

  const creada = await prisma.compraCompartida.create({
    data: {
      productoId: fila.id,
      solicitanteId,
      opcionPago: e.opcion,
      costosTotales: opcionEfectiva.costos as unknown as Prisma.InputJsonValue,
      productoSnapshot: { tipo: fila.tipo, titulo: fila.titulo, imagenUrl: fila.imagenClave },
      estado: "pendiente",
      participantes: {
        create: validacion.aportes.map((a) => ({
          usuarioId: a.usuarioId,
          costos: a.costos as unknown as Prisma.InputJsonValue,
          estado: a.usuarioId === solicitanteId ? "aceptada" : "pendiente",
          respondidoEn: a.usuarioId === solicitanteId ? ahora : null,
        })),
      },
    },
    include: INCLUDE_COMPARTIDA,
  });

  return aVistaCompartida(creada);
}

export type ResultadoRespuestaCompartida = {
  solicitud: CompraCompartidaVista;
  resultadoCompra: ResultadoCompra | null;
  saldos: Saldos;
};

/**
 * Un participante acepta o rechaza su parte (o el solicitante cancela la solicitud).
 * Si con esta aceptación TODOS los participantes aceptaron, en la misma transacción se verifica
 * que todos sigan cumpliendo requisitos, se debita a cada uno su parte y se concreta la compra.
 */
export async function responderCompraCompartida(
  usuarioId: number,
  solicitudId: number,
  accion: "aceptar" | "rechazar" | "cancelar",
  ahora = new Date()
): Promise<ResultadoRespuestaCompartida> {
  return prisma.$transaction(async (tx) => {
    const actual = await tx.compraCompartida.findUnique({
      where: { id: solicitudId },
      include: { ...INCLUDE_COMPARTIDA, producto: true },
    });
    if (!actual) throw new NoEncontradoError("Solicitud de compra compartida no encontrada");
    if (actual.estado !== "pendiente") throw new CompraError("Esta solicitud de compra compartida ya fue resuelta.");

    if (accion === "cancelar") {
      const actor = await tx.usuario.findUnique({ where: { id: usuarioId }, select: { rolFamiliar: true } });
      if (actual.solicitanteId !== usuarioId && !esPadre(actor?.rolFamiliar)) {
        throw new NoAutorizadoError("Solo quien inició la compra compartida puede cancelarla");
      }
      const cancelada = await tx.compraCompartida.update({
        where: { id: solicitudId },
        data: { estado: "cancelada", resueltaEn: ahora },
        include: INCLUDE_COMPARTIDA,
      });
      return {
        solicitud: aVistaCompartida(cancelada),
        resultadoCompra: null,
        saldos: await saldosActuales(tx, usuarioId),
      };
    }

    const miPart = actual.participantes.find((p) => p.usuarioId === usuarioId);
    if (!miPart) throw new NoAutorizadoError("No sos participante de esta compra compartida");

    if (accion === "rechazar") {
      await tx.participanteCompraTienda.update({
        where: { id: miPart.id },
        data: { estado: "rechazada", respondidoEn: ahora },
      });
      const rechazada = await tx.compraCompartida.update({
        where: { id: solicitudId },
        data: { estado: "rechazada", resueltaEn: ahora },
        include: INCLUDE_COMPARTIDA,
      });
      return {
        solicitud: aVistaCompartida(rechazada),
        resultadoCompra: null,
        saldos: await saldosActuales(tx, usuarioId),
      };
    }

    // Acción: aceptar
    const idsOrdenados = [...actual.participantes.map((p) => p.usuarioId)].sort((a, b) => a - b);
    for (const uid of idsOrdenados) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${uid})`;
    }

    const fila = actual.producto;
    const { precios, requisitos } = definicionEfectiva(fila);
    const personasMapa = await verificarAptitudTodos(
      tx,
      fila,
      precios,
      requisitos,
      idsOrdenados,
      actual.solicitanteId,
      ahora
    );

    const miPersona = personasMapa.get(usuarioId)!;
    const misCostos = leerCostos(miPart.costos);
    if (!alcanza({ costos: misCostos }, saldosDe(miPersona.u))) {
      throw new CompraError("No te alcanzan las monedas para cubrir tu parte de la compra.");
    }

    await tx.participanteCompraTienda.update({
      where: { id: miPart.id },
      data: { estado: "aceptada", respondidoEn: ahora },
    });

    const todasAceptadas = actual.participantes.every((p) => p.id === miPart.id || p.estado === "aceptada");
    if (!todasAceptadas) {
      const actualizada = await tx.compraCompartida.findUniqueOrThrow({
        where: { id: solicitudId },
        include: INCLUDE_COMPARTIDA,
      });
      return {
        solicitud: aVistaCompartida(actualizada),
        resultadoCompra: null,
        saldos: await saldosActuales(tx, usuarioId),
      };
    }

    // Todos aceptaron → validar distribución completa, debitar a cada participante y concretar la compra
    const costosTotales = leerCostos(actual.costosTotales);
    const val = validarDistribucion(
      costosTotales,
      actual.participantes.map((p) => {
        const per = personasMapa.get(p.usuarioId)!;
        return {
          usuarioId: p.usuarioId,
          costos: leerCostos(p.costos),
          saldos: saldosDe(per.u),
          nombre: per.u.nombre,
        };
      })
    );
    if (!val.ok) throw new CompraError(val.error);

    for (const part of actual.participantes) {
      const costosPart = leerCostos(part.costos);
      if (costosPart.length === 0) continue;
      const debito = await tx.usuario.updateMany({
        where: { id: part.usuarioId, ...camposMinimo(costosPart) },
        data: camposDebito(costosPart),
      });
      if (debito.count === 0) {
        throw new CompraError(`A ${part.usuario.nombre} no le alcanzan las monedas para cubrir su parte.`);
      }
    }

    if (fila.stockRestante !== null) {
      const stock = await tx.productoTienda.updateMany({
        where: { id: fila.id, stockRestante: { gt: 0 } },
        data: { stockRestante: { decrement: 1 } },
      });
      if (stock.count === 0) throw new CompraError(MENSAJES_ESTADO.agotado);
    }

    const nombresParticipantes = actual.participantes.map((p) => p.usuario.nombre).join(", ");
    const tipoSobre = sobreDeClave(fila.sistemaClave);
    let sobreResultado: Awaited<ReturnType<typeof comprarSobre>> | undefined;
    let recompensaId: number | null = null;
    const estadoCompra: "completada" | "pendiente_aprobacion" =
      !tipoSobre && fila.requiereAprobacion ? "pendiente_aprobacion" : "completada";

    if (tipoSobre) {
      const pts = costosTotales.find((c) => c.moneda === "puntos")?.monto ?? 0;
      const est = costosTotales.find((c) => c.moneda === "estrellas")?.monto ?? 0;
      const solicitante = personasMapa.get(actual.solicitanteId)!;
      sobreResultado = await abrirSobreEnTx(
        tx,
        actual.solicitanteId,
        tipoSobre,
        pts,
        est,
        descuentoDeUsuario(solicitante.u, ahora)
      );
    } else if (!fila.requiereAprobacion) {
      const rec = await entregar(tx, actual.solicitanteId, fila, nombresParticipantes);
      recompensaId = rec.id;
    }

    const compra = await tx.compraTienda.create({
      data: {
        productoId: fila.id,
        usuarioId: actual.solicitanteId,
        estado: estadoCompra,
        opcionPago: actual.opcionPago,
        costos: costosTotales as unknown as Prisma.InputJsonValue,
        productoSnapshot: {
          tipo: fila.tipo,
          titulo: fila.titulo,
          imagenUrl: fila.imagenClave,
          compartidaCon: nombresParticipantes,
        },
        recompensaId,
        claveIdempotencia: `compartida:${actual.id}`,
      },
    });

    const completada = await tx.compraCompartida.update({
      where: { id: solicitudId },
      data: { estado: "completada", compraId: compra.id, resueltaEn: ahora },
      include: INCLUDE_COMPARTIDA,
    });

    const nuevosSaldos = await saldosActuales(tx, usuarioId);
    return {
      solicitud: aVistaCompartida(completada),
      saldos: nuevosSaldos,
      resultadoCompra: {
        compraId: compra.id,
        tipo: fila.tipo,
        estado: estadoCompra,
        titulo: fila.titulo,
        costos: misCostos.length > 0 ? misCostos : costosTotales,
        saldos: nuevosSaldos,
        repetida: false,
        ...(sobreResultado ? { sobre: sobreResultado } : {}),
      },
    };
  });
}

// ─── Mis compras ───────────────────────────────────────────────────────────────────────────────────
export async function misCompras(usuarioId: number) {
  const compras = await prisma.compraTienda.findMany({
    where: {
      OR: [
        { usuarioId },
        { compraCompartida: { participantes: { some: { usuarioId } } } },
      ],
    },
    include: {
      compraCompartida: {
        include: {
          participantes: {
            include: { usuario: { select: { id: true, nombre: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return compras.map((c) => {
    const snap = c.productoSnapshot as { tipo: string; titulo: string; imagenUrl?: string | null };
    const miPart = c.compraCompartida?.participantes.find((p) => p.usuarioId === usuarioId);
    const costosMostrados = miPart ? leerCostos(miPart.costos) : leerCostos(c.costos);
    const compartidaCon = c.compraCompartida
      ? c.compraCompartida.participantes.map((p) => p.usuario.nombre)
      : null;
    return {
      id: c.id,
      estado: c.estado,
      titulo: snap.titulo,
      tipo: snap.tipo,
      imagenUrl: snap.imagenUrl ?? null,
      costos: costosMostrados,
      costosTotales: leerCostos(c.costos),
      compartidaCon,
      motivo: c.motivo,
      createdAt: c.createdAt.toISOString(),
    };
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
  recompensaId: number | null;
  usuario: { id: number; nombre: string; fotoUrl: string | null };
  compartida?: {
    participantes: { id: number; nombre: string; fotoUrl: string | null; costos: Costo[] }[];
  } | null;
};

export async function listarComprasAdmin(rol?: string): Promise<CompraAdminVista[]> {
  exigirPadre(rol);
  const compras = await prisma.compraTienda.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      usuario: { select: { id: true, nombre: true, fotoUrl: true } },
      compraCompartida: {
        include: {
          participantes: {
            include: { usuario: { select: { id: true, nombre: true, fotoUrl: true } } },
          },
        },
      },
    },
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
      recompensaId: c.recompensaId,
      usuario: c.usuario,
      compartida: c.compraCompartida
        ? {
            participantes: c.compraCompartida.participantes.map((p) => ({
              id: p.usuario.id,
              nombre: p.usuario.nombre,
              fotoUrl: p.usuario.fotoUrl,
              costos: leerCostos(p.costos),
            })),
          }
        : null,
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
    const c = await tx.compraTienda.findUnique({
      where: { id },
      include: {
        producto: true,
        compraCompartida: {
          include: {
            participantes: { include: { usuario: { select: { nombre: true } } } },
          },
        },
      },
    });
    if (!c) throw new NoEncontradoError("Compra no encontrada");
    const costos = leerCostos(c.costos);

    if (accion === "aprobar") {
      if (c.estado !== "pendiente_aprobacion") throw new CompraError("Esta compra no está esperando aprobación");
      const compartidoCon = c.compraCompartida
        ? c.compraCompartida.participantes.map((p) => p.usuario.nombre).join(", ")
        : null;
      const rec = await entregar(tx, c.usuarioId, c.producto, compartidoCon);
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

    // Si fue compra compartida, se reembolsa a cada participante exactamente lo que aportó
    if (c.compraCompartida) {
      for (const part of c.compraCompartida.participantes) {
        const costosPart = leerCostos(part.costos);
        if (costosPart.length > 0) {
          await tx.usuario.update({ where: { id: part.usuarioId }, data: camposReembolso(costosPart) });
        }
      }
      await tx.compraCompartida.update({
        where: { id: c.compraCompartida.id },
        data: { estado: accion === "rechazar" ? "rechazada" : "cancelada", resueltaEn: new Date() },
      });
    } else {
      await tx.usuario.update({ where: { id: c.usuarioId }, data: camposReembolso(costos) });
    }

    if (c.producto.stockRestante !== null) await tx.productoTienda.update({ where: { id: c.productoId }, data: { stockRestante: { increment: 1 } } });
    const estado = accion === "rechazar" ? "rechazada" : "cancelada";
    await tx.compraTienda.update({ where: { id }, data: { estado, motivo: motivo?.slice(0, 200) || null, resueltaPorId: actor.id, resueltaEn: new Date() } });
    return { estado };
  });
}
