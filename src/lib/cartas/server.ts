// Servicios del servidor para cartas católicas (Lane 31)
// Persistencia, transacciones atómicas, D13 y eventos litúrgicos

import prisma from "../prisma.ts";
import {
  SOBRE_MEDITACION,
  SOBRE_REVELACION,
  TOPE_DIARIO_FRAGMENTOS_PUNTOS,
  precioFragmentoEnPuntos,
  precioFragmentoEnIncienso,
  type CategoriaCarta,
  type RarezaCarta,
} from "./economia.ts";
import { aplicarFragmentos } from "./fragmentos.ts";
import {
  contenidoVisible,
  type ContenidoCartaVisible,
  type CartaCompletaEntrada,
} from "./revelado.ts";
import {
  sortearSobreMeditacion,
  sortearSobreRevelacion,
  type CartaSorteable,
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
  APP_TZ,
} from "./eventos.ts";
import { esquemaCartaAdmin, generarClaveSlug } from "./esquema.ts";

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

/**
 * 1. Obtener catálogo completo con progreso para un usuario (D13).
 * SEGURIDAD: Todos los contenidos son redactados según los fragmentos del usuario.
 */
export async function listarCartasUsuario(usuarioId: number) {
  const [cartasDb, coleccionUsuario, usuario] = await Promise.all([
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
  ]);

  const fragmentosPorCarta = new Map<number, number>();
  for (const cu of coleccionUsuario) {
    fragmentosPorCarta.set(cu.cartaId, cu.fragmentos);
  }

  const cartasVisibles: ContenidoCartaVisible[] = cartasDb.map((carta) => {
    const fragmentos = fragmentosPorCarta.get(carta.id) ?? 0;
    const adaptada = adaptarCartaPrisma(carta);
    return contenidoVisible(adaptada, fragmentos);
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
      orderBy: [{ rareza: "asc" }, { nombre: "asc" }],
      select: { clave: true },
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
  const visible = contenidoVisible(adaptada, fragmentos);

  // Navegación secuencial dentro del catálogo
  const idx = cartasLista.findIndex((c) => c.clave === clave);
  const anterior = idx > 0 ? cartasLista[idx - 1].clave : null;
  const siguiente = idx >= 0 && idx < cartasLista.length - 1 ? cartasLista[idx + 1].clave : null;

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

    const hoyTz = hoyMesDiaEnTz(new Date(), APP_TZ);
    if (cartaDb.celebracion === hoyTz) {
      diasHastaCelebracion = 0;
      textoCelebracion = `${diaMesTexto} · ¡Hoy es la fiesta!`;
    } else {
      const hoyDate = new Date();
      const anioActual = Number(hoyAnioEnTz(hoyDate, APP_TZ));
      let target = new Date(anioActual, mm - 1, dd);
      const hoyMidnight = new Date(anioActual, hoyDate.getMonth(), hoyDate.getDate());
      if (target < hoyMidnight) {
        target = new Date(anioActual + 1, mm - 1, dd);
      }
      const diffMs = target.getTime() - hoyMidnight.getTime();
      diasHastaCelebracion = Math.round(diffMs / (1000 * 60 * 60 * 24));
      textoCelebracion = `${diaMesTexto} · Faltan ${diasHastaCelebracion} días`;
    }
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
      select: { id: true, clave: true, rareza: true, celebracion: true, fragmentosRequeridos: true, nombre: true },
    });

    if (cartasPoolDb.length === 0) {
      throw new Error("No hay cartas disponibles en la tienda");
    }

    const poolSorteo: CartaSorteable[] = cartasPoolDb.map((c) => ({
      id: c.id,
      clave: c.clave,
      rareza: c.rareza,
      activa: true,
    }));

    // 3. Ejecutar sorteo puro
    const resultadoSobre =
      tipoSobre === "meditacion"
        ? sortearSobreMeditacion(poolSorteo, rng)
        : sortearSobreRevelacion(poolSorteo, rng);

    // 4. Descontar puntos
    await tx.usuario.update({
      where: { id: usuarioId },
      data: {
        availablePoints: { decrement: costo },
      },
    });

    const ahora = new Date();
    let totalInciensoGanado = 0;
    const cartasAfectadas: Array<{
      cartaId: number;
      cartaClave: string;
      nombre: string;
      rareza: string;
      cantidadBase: number;
      cantidadFinal: number;
      bonoFiestaAplicado: boolean;
      fragmentosAntes: number;
      fragmentosDespues: number;
      desbloquea: boolean;
      gradoAntes: number;
      gradoDespues: number;
      excedente: number;
      inciensoGanado: number;
    }> = [];

    // 5. Aplicar cada fragmento otorgado
    for (const item of resultadoSobre.items) {
      const cartaInfo = cartasPoolDb.find((c) => c.id === item.cartaId)!;
      // D17: Bono de fiesta en tienda (×1.5 redondeo hacia arriba)
      const esFiesta = esFiestaHoy(cartaInfo.celebracion, ahora, APP_TZ);
      const cantidadFinal = esFiesta
        ? Math.ceil(item.cantidad * multiplicadorTienda(cartaInfo.celebracion, ahora, APP_TZ))
        : item.cantidad;

      // Obtener o inicializar registro en Cartas_Usuario
      const actualUserCard = await tx.cartaUsuario.findUnique({
        where: { usuarioId_cartaId: { usuarioId, cartaId: item.cartaId } },
      });

      const fragmentosActuales = actualUserCard?.fragmentos ?? 0;
      const res = aplicarFragmentos(
        fragmentosActuales,
        cartaInfo.fragmentosRequeridos,
        item.rareza,
        cantidadFinal
      );

      if (res.incienso > 0) {
        totalInciensoGanado += res.incienso;
      }

      await tx.cartaUsuario.upsert({
        where: { usuarioId_cartaId: { usuarioId, cartaId: item.cartaId } },
        create: {
          usuarioId,
          cartaId: item.cartaId,
          fragmentos: res.nuevo,
          desbloqueadaEn: res.desbloquea ? ahora : null,
        },
        update: {
          fragmentos: res.nuevo,
          desbloqueadaEn:
            res.desbloquea && !actualUserCard?.desbloqueadaEn ? ahora : actualUserCard?.desbloqueadaEn,
        },
      });

      // Registrar movimiento individual
      await tx.movimientoFragmento.create({
        data: {
          usuarioId,
          cartaId: item.cartaId,
          tipo: "Sobre",
          cantidad: cantidadFinal,
          puntosGastados: Math.round(costo / resultadoSobre.items.length),
          inciensoDelta: res.incienso,
          detalle: `${config.nombre} (${esFiesta ? "Bono festividad ×1,5" : "Base"})`,
        },
      });

      cartasAfectadas.push({
        cartaId: item.cartaId,
        cartaClave: item.cartaClave,
        nombre: cartaInfo.nombre,
        rareza: item.rareza,
        cantidadBase: item.cantidad,
        cantidadFinal,
        bonoFiestaAplicado: esFiesta,
        fragmentosAntes: fragmentosActuales,
        fragmentosDespues: res.nuevo,
        desbloquea: res.desbloquea,
        gradoAntes: res.gradoAntes,
        gradoDespues: res.gradoDespues,
        excedente: res.excedente,
        inciensoGanado: res.incienso,
      });
    }

    // 6. Si hubo conversión de fragmentos a Incienso, acreditar al usuario
    if (totalInciensoGanado > 0) {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          incienso: { increment: totalInciensoGanado },
        },
      });
    }

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
      totalInciensoGanado,
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
    const hoyInicio = new Date(ahora);
    hoyInicio.setHours(0, 0, 0, 0);

    let costoTotal = 0;

    if (moneda === "puntos") {
      // D2: Tope de 10 fragmentos por carta y día pagando con puntos
      const comprasHoy = await tx.movimientoFragmento.aggregate({
        where: {
          usuarioId,
          cartaId,
          tipo: "Compra",
          createdAt: { gte: hoyInicio },
        },
        _sum: { cantidad: true },
      });

      const fragmentosCompradosHoy = comprasHoy._sum.cantidad ?? 0;
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

      await tx.usuario.update({
        where: { id: usuarioId },
        data: { availablePoints: { decrement: costoTotal } },
      });
    } else {
      // moneda === "incienso"
      costoTotal = cantidad * precioFragmentoEnIncienso(carta.rareza);
      if (usuario.incienso < costoTotal) {
        throw new Error(
          `Incienso insuficiente. Necesitás ${costoTotal} Granos de Incienso y tenés ${usuario.incienso}.`
        );
      }

      await tx.usuario.update({
        where: { id: usuarioId },
        data: { incienso: { decrement: costoTotal } },
      });
    }

    // D17: Si hoy es fiesta, multiplicar fragmentos otorgados ×1.5
    const esFiesta = esFiestaHoy(carta.celebracion, ahora, APP_TZ);
    const cantidadFinal = esFiesta
      ? Math.ceil(cantidad * multiplicadorTienda(carta.celebracion, ahora, APP_TZ))
      : cantidad;

    const actualUserCard = await tx.cartaUsuario.findUnique({
      where: { usuarioId_cartaId: { usuarioId, cartaId } },
    });

    const fragmentosActuales = actualUserCard?.fragmentos ?? 0;
    const res = aplicarFragmentos(
      fragmentosActuales,
      carta.fragmentosRequeridos,
      carta.rareza,
      cantidadFinal
    );

    await tx.cartaUsuario.upsert({
      where: { usuarioId_cartaId: { usuarioId, cartaId } },
      create: {
        usuarioId,
        cartaId,
        fragmentos: res.nuevo,
        desbloqueadaEn: res.desbloquea ? ahora : null,
      },
      update: {
        fragmentos: res.nuevo,
        desbloqueadaEn:
          res.desbloquea && !actualUserCard?.desbloqueadaEn ? ahora : actualUserCard?.desbloqueadaEn,
      },
    });

    // Registrar en Movimientos_Fragmento
    await tx.movimientoFragmento.create({
      data: {
        usuarioId,
        cartaId,
        tipo: moneda === "puntos" ? "Compra" : "CompraIncienso",
        cantidad: cantidadFinal,
        puntosGastados: moneda === "puntos" ? costoTotal : 0,
        inciensoDelta: (moneda === "incienso" ? -costoTotal : 0) + res.incienso,
        detalle: `Compra directa (${moneda})${esFiesta ? " · Bono fiesta ×1,5" : ""}`,
      },
    });

    // Si la compra generó excedente convertido en Incienso:
    if (res.incienso > 0) {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { incienso: { increment: res.incienso } },
      });
    }

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
      fragmentosAntes: fragmentosActuales,
      fragmentosDespues: res.nuevo,
      desbloquea: res.desbloquea,
      gradoAntes: res.gradoAntes,
      gradoDespues: res.gradoDespues,
      excedente: res.excedente,
      inciensoGanado: res.incienso,
      nuevoSaldoPuntos: usuarioFinal?.availablePoints ?? 0,
      nuevoSaldoIncienso: usuarioFinal?.incienso ?? 0,
    };
  });
}

/**
 * 5. Reclamar el premio de festividad litúrgica (D5) de una carta celebrada hoy.
 * Idempotente: una vez por (usuario, carta, año).
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

    // Verificar si ya fue reclamada este año
    const reclamoPrevio = await tx.reclamoCarta.findUnique({
      where: {
        usuarioId_tipo_cartaId_periodo: {
          usuarioId,
          tipo: "Fiesta",
          cartaId,
          periodo,
        },
      },
    });

    if (reclamoPrevio) {
      throw new Error("El premio de festividad para esta carta ya fue reclamado este año");
    }

    // Registrar reclamo de forma idempotente
    await tx.reclamoCarta.create({
      data: {
        usuarioId,
        cartaId,
        tipo: "Fiesta",
        periodo,
      },
    });

    // Otorgar el 50% de los fragmentos requeridos
    const cantidadRegalo = regaloFiesta(carta.fragmentosRequeridos);

    const actualUserCard = await tx.cartaUsuario.findUnique({
      where: { usuarioId_cartaId: { usuarioId, cartaId } },
    });

    const fragmentosActuales = actualUserCard?.fragmentos ?? 0;
    const res = aplicarFragmentos(
      fragmentosActuales,
      carta.fragmentosRequeridos,
      carta.rareza,
      cantidadRegalo
    );

    await tx.cartaUsuario.upsert({
      where: { usuarioId_cartaId: { usuarioId, cartaId } },
      create: {
        usuarioId,
        cartaId,
        fragmentos: res.nuevo,
        desbloqueadaEn: res.desbloquea ? ahora : null,
      },
      update: {
        fragmentos: res.nuevo,
        desbloqueadaEn:
          res.desbloquea && !actualUserCard?.desbloqueadaEn ? ahora : actualUserCard?.desbloqueadaEn,
      },
    });

    await tx.movimientoFragmento.create({
      data: {
        usuarioId,
        cartaId,
        tipo: "Fiesta",
        cantidad: cantidadRegalo,
        puntosGastados: 0,
        inciensoDelta: res.incienso,
        detalle: `Premio festividad litúrgica (${periodo})`,
      },
    });

    if (res.incienso > 0) {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { incienso: { increment: res.incienso } },
      });
    }

    return {
      cartaId,
      nombre: carta.nombre,
      cantidadRegalo,
      fragmentosAntes: fragmentosActuales,
      fragmentosDespues: res.nuevo,
      desbloquea: res.desbloquea,
      gradoAntes: res.gradoAntes,
      gradoDespues: res.gradoDespues,
      excedente: res.excedente,
      inciensoGanado: res.incienso,
    };
  });
}

/**
 * 6. Reclamar regalo de cumpleaños (D6).
 * Idempotente: una vez por año.
 * - Si hay cartas del día no completadas: otorga todos los fragmentos para el 100%.
 * - Si no hay cartas o ya están todas al 100%: regala un Sobre de Revelación gratis.
 */
export async function reclamarCumpleanos(usuarioId: number, rng?: RngFn) {
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

    // Verificar si ya reclamó su cumpleaños este año (verificando cualquier reclamo con tipo Cumpleanos en este periodo)
    const yaReclamo = await tx.reclamoCarta.findFirst({
      where: {
        usuarioId,
        tipo: "Cumpleanos",
        periodo,
      },
    });

    if (yaReclamo) {
      throw new Error("El regalo de cumpleaños ya fue reclamado este año");
    }

    const hoyMMdd = hoyMesDiaEnTz(ahora, APP_TZ);
    const cartasDelDia = await tx.carta.findMany({
      where: { celebracion: hoyMMdd, activa: true },
    });

    // Obtener cartas de hoy del usuario
    const cartasUsuarioHoy = await tx.cartaUsuario.findMany({
      where: {
        usuarioId,
        cartaId: { in: cartasDelDia.map((c) => c.id) },
      },
    });

    const fragsMap = new Map<number, number>();
    for (const cu of cartasUsuarioHoy) {
      fragsMap.set(cu.cartaId, cu.fragmentos);
    }

    // Cartas a las que les falte fragmentos para llegar al 100%
    const cartasIncompletas = cartasDelDia.filter((c) => {
      const frags = fragsMap.get(c.id) ?? 0;
      return frags < c.fragmentosRequeridos;
    });

    if (cartasIncompletas.length > 0) {
      const resultadosCartas: Array<{
        cartaId: number;
        nombre: string;
        fragmentosRegalados: number;
        desbloqueada: boolean;
        grado: number;
      }> = [];

      for (const carta of cartasIncompletas) {
        const fragsActuales = fragsMap.get(carta.id) ?? 0;
        const faltantes = regaloCumple(carta.fragmentosRequeridos, fragsActuales);

        await tx.reclamoCarta.create({
          data: {
            usuarioId,
            cartaId: carta.id,
            tipo: "Cumpleanos",
            periodo,
          },
        });

        const res = aplicarFragmentos(
          fragsActuales,
          carta.fragmentosRequeridos,
          carta.rareza,
          faltantes
        );

        await tx.cartaUsuario.upsert({
          where: { usuarioId_cartaId: { usuarioId, cartaId: carta.id } },
          create: {
            usuarioId,
            cartaId: carta.id,
            fragmentos: res.nuevo,
            desbloqueadaEn: ahora,
          },
          update: {
            fragmentos: res.nuevo,
            desbloqueadaEn: ahora,
          },
        });

        await tx.movimientoFragmento.create({
          data: {
            usuarioId,
            cartaId: carta.id,
            tipo: "Cumpleanos",
            cantidad: faltantes,
            puntosGastados: 0,
            inciensoDelta: 0,
            detalle: `Regalo de cumpleaños (${periodo})`,
          },
        });

        resultadosCartas.push({
          cartaId: carta.id,
          nombre: carta.nombre,
          fragmentosRegalados: faltantes,
          desbloqueada: true,
          grado: res.gradoDespues,
        });
      }

      return {
        tipo: "santos_del_dia" as const,
        mensaje: "¡Feliz cumpleaños! Se han desbloqueado los santos de tu día.",
        cartas: resultadosCartas,
      };
    } else {
      // Regalo alternativo: Sobre de Revelación gratis
      await tx.reclamoCarta.create({
        data: {
          usuarioId,
          cartaId: 0, // Centinela 0
          tipo: "Cumpleanos",
          periodo,
        },
      });

      const poolSorteoDb = await tx.carta.findMany({
        where: { activa: true },
        select: { id: true, clave: true, rareza: true, celebracion: true, fragmentosRequeridos: true, nombre: true },
      });

      const poolSorteo: CartaSorteable[] = poolSorteoDb.map((c) => ({
        id: c.id,
        clave: c.clave,
        rareza: c.rareza,
        activa: true,
      }));

      const resSobre = sortearSobreRevelacion(poolSorteo, rng);
      let totalIncienso = 0;
      const cartasAfectadas: Array<{
        cartaId: number;
        nombre: string;
        rareza: RarezaCarta;
        cantidad: number;
        fragmentosDespues: number;
        desbloquea: boolean;
      }> = [];

      for (const item of resSobre.items) {
        const cartaInfo = poolSorteoDb.find((c) => c.id === item.cartaId)!;
        const actualUserCard = await tx.cartaUsuario.findUnique({
          where: { usuarioId_cartaId: { usuarioId, cartaId: item.cartaId } },
        });

        const fragsActuales = actualUserCard?.fragmentos ?? 0;
        const res = aplicarFragmentos(
          fragsActuales,
          cartaInfo.fragmentosRequeridos,
          item.rareza,
          item.cantidad
        );

        if (res.incienso > 0) totalIncienso += res.incienso;

        await tx.cartaUsuario.upsert({
          where: { usuarioId_cartaId: { usuarioId, cartaId: item.cartaId } },
          create: {
            usuarioId,
            cartaId: item.cartaId,
            fragmentos: res.nuevo,
            desbloqueadaEn: res.desbloquea ? ahora : null,
          },
          update: {
            fragmentos: res.nuevo,
            desbloqueadaEn:
              res.desbloquea && !actualUserCard?.desbloqueadaEn ? ahora : actualUserCard?.desbloqueadaEn,
          },
        });

        await tx.movimientoFragmento.create({
          data: {
            usuarioId,
            cartaId: item.cartaId,
            tipo: "Cumpleanos",
            cantidad: item.cantidad,
            puntosGastados: 0,
            inciensoDelta: res.incienso,
            detalle: `Regalo de cumpleaños: Sobre de Revelación (${periodo})`,
          },
        });

        cartasAfectadas.push({
          cartaId: item.cartaId,
          nombre: cartaInfo.nombre,
          rareza: item.rareza,
          cantidad: item.cantidad,
          fragmentosDespues: res.nuevo,
          desbloquea: res.desbloquea,
        });
      }

      if (totalIncienso > 0) {
        await tx.usuario.update({
          where: { id: usuarioId },
          data: { incienso: { increment: totalIncienso } },
        });
      }

      return {
        tipo: "sobre_revelacion_gratis" as const,
        mensaje: "¡Feliz cumpleaños! Recibiste un Sobre de Revelación gratis.",
        sobre: resSobre.nombreSobre,
        cartasAfectadas,
        totalInciensoGanado: totalIncienso,
      };
    }
  });
}

/**
 * 7. Consulta de eventos litúrgicos y de cumpleaños pendientes para hoy.
 */
export async function eventosDeHoy(usuarioId: number) {
  const ahora = new Date();
  const hoyMMdd = hoyMesDiaEnTz(ahora, APP_TZ);
  const periodo = hoyAnioEnTz(ahora, APP_TZ);

  const [usuario, cartasFiesta, reclamosUsuario] = await Promise.all([
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
      },
    }),
    prisma.reclamoCarta.findMany({
      where: { usuarioId, periodo },
    }),
  ]);

  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  const esCumple = esCumpleHoy(usuario.fechaNacimiento, ahora, APP_TZ);
  const cumpleReclamado = reclamosUsuario.some((r) => r.tipo === "Cumpleanos");

  const reclamosFiestaSet = new Set(
    reclamosUsuario.filter((r) => r.tipo === "Fiesta").map((r) => r.cartaId)
  );

  const fiestas = cartasFiesta.map((c) => ({
    cartaId: c.id,
    clave: c.clave,
    nombre: c.nombre,
    subtitulo: c.subtitulo,
    rareza: c.rareza,
    imagenUrl: c.imagenUrl,
    regaloFragmentos: regaloFiesta(c.fragmentosRequeridos),
    reclamado: reclamosFiestaSet.has(c.id),
  }));

  return {
    fechaHoy: hoyMMdd,
    periodo,
    esCumple,
    cumpleReclamado,
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

