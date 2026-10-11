// Servicios del servidor para cartas católicas (Lane 31)
// Persistencia, transacciones atómicas, D13 y eventos litúrgicos

import type { Prisma } from "@prisma/client";
import prisma from "../prisma.ts";
import {
  CARTAS_BIENVENIDA,
  RAREZAS_CUMPLE,
  SOBRE_MEDITACION,
  SOBRE_REVELACION,
  TOPE_DIARIO_FRAGMENTOS_PUNTOS,
  precioFragmentoEnPuntos,
  precioFragmentoEnIncienso,
  type CategoriaCarta,
  type GradoCarta,
  type RarezaCarta,
} from "./economia.ts";
import {
  aplicarFragmentos,
  gradoDe,
  gradoVisible,
  imagenDeGrado,
  type CartaConImagenes,
} from "./fragmentos.ts";
import {
  contenidoVisible,
  type ContenidoCartaVisible,
  type CartaCompletaEntrada,
} from "./revelado.ts";
import {
  sortearBienvenida,
  sortearSobreMeditacion,
  sortearSobreRevelacion,
  type FragmentoOtorgado,
  type RngFn,
} from "./sorteo.ts";
import {
  hoyMesDiaEnTz,
  hoyAnioEnTz,
  esFiestaHoy,
  regaloFiesta,
  esCumpleHoy,
  regaloCumple,
  multiplicadorTienda,
  inicioDelDiaEnTz,
  diasHastaFiesta,
  APP_TZ,
} from "./eventos.ts";
import { esquemaCartaAdmin, generarClaveSlug } from "./esquema.ts";
import { ordenarCartas } from "./orden.ts";
import { TEXTOS_CARTAS } from "./textos.ts";

/** Período del reclamo de bienvenida (D23): uno solo por usuario, para siempre */
const PERIODO_BIENVENIDA = "inicio";

type TipoMovimiento = "Sobre" | "Compra" | "CompraIncienso" | "Fiesta" | "Cumpleanos" | "Bienvenida";

/** Lo que hace falta de una carta para sumarle fragmentos */
const SELECT_OTORGABLE = {
  id: true,
  clave: true,
  nombre: true,
  rareza: true,
  fragmentosRequeridos: true,
  celebracion: true,
  imagenUrl: true,
  imagenGrado2Url: true,
  imagenGrado3Url: true,
  imagenGrado4Url: true,
} as const;

interface CartaOtorgable extends CartaConImagenes {
  id: number;
  clave: string;
  nombre: string;
  rareza: RarezaCarta;
  fragmentosRequeridos: number;
}

/** Resultado de sumar fragmentos a una carta; misma forma que espera el modal de apertura */
export interface FragmentosOtorgados {
  cartaId: number;
  cartaClave: string;
  nombre: string;
  rareza: RarezaCarta;
  cantidadBase: number;
  cantidadFinal: number;
  bonoFiestaAplicado: boolean;
  fragmentosAntes: number;
  fragmentosDespues: number;
  desbloquea: boolean;
  gradoAntes: GradoCarta;
  gradoDespues: GradoCarta;
  imagenUrl: string; // arte del grado que se ve (D19), nunca el de un grado sin reclamar
  reclamable: boolean; // quedó un grado alcanzado sin reclamar (D20)
  excedente: number;
  inciensoGanado: number;
}

interface CartaPrismaRow {
  id: number;
  clave: string;
  nombre: string;
  subtitulo?: string | null;
  categoria: CategoriaCarta;
  rareza: RarezaCarta;
  celebracion?: string | null;
  historia: string;
  oracion: string;
  frase: string;
  fraseAutor?: string | null;
  datasheet: unknown;
  fragmentosRequeridos: number;
  imagenUrl: string;
  imagenGrado2Url?: string | null;
  imagenGrado3Url?: string | null;
  imagenGrado4Url?: string | null;
  creditoImagen?: string | null;
  activa: boolean;
}

/** Helper para convertir modelo Carta de Prisma a formato para contenidoVisible */
function adaptarCartaPrisma(carta: CartaPrismaRow): CartaCompletaEntrada {
  return {
    id: carta.id,
    clave: carta.clave,
    nombre: carta.nombre,
    subtitulo: carta.subtitulo,
    categoria: carta.categoria,
    rareza: carta.rareza,
    celebracion: carta.celebracion,
    historia: carta.historia,
    oracion: carta.oracion,
    frase: carta.frase,
    fraseAutor: carta.fraseAutor,
    datasheet: Array.isArray(carta.datasheet) ? carta.datasheet : [],
    fragmentosRequeridos: carta.fragmentosRequeridos,
    imagenUrl: carta.imagenUrl,
    imagenGrado2Url: carta.imagenGrado2Url,
    imagenGrado3Url: carta.imagenGrado3Url,
    imagenGrado4Url: carta.imagenGrado4Url,
    creditoImagen: carta.creditoImagen,
    activa: carta.activa,
  };
}

/** Carta del álbum: contenido redactado (D13) y si hoy es su fiesta sin reclamar (D21) */
export type CartaListada = ContenidoCartaVisible & { fiestaHoy: boolean };

/**
 * 1. Obtener catálogo completo con progreso para un usuario (D13).
 * SEGURIDAD: Todos los contenidos son redactados según los fragmentos del usuario.
 */
export async function listarCartasUsuario(usuarioId: number) {
  const [cartasDb, coleccionUsuario, usuario, reclamosFiesta] = await Promise.all([
    prisma.carta.findMany({
      where: { activa: true },
      orderBy: [{ rareza: "asc" }, { nombre: "asc" }],
    }),
    prisma.cartaUsuario.findMany({
      where: { usuarioId },
    }),
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { availablePoints: true, incienso: true },
    }),
    prisma.reclamoCarta.findMany({
      where: { usuarioId, tipo: "Fiesta", periodo: hoyAnioEnTz(new Date(), APP_TZ) },
      select: { cartaId: true },
    }),
  ]);
  const fiestasReclamadas = new Set(reclamosFiesta.map((r) => r.cartaId));

  const progresoPorCarta = new Map(coleccionUsuario.map((cu) => [cu.cartaId, cu]));
  const ahora = new Date();

  const cartasOrdenadas = ordenarCartas(cartasDb);

  const cartasVisibles: CartaListada[] = cartasOrdenadas.map((carta) => {
    const progreso = progresoPorCarta.get(carta.id);
    const adaptada = adaptarCartaPrisma(carta);
    return {
      ...contenidoVisible(adaptada, progreso?.fragmentos ?? 0, progreso?.gradoReclamado ?? 0),
      // D21: la fiesta de hoy se reclama aparte; si ya se reclamó, el banner no la muestra
      fiestaHoy: esFiestaHoy(carta.celebracion, ahora, APP_TZ) && !fiestasReclamadas.has(carta.id),
    };
  });

  return {
    cartas: cartasVisibles,
    usuario: {
      availablePoints: usuario?.availablePoints ?? 0,
      incienso: usuario?.incienso ?? 0,
    },
  };
}

/**
 * 2. Obtener detalle de una carta por clave (D13).
 * Si esAdmin es true, devuelve además las 4 URLs de imagen para la vista previa de edición.
 */
export async function obtenerDetalleCarta(
  usuarioId: number,
  clave: string,
  opciones?: { esAdmin?: boolean }
) {
  const [cartaDb, cartasLista, sumIncienso] = await Promise.all([
    prisma.carta.findUnique({
      where: { clave },
    }),
    prisma.carta.findMany({
      where: { activa: true },
      select: { clave: true, categoria: true },
    }),
    prisma.movimientoFragmento.aggregate({
      where: {
        usuarioId,
        carta: { clave },
        inciensoDelta: { gt: 0 },
      },
      _sum: { inciensoDelta: true },
    }),
  ]);

  if (!cartaDb || !cartaDb.activa) {
    return null;
  }

  const cartaUsuario = await prisma.cartaUsuario.findUnique({
    where: {
      usuarioId_cartaId: {
        usuarioId,
        cartaId: cartaDb.id,
      },
    },
  });

  const fragmentos = cartaUsuario?.fragmentos ?? 0;
  const adaptada = adaptarCartaPrisma(cartaDb);
  const visible = contenidoVisible(adaptada, fragmentos, cartaUsuario?.gradoReclamado ?? 0);
  const ahora = new Date();
  const fiestaHoy =
    esFiestaHoy(cartaDb.celebracion, ahora, APP_TZ) &&
    !(await prisma.reclamoCarta.findUnique({
      where: {
        usuarioId_tipo_cartaId_periodo: {
          usuarioId,
          tipo: "Fiesta",
          cartaId: cartaDb.id,
          periodo: hoyAnioEnTz(ahora, APP_TZ),
        },
      },
    }));

  // Navegación secuencial dentro del catálogo siguiendo el orden litúrgico
  const listaOrdenada = ordenarCartas(cartasLista);
  const idx = listaOrdenada.findIndex((c) => c.clave === clave);
  const anterior = idx > 0 ? listaOrdenada[idx - 1].clave : null;
  const siguiente = idx >= 0 && idx < listaOrdenada.length - 1 ? listaOrdenada[idx + 1].clave : null;

  // Formateo y conteo de días hasta la celebración litúrgica
  let diasHastaCelebracion: number | null = null;
  let textoCelebracion: string | null = null;
  if (cartaDb.celebracion) {
    const [mm, dd] = cartaDb.celebracion.split("-").map(Number);
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ];
    const nombreMes = meses[mm - 1] || "";
    const diaMesTexto = `${dd} de ${nombreMes}`;

    diasHastaCelebracion = diasHastaFiesta(cartaDb.celebracion, new Date(), APP_TZ);
    textoCelebracion =
      diasHastaCelebracion === 0
        ? `${diaMesTexto} · ¡Hoy es la fiesta!`
        : `${diaMesTexto} · Faltan ${diasHastaCelebracion} días`;
  }

  // Progreso hacia el siguiente grado
  const req = cartaDb.fragmentosRequeridos;
  const topeFragmentos = req * 3;
  let siguienteGrado: number | null = null;
  let fragmentosParaSiguienteGrado = 0;

  if (fragmentos < req) {
    siguienteGrado = 1;
    fragmentosParaSiguienteGrado = req - fragmentos;
  } else if (fragmentos < Math.floor(req * 1.5)) {
    siguienteGrado = 2;
    fragmentosParaSiguienteGrado = Math.floor(req * 1.5) - fragmentos;
  } else if (fragmentos < req * 2) {
    siguienteGrado = 3;
    fragmentosParaSiguienteGrado = req * 2 - fragmentos;
  } else if (fragmentos < req * 3) {
    siguienteGrado = 4;
    fragmentosParaSiguienteGrado = req * 3 - fragmentos;
  } else {
    siguienteGrado = null;
    fragmentosParaSiguienteGrado = 0;
  }

  const detalleEnriquecido = {
    ...visible,
    fiestaHoy,
    topeFragmentos,
    siguienteGrado,
    fragmentosParaSiguienteGrado,
    inciensoGanado: sumIncienso._sum.inciensoDelta ?? 0,
    diasHastaCelebracion,
    textoCelebracion,
    navegacion: {
      anterior,
      siguiente,
    },
  };

  if (opciones?.esAdmin) {
    return {
      ...detalleEnriquecido,
      adminImagenes: {
        imagenUrl: cartaDb.imagenUrl,
        imagenGrado2Url: cartaDb.imagenGrado2Url,
        imagenGrado3Url: cartaDb.imagenGrado3Url,
        imagenGrado4Url: cartaDb.imagenGrado4Url,
      },
    };
  }

  return detalleEnriquecido;
}

/**
 * Suma fragmentos a una carta del usuario dentro de una transacción y registra el movimiento.
 * D20: el grado solo sube si `reclamar` (fiesta, cumpleaños, bienvenida). En sobres y compras
 * queda pendiente y la carta pasa a "lista para reclamar". El excedente sobre el tope va al Incienso.
 */
async function otorgarFragmentos(
  tx: Prisma.TransactionClient,
  usuarioId: number,
  carta: CartaOtorgable,
  cantidad: number,
  movimiento: {
    tipo: TipoMovimiento;
    detalle: string;
    puntosGastados?: number;
    inciensoGastado?: number;
    cantidadBase?: number;
    bonoFiestaAplicado?: boolean;
  },
  reclamar: boolean
): Promise<FragmentosOtorgados> {
  const actual = await tx.cartaUsuario.findUnique({
    where: { usuarioId_cartaId: { usuarioId, cartaId: carta.id } },
  });
  const req = carta.fragmentosRequeridos;
  const fragmentosAntes = actual?.fragmentos ?? 0;
  const reclamadoAntes = actual?.gradoReclamado ?? 0;
  const res = aplicarFragmentos(fragmentosAntes, req, carta.rareza, cantidad);

  const gradoReclamado = reclamar ? Math.max(reclamadoAntes, res.gradoDespues) : reclamadoAntes;
  const gradoAntes = gradoVisible(fragmentosAntes, req, reclamadoAntes);
  const gradoDespues = gradoVisible(res.nuevo, req, gradoReclamado);
  const desbloqueadaEn = actual?.desbloqueadaEn ?? (gradoDespues >= 1 ? new Date() : null);

  await tx.cartaUsuario.upsert({
    where: { usuarioId_cartaId: { usuarioId, cartaId: carta.id } },
    create: { usuarioId, cartaId: carta.id, fragmentos: res.nuevo, gradoReclamado, desbloqueadaEn },
    update: { fragmentos: res.nuevo, gradoReclamado, desbloqueadaEn },
  });

  await tx.movimientoFragmento.create({
    data: {
      usuarioId,
      cartaId: carta.id,
      tipo: movimiento.tipo,
      cantidad,
      puntosGastados: movimiento.puntosGastados ?? 0,
      inciensoDelta: res.incienso - (movimiento.inciensoGastado ?? 0),
      detalle: movimiento.detalle,
    },
  });

  if (res.incienso > 0) {
    await tx.usuario.update({
      where: { id: usuarioId },
      data: { incienso: { increment: res.incienso } },
    });
  }

  return {
    cartaId: carta.id,
    cartaClave: carta.clave,
    nombre: carta.nombre,
    rareza: carta.rareza,
    cantidadBase: movimiento.cantidadBase ?? cantidad,
    cantidadFinal: cantidad,
    bonoFiestaAplicado: movimiento.bonoFiestaAplicado ?? false,
    fragmentosAntes,
    fragmentosDespues: res.nuevo,
    desbloquea: gradoAntes === 0 && gradoDespues >= 1,
    gradoAntes,
    gradoDespues,
    imagenUrl: imagenDeGrado(carta, gradoDespues),
    reclamable: res.gradoDespues > gradoReclamado,
    excedente: res.excedente,
    inciensoGanado: res.incienso,
  };
}

/** Aplica los fragmentos de un sobre ya sorteado. Los grados quedan pendientes de reclamar (D20). */
async function aplicarSobre(
  tx: Prisma.TransactionClient,
  usuarioId: number,
  items: FragmentoOtorgado[],
  pool: Array<CartaOtorgable & { celebracion: string | null }>,
  nombreSobre: string,
  costo: number
): Promise<FragmentosOtorgados[]> {
  const ahora = new Date();
  const cartasAfectadas: FragmentosOtorgados[] = [];
  for (const item of items) {
    const carta = pool.find((c) => c.id === item.cartaId)!;
    // D17: Bono de fiesta en tienda (×1.5 redondeo hacia arriba)
    const esFiesta = esFiestaHoy(carta.celebracion, ahora, APP_TZ);
    const cantidadFinal = esFiesta
      ? Math.ceil(item.cantidad * multiplicadorTienda(carta.celebracion, ahora, APP_TZ))
      : item.cantidad;
    cartasAfectadas.push(
      await otorgarFragmentos(
        tx,
        usuarioId,
        carta,
        cantidadFinal,
        {
          tipo: "Sobre",
          detalle: `${nombreSobre} (${esFiesta ? "Bono festividad ×1,5" : "Base"})`,
          puntosGastados: Math.round(costo / items.length),
          cantidadBase: item.cantidad,
          bonoFiestaAplicado: esFiesta,
        },
        false
      )
    );
  }
  return cartasAfectadas;
}

/**
 * 3. Comprar sobre de cartas (Meditación o Revelación) en transacción atómica.
 */
export async function comprarSobre(
  usuarioId: number,
  tipoSobre: "meditacion" | "revelacion",
  rng?: RngFn
) {
  const config = tipoSobre === "meditacion" ? SOBRE_MEDITACION : SOBRE_REVELACION;
  const costo = config.costoPuntos;

  return await prisma.$transaction(async (tx) => {
    // 1. Verificar y bloquear saldo del usuario
    const usuario = await tx.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, availablePoints: true, incienso: true },
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    if (usuario.availablePoints < costo) {
      throw new Error(`Puntos insuficientes. Necesitás ${costo} puntos y tenés ${usuario.availablePoints}.`);
    }

    // 2. Obtener pool de cartas activas para el sorteo
    const cartasPoolDb = await tx.carta.findMany({
      where: { activa: true },
      select: SELECT_OTORGABLE,
    });

    if (cartasPoolDb.length === 0) {
      throw new Error("No hay cartas disponibles en la tienda");
    }

    // 3. Ejecutar sorteo puro
    const resultadoSobre =
      tipoSobre === "meditacion"
        ? sortearSobreMeditacion(cartasPoolDb, rng)
        : sortearSobreRevelacion(cartasPoolDb, rng);

    // 4. Descontar puntos solo si todavía alcanzan (dos compras simultáneas no dejan el saldo en negativo)
    const descuento = await tx.usuario.updateMany({
      where: { id: usuarioId, availablePoints: { gte: costo } },
      data: { availablePoints: { decrement: costo } },
    });
    if (descuento.count === 0) {
      throw new Error(`Puntos insuficientes. Necesitás ${costo} puntos.`);
    }

    // 5. Aplicar cada fragmento otorgado
    const cartasAfectadas = await aplicarSobre(
      tx,
      usuarioId,
      resultadoSobre.items,
      cartasPoolDb,
      config.nombre,
      costo
    );

    const usuarioActualizado = await tx.usuario.findUnique({
      where: { id: usuarioId },
      select: { availablePoints: true, incienso: true },
    });

    return {
      tipoSobre,
      nombreSobre: config.nombre,
      puntosGastados: costo,
      nuevoSaldoPuntos: usuarioActualizado?.availablePoints ?? 0,
      nuevoSaldoIncienso: usuarioActualizado?.incienso ?? 0,
      totalInciensoGanado: cartasAfectadas.reduce((s, c) => s + c.inciensoGanado, 0),
      cartasAfectadas,
    };
  });
}

/**
 * 4. Comprar fragmentos directos de una carta con puntos o Granos de Incienso.
 */
export async function comprarFragmentosDirectos(
  usuarioId: number,
  cartaId: number,
  cantidad: number,
  moneda: "puntos" | "incienso"
) {
  if (cantidad <= 0 || !Number.isInteger(cantidad)) {
    throw new Error("La cantidad debe ser un número entero positivo");
  }

  return await prisma.$transaction(async (tx) => {
    const carta = await tx.carta.findUnique({
      where: { id: cartaId },
    });

    if (!carta || !carta.activa) {
      throw new Error("Carta no encontrada o no disponible");
    }

    const usuario = await tx.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, availablePoints: true, incienso: true },
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    const ahora = new Date();
    const hoyInicio = inicioDelDiaEnTz(ahora, APP_TZ);

    let costoTotal = 0;

    if (moneda === "puntos") {
      // D2: Tope de 10 fragmentos por carta y día pagando con puntos. Se cuenta lo comprado
      // (puntos gastados / precio), no lo recibido: el bono de fiesta no consume el tope.
      const comprasHoy = await tx.movimientoFragmento.aggregate({
        where: {
          usuarioId,
          cartaId,
          tipo: "Compra",
          createdAt: { gte: hoyInicio },
        },
        _sum: { puntosGastados: true },
      });

      const fragmentosCompradosHoy = Math.round(
        (comprasHoy._sum.puntosGastados ?? 0) / precioFragmentoEnPuntos(carta.rareza)
      );
      if (fragmentosCompradosHoy + cantidad > TOPE_DIARIO_FRAGMENTOS_PUNTOS) {
        const disponiblesHoy = Math.max(0, TOPE_DIARIO_FRAGMENTOS_PUNTOS - fragmentosCompradosHoy);
        throw new Error(
          `Superaste el límite diario de ${TOPE_DIARIO_FRAGMENTOS_PUNTOS} fragmentos con puntos para esta carta. Te quedan ${disponiblesHoy} hoy.`
        );
      }

      costoTotal = cantidad * precioFragmentoEnPuntos(carta.rareza);
      if (usuario.availablePoints < costoTotal) {
        throw new Error(`Puntos insuficientes. Necesitás ${costoTotal} puntos y tenés ${usuario.availablePoints}.`);
      }

      const descuento = await tx.usuario.updateMany({
        where: { id: usuarioId, availablePoints: { gte: costoTotal } },
        data: { availablePoints: { decrement: costoTotal } },
      });
      if (descuento.count === 0) {
        throw new Error(`Puntos insuficientes. Necesitás ${costoTotal} puntos.`);
      }
    } else {
      // moneda === "incienso"
      costoTotal = cantidad * precioFragmentoEnIncienso(carta.rareza);
      if (usuario.incienso < costoTotal) {
        throw new Error(
          `Incienso insuficiente. Necesitás ${costoTotal} Granos de Incienso y tenés ${usuario.incienso}.`
        );
      }

      const descuento = await tx.usuario.updateMany({
        where: { id: usuarioId, incienso: { gte: costoTotal } },
        data: { incienso: { decrement: costoTotal } },
      });
      if (descuento.count === 0) {
        throw new Error(`Incienso insuficiente. Necesitás ${costoTotal} Granos de Incienso.`);
      }
    }

    // D17: Si hoy es fiesta, multiplicar fragmentos otorgados ×1.5
    const esFiesta = esFiestaHoy(carta.celebracion, ahora, APP_TZ);
    const cantidadFinal = esFiesta
      ? Math.ceil(cantidad * multiplicadorTienda(carta.celebracion, ahora, APP_TZ))
      : cantidad;

    const otorgado = await otorgarFragmentos(
      tx,
      usuarioId,
      carta,
      cantidadFinal,
      {
        tipo: moneda === "puntos" ? "Compra" : "CompraIncienso",
        detalle: `Compra directa (${moneda})${esFiesta ? " · Bono fiesta ×1,5" : ""}`,
        puntosGastados: moneda === "puntos" ? costoTotal : 0,
        inciensoGastado: moneda === "incienso" ? costoTotal : 0,
        cantidadBase: cantidad,
        bonoFiestaAplicado: esFiesta,
      },
      false
    );

    const usuarioFinal = await tx.usuario.findUnique({
      where: { id: usuarioId },
      select: { availablePoints: true, incienso: true },
    });

    return {
      cartaId,
      clave: carta.clave,
      nombre: carta.nombre,
      moneda,
      costo: costoTotal,
      cantidadComprada: cantidad,
      cantidadFinal,
      bonoFiestaAplicado: esFiesta,
      fragmentosAntes: otorgado.fragmentosAntes,
      fragmentosDespues: otorgado.fragmentosDespues,
      imagenUrl: otorgado.imagenUrl,
      desbloquea: otorgado.desbloquea,
      gradoAntes: otorgado.gradoAntes,
      gradoDespues: otorgado.gradoDespues,
      reclamable: otorgado.reclamable,
      excedente: otorgado.excedente,
      inciensoGanado: otorgado.inciensoGanado,
      nuevoSaldoPuntos: usuarioFinal?.availablePoints ?? 0,
      nuevoSaldoIncienso: usuarioFinal?.incienso ?? 0,
    };
  });
}

/**
 * 5. Reclamar el regalo de la fiesta litúrgica (D21) de una carta celebrada hoy: la carta
 * entera (+100 %), ya reclamada. Una vez por (usuario, carta, año).
 */
export async function reclamarFiesta(usuarioId: number, cartaId: number) {
  const ahora = new Date();
  const periodo = hoyAnioEnTz(ahora, APP_TZ);

  return await prisma.$transaction(async (tx) => {
    const carta = await tx.carta.findUnique({
      where: { id: cartaId },
    });

    if (!carta || !carta.activa) {
      throw new Error("Carta no encontrada");
    }

    if (!esFiestaHoy(carta.celebracion, ahora, APP_TZ)) {
      throw new Error("Hoy no se celebra la festividad de esta carta");
    }

    const reclamoPrevio = await tx.reclamoCarta.findUnique({
      where: {
        usuarioId_tipo_cartaId_periodo: { usuarioId, tipo: "Fiesta", cartaId, periodo },
      },
    });

    if (reclamoPrevio) {
      throw new Error("El regalo de esta fiesta ya fue reclamado este año");
    }

    // La clave única hace fallar un segundo reclamo simultáneo
    await tx.reclamoCarta.create({
      data: { usuarioId, cartaId, tipo: "Fiesta", periodo },
    });

    const otorgado = await otorgarFragmentos(
      tx,
      usuarioId,
      carta,
      regaloFiesta(carta.fragmentosRequeridos),
      { tipo: "Fiesta", detalle: `Regalo de la fiesta litúrgica (${periodo})` },
      true
    );

    return {
      tipo: "fiesta" as const,
      mensaje: `¡Gloria a Dios! Recibiste la carta de ${carta.nombre}.`,
      ...otorgado,
      fragmentosGanados: otorgado.cantidadFinal,
      cartasAfectadas: [otorgado],
    };
  });
}

/** Cartas que el usuario puede elegir en su cumpleaños (D22): sin desbloquear, hasta Perfecta */
async function cartasElegiblesCumple(tx: Prisma.TransactionClient | typeof prisma, usuarioId: number) {
  const [cartas, propias] = await Promise.all([
    tx.carta.findMany({
      where: { activa: true, rareza: { in: [...RAREZAS_CUMPLE] } },
      select: { ...SELECT_OTORGABLE, categoria: true, celebracion: true, imagenUrl: true },
    }),
    tx.cartaUsuario.findMany({
      where: { usuarioId },
      select: { cartaId: true, fragmentos: true },
    }),
  ]);
  const fragmentos = new Map(propias.map((p) => [p.cartaId, p.fragmentos]));
  return ordenarCartas(
    cartas.filter((c) => gradoDe(fragmentos.get(c.id) ?? 0, c.fragmentosRequeridos) === 0)
  ).map((c) => ({ ...c, fragmentos: fragmentos.get(c.id) ?? 0 }));
}

/**
 * 6. Reclamar el regalo de cumpleaños (D22). Una vez por año.
 * - El usuario elige `cartaId` entre las que no tiene desbloqueadas (Común, Buena o Perfecta)
 *   y recibe los fragmentos que le faltan para el 100 %, ya reclamada.
 * - Si no le queda ninguna elegible: un Sobre de Revelación gratis.
 */
export async function reclamarCumpleanos(
  usuarioId: number,
  cartaId?: number | null,
  rng?: RngFn
) {
  const ahora = new Date();
  const periodo = hoyAnioEnTz(ahora, APP_TZ);

  return await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, fechaNacimiento: true },
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    if (!esCumpleHoy(usuario.fechaNacimiento, ahora, APP_TZ)) {
      throw new Error("Hoy no es tu cumpleaños");
    }

    const yaReclamo = await tx.reclamoCarta.findFirst({
      where: { usuarioId, tipo: "Cumpleanos", periodo },
    });

    if (yaReclamo) {
      throw new Error("El regalo de cumpleaños ya fue reclamado este año");
    }

    const elegibles = await cartasElegiblesCumple(tx, usuarioId);

    if (elegibles.length > 0) {
      const elegida = elegibles.find((c) => c.id === cartaId);
      if (!elegida) {
        throw new Error("Elegí una carta que todavía no tengas (Común, Buena o Perfecta)");
      }

      await tx.reclamoCarta.create({
        data: { usuarioId, cartaId: elegida.id, tipo: "Cumpleanos", periodo },
      });

      const otorgado = await otorgarFragmentos(
        tx,
        usuarioId,
        elegida,
        regaloCumple(elegida.fragmentosRequeridos, elegida.fragmentos),
        { tipo: "Cumpleanos", detalle: `Regalo de cumpleaños (${periodo})` },
        true
      );

      return {
        tipo: "carta_elegida" as const,
        mensaje: `¡Feliz cumpleaños! Recibiste la carta de ${elegida.nombre}.`,
        cartasAfectadas: [otorgado],
        totalInciensoGanado: 0,
      };
    }

    // Regalo alternativo: Sobre de Revelación gratis
    await tx.reclamoCarta.create({
      data: { usuarioId, cartaId: 0, tipo: "Cumpleanos", periodo },
    });

    const pool = await tx.carta.findMany({
      where: { activa: true },
      select: SELECT_OTORGABLE,
    });
    const resSobre = sortearSobreRevelacion(pool, rng);
    const cartasAfectadas = await aplicarSobre(
      tx,
      usuarioId,
      resSobre.items,
      pool,
      `Regalo de cumpleaños: ${resSobre.nombreSobre} (${periodo})`,
      0
    );

    return {
      tipo: "sobre_revelacion_gratis" as const,
      mensaje: "¡Feliz cumpleaños! Recibiste un Sobre de Revelación gratis.",
      sobre: resSobre.nombreSobre,
      cartasAfectadas,
      totalInciensoGanado: cartasAfectadas.reduce((s, c) => s + c.inciensoGanado, 0),
    };
  });
}

/**
 * 7. Regalo de bienvenida (D23): 3 cartas Comunes distintas al azar, enteras y ya reclamadas.
 * Una sola vez por usuario. Se prefieren Comunes que todavía no tenga.
 */
export async function reclamarBienvenida(usuarioId: number, rng?: RngFn) {
  return await prisma.$transaction(async (tx) => {
    const previo = await tx.reclamoCarta.findUnique({
      where: {
        usuarioId_tipo_cartaId_periodo: {
          usuarioId,
          tipo: "Bienvenida",
          cartaId: 0,
          periodo: PERIODO_BIENVENIDA,
        },
      },
    });
    if (previo) {
      throw new Error("Ya reclamaste tu regalo de bienvenida");
    }

    await tx.reclamoCarta.create({
      data: { usuarioId, cartaId: 0, tipo: "Bienvenida", periodo: PERIODO_BIENVENIDA },
    });

    const [comunes, propias] = await Promise.all([
      tx.carta.findMany({ where: { activa: true, rareza: "Comun" }, select: SELECT_OTORGABLE }),
      tx.cartaUsuario.findMany({
        where: { usuarioId, gradoReclamado: { gte: 1 } },
        select: { cartaId: true },
      }),
    ]);
    const tiene = new Set(propias.map((p) => p.cartaId));
    const nuevas = comunes.filter((c) => !tiene.has(c.id));
    const pool = nuevas.length >= CARTAS_BIENVENIDA ? nuevas : comunes;
    const elegidas = sortearBienvenida(pool, CARTAS_BIENVENIDA, rng);
    if (elegidas.length === 0) {
      throw new Error("No hay cartas comunes disponibles");
    }

    const cartasAfectadas: FragmentosOtorgados[] = [];
    for (const carta of elegidas) {
      cartasAfectadas.push(
        await otorgarFragmentos(
          tx,
          usuarioId,
          carta,
          carta.fragmentosRequeridos,
          { tipo: "Bienvenida", detalle: "Regalo de bienvenida" },
          true
        )
      );
    }

    return {
      tipo: "bienvenida" as const,
      mensaje: `¡Bienvenido! Recibiste ${cartasAfectadas.length} cartas.`,
      cartasAfectadas,
      totalInciensoGanado: cartasAfectadas.reduce((s, c) => s + c.inciensoGanado, 0),
    };
  });
}

/**
 * 8. Reclamar los grados que ya alcanzan los fragmentos de una carta (D20). Si saltó varios
 * grados, se reclaman juntos. Idempotente ante doble clic.
 */
export async function reclamarGrado(usuarioId: number, cartaId: number) {
  return await prisma.$transaction(async (tx) => {
    const carta = await tx.carta.findUnique({ where: { id: cartaId }, select: { ...SELECT_OTORGABLE, activa: true } });
    if (!carta || !carta.activa) {
      throw new Error("Carta no encontrada");
    }

    const cu = await tx.cartaUsuario.findUnique({
      where: { usuarioId_cartaId: { usuarioId, cartaId } },
    });
    const disponible = gradoDe(cu?.fragmentos ?? 0, carta.fragmentosRequeridos);
    if (!cu || disponible <= cu.gradoReclamado) {
      throw new Error("Esta carta no tiene nada para reclamar");
    }

    const actualizado = await tx.cartaUsuario.updateMany({
      where: { id: cu.id, gradoReclamado: cu.gradoReclamado },
      data: { gradoReclamado: disponible, desbloqueadaEn: cu.desbloqueadaEn ?? new Date() },
    });
    if (actualizado.count === 0) {
      throw new Error("Esta carta ya fue reclamada");
    }

    const otorgado: FragmentosOtorgados = {
      cartaId,
      cartaClave: carta.clave,
      nombre: carta.nombre,
      rareza: carta.rareza,
      cantidadBase: 0,
      cantidadFinal: 0,
      bonoFiestaAplicado: false,
      fragmentosAntes: cu.fragmentos,
      fragmentosDespues: cu.fragmentos,
      desbloquea: cu.gradoReclamado === 0,
      gradoAntes: cu.gradoReclamado as GradoCarta,
      gradoDespues: disponible,
      imagenUrl: imagenDeGrado(carta, disponible),
      reclamable: false,
      excedente: 0,
      inciensoGanado: 0,
    };

    return {
      tipo: "grado" as const,
      mensaje:
        cu.gradoReclamado === 0
          ? `¡Desbloqueaste a ${carta.nombre}!`
          : `${carta.nombre} subió a Grado ${TEXTOS_CARTAS.gradosRomanos[disponible]}.`,
      cartasAfectadas: [otorgado],
      totalInciensoGanado: 0,
    };
  });
}

/** Cartas con un grado alcanzado y sin reclamar (D20) */
async function contarGradosPendientes(usuarioId: number): Promise<number> {
  const filas = await prisma.cartaUsuario.findMany({
    where: { usuarioId, carta: { activa: true } },
    select: { fragmentos: true, gradoReclamado: true, carta: { select: { fragmentosRequeridos: true } } },
  });
  return filas.filter((f) => gradoDe(f.fragmentos, f.carta.fragmentosRequeridos) > f.gradoReclamado).length;
}

/**
 * 9. Consulta de regalos pendientes para hoy: fiestas, cumpleaños, bienvenida y grados por reclamar.
 */
export async function eventosDeHoy(usuarioId: number) {
  const ahora = new Date();
  const hoyMMdd = hoyMesDiaEnTz(ahora, APP_TZ);
  const periodo = hoyAnioEnTz(ahora, APP_TZ);

  const [usuario, cartasFiesta, reclamosUsuario, gradosPendientes] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, nombre: true, fechaNacimiento: true },
    }),
    prisma.carta.findMany({
      where: { celebracion: hoyMMdd, activa: true },
      select: {
        id: true,
        clave: true,
        nombre: true,
        subtitulo: true,
        rareza: true,
        fragmentosRequeridos: true,
        imagenUrl: true,
        cartasUsuario: { where: { usuarioId }, select: { gradoReclamado: true } },
      },
    }),
    prisma.reclamoCarta.findMany({
      where: { usuarioId, periodo: { in: [periodo, PERIODO_BIENVENIDA] } },
    }),
    contarGradosPendientes(usuarioId),
  ]);

  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  const esCumple = esCumpleHoy(usuario.fechaNacimiento, ahora, APP_TZ);
  const cumpleReclamado = reclamosUsuario.some((r) => r.tipo === "Cumpleanos" && r.periodo === periodo);
  const bienvenidaDisponible = !reclamosUsuario.some((r) => r.tipo === "Bienvenida");

  const reclamosFiestaSet = new Set(
    reclamosUsuario.filter((r) => r.tipo === "Fiesta" && r.periodo === periodo).map((r) => r.cartaId)
  );

  const fiestas = cartasFiesta.map((c) => ({
    cartaId: c.id,
    clave: c.clave,
    nombre: c.nombre,
    subtitulo: c.subtitulo,
    rareza: c.rareza,
    imagenUrl: c.imagenUrl,
    regaloFragmentos: regaloFiesta(c.fragmentosRequeridos),
    yaLaTiene: (c.cartasUsuario[0]?.gradoReclamado ?? 0) >= 1,
    reclamado: reclamosFiestaSet.has(c.id),
  }));

  const cumpleElegibles =
    esCumple && !cumpleReclamado
      ? (await cartasElegiblesCumple(prisma, usuarioId)).map((c) => ({
          cartaId: c.id,
          clave: c.clave,
          nombre: c.nombre,
          rareza: c.rareza,
          categoria: c.categoria,
          imagenUrl: c.imagenUrl,
          fragmentos: c.fragmentos,
          fragmentosRequeridos: c.fragmentosRequeridos,
        }))
      : [];

  const hayPendientes =
    fiestas.some((f) => !f.reclamado) ||
    (esCumple && !cumpleReclamado) ||
    bienvenidaDisponible ||
    gradosPendientes > 0;

  return {
    fechaHoy: hoyMMdd,
    periodo,
    esCumple,
    cumpleReclamado,
    cumpleElegibles,
    bienvenidaDisponible,
    gradosPendientes,
    hayPendientes,
    fiestas,
  };
}

/**
 * 8. Funciones de Administración de Cartas (Lane 36)
 */

export interface CartaAdminItem {
  id: number;
  clave: string;
  nombre: string;
  subtitulo: string | null;
  categoria: CategoriaCarta;
  rareza: RarezaCarta;
  celebracion: string | null;
  historia: string;
  oracion: string;
  frase: string;
  fraseAutor: string | null;
  datasheet: Array<{ etiqueta: string; valor: string }>;
  imagenUrl: string;
  imagenGrado2Url: string | null;
  imagenGrado3Url: string | null;
  imagenGrado4Url: string | null;
  creditoImagen: string | null;
  fragmentosRequeridos: number;
  origen: "Sistema" | "Manual";
  editadaManual: boolean;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
  usuariosColeccionando: number;
}

export async function adminListarCartas(): Promise<CartaAdminItem[]> {
  const cartas = await prisma.carta.findMany({
    orderBy: [
      { activa: "desc" },
      { id: "desc" },
    ],
    include: {
      _count: {
        select: { cartasUsuario: true },
      },
    },
  });

  return cartas.map((c) => ({
    id: c.id,
    clave: c.clave,
    nombre: c.nombre,
    subtitulo: c.subtitulo,
    categoria: c.categoria as CategoriaCarta,
    rareza: c.rareza as RarezaCarta,
    celebracion: c.celebracion,
    historia: c.historia,
    oracion: c.oracion,
    frase: c.frase,
    fraseAutor: c.fraseAutor,
    datasheet: Array.isArray(c.datasheet)
      ? (c.datasheet as Array<{ etiqueta: string; valor: string }>)
      : [],
    imagenUrl: c.imagenUrl,
    imagenGrado2Url: c.imagenGrado2Url,
    imagenGrado3Url: c.imagenGrado3Url,
    imagenGrado4Url: c.imagenGrado4Url,
    creditoImagen: c.creditoImagen,
    fragmentosRequeridos: c.fragmentosRequeridos,
    origen: c.origen as "Sistema" | "Manual",
    editadaManual: c.editadaManual,
    activa: c.activa,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    usuariosColeccionando: c._count.cartasUsuario,
  }));
}

export async function adminCrearCarta(entrada: unknown, creadorId?: number) {
  const datos = esquemaCartaAdmin.parse(entrada);

  let clave = datos.clave?.trim() || generarClaveSlug(datos.nombre);
  if (!clave) {
    clave = `carta-${Date.now()}`;
  }

  // Asegurar clave única en base de datos
  let claveFinal = clave;
  let contador = 2;
  while (await prisma.carta.findUnique({ where: { clave: claveFinal } })) {
    claveFinal = `${clave}-${contador}`;
    contador++;
  }

  const nuevaCarta = await prisma.carta.create({
    data: {
      clave: claveFinal,
      nombre: datos.nombre,
      subtitulo: datos.subtitulo ?? null,
      categoria: datos.categoria,
      rareza: datos.rareza,
      celebracion: datos.celebracion ?? null,
      historia: datos.historia,
      oracion: datos.oracion,
      frase: datos.frase,
      fraseAutor: datos.fraseAutor ?? null,
      datasheet: datos.datasheet,
      imagenUrl: datos.imagenUrl,
      imagenGrado2Url: datos.imagenGrado2Url ?? null,
      imagenGrado3Url: datos.imagenGrado3Url ?? null,
      imagenGrado4Url: datos.imagenGrado4Url ?? null,
      creditoImagen: datos.creditoImagen ?? null,
      fragmentosRequeridos: datos.fragmentosRequeridos,
      origen: "Manual",
      editadaManual: true,
      activa: datos.activa ?? true,
      creadorId: creadorId ?? null,
    },
  });

  return nuevaCarta;
}

export async function adminActualizarCarta(id: number, entrada: unknown) {
  const datos = esquemaCartaAdmin.parse(entrada);

  const existente = await prisma.carta.findUnique({ where: { id } });
  if (!existente) {
    throw new Error(`Carta con ID ${id} no encontrada`);
  }

  let claveFinal = existente.clave;
  if (datos.clave && datos.clave.trim() !== existente.clave) {
    claveFinal = datos.clave.trim();
    const yaExiste = await prisma.carta.findUnique({ where: { clave: claveFinal } });
    if (yaExiste && yaExiste.id !== id) {
      throw new Error(`Ya existe una carta con la clave "${claveFinal}"`);
    }
  }

  const cartaActualizada = await prisma.carta.update({
    where: { id },
    data: {
      clave: claveFinal,
      nombre: datos.nombre,
      subtitulo: datos.subtitulo ?? null,
      categoria: datos.categoria,
      rareza: datos.rareza,
      celebracion: datos.celebracion ?? null,
      historia: datos.historia,
      oracion: datos.oracion,
      frase: datos.frase,
      fraseAutor: datos.fraseAutor ?? null,
      datasheet: datos.datasheet,
      imagenUrl: datos.imagenUrl,
      imagenGrado2Url: datos.imagenGrado2Url ?? null,
      imagenGrado3Url: datos.imagenGrado3Url ?? null,
      imagenGrado4Url: datos.imagenGrado4Url ?? null,
      creditoImagen: datos.creditoImagen ?? null,
      fragmentosRequeridos: datos.fragmentosRequeridos,
      activa: datos.activa ?? true,
      editadaManual: true,
    },
  });

  return cartaActualizada;
}

export async function adminArchivarCarta(id: number) {
  const existente = await prisma.carta.findUnique({ where: { id } });
  if (!existente) {
    throw new Error(`Carta con ID ${id} no encontrada`);
  }

  return await prisma.carta.update({
    where: { id },
    data: { activa: false },
  });
}

export async function adminRestaurarCarta(id: number) {
  const existente = await prisma.carta.findUnique({ where: { id } });
  if (!existente) {
    throw new Error(`Carta con ID ${id} no encontrada`);
  }

  return await prisma.carta.update({
    where: { id },
    data: { activa: true },
  });
}

