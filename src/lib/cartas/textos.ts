// Rótulos y textos de la interfaz en español rioplatense (D18)

import type { GradoCarta, RarezaCarta, CategoriaCarta } from "./economia.ts";

export const TEXTOS_CARTAS = {
  // Rarezas
  rarezas: {
    Comun: "Común",
    Buena: "Buena",
    Perfecta: "Perfecta",
    Celestial: "Celestial",
  } satisfies Record<RarezaCarta, string>,

  // Categorías
  categorias: {
    Santo: "Santo",
    Angel: "Ángel",
    Misterio: "Misterio",
    Tema: "Tema",
    Persona: "Persona",
  } satisfies Record<CategoriaCarta, string>,

  // Grados de Veneración (D14)
  grados: {
    0: "Bloqueada",
    1: "Grado I · Desbloqueada",
    2: "Grado II · Venerada",
    3: "Grado III · Iluminada",
    4: "Grado IV · Gloriosa",
  } satisfies Record<GradoCarta, string>,

  gradosCortos: {
    0: "Bloqueada",
    1: "Desbloqueada",
    2: "Venerada",
    3: "Iluminada",
    4: "Gloriosa",
  } satisfies Record<GradoCarta, string>,

  gradosRomanos: {
    0: "",
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
  } satisfies Record<GradoCarta, string>,

  // Monedas y recursos
  fragmento: "fragmento",
  fragmentos: "fragmentos",
  incienso: "Granos de Incienso",
  inciensoCorto: "Incienso",
  puntos: "puntos",

  // Tienda y Sobres
  sobres: {
    meditacion: {
      nombre: "Sobre de Meditación",
      descripcion: "8 fragmentos de cartas comunes o buenas.",
      precio: "40 puntos",
    },
    revelacion: {
      nombre: "Sobre de Revelación",
      descripcion: "12 fragmentos, con al menos 6 de una carta Perfecta o Celestial garantizada.",
      precio: "100 puntos",
    },
  },

  // Pistas de revelación progresiva (D13)
  pistas: {
    bloqueada: "???",
    oracion: "Se revela con más del 0 % de fragmentos",
    frase: "Se revela al 25 % de fragmentos",
    historia: "Se revela al 100 % de fragmentos (carta desbloqueada)",
    datasheetHito: (pct: number) => `Se revela al ${pct} % de fragmentos`,
  },

  // Eventos festivos (vault/ECONOMIA_CARTAS.md D21, D22, D23; D17)
  eventos: {
    fiestaAviso: (nombre: string) => `Hoy se celebra ${nombre}`,
    fiestaPremio: "Reclamar la carta",
    fiestaPremioRepetida: "Reclamar +100 %",
    fiestaDetalle: "Si no la reclamás hoy, no la ganás.",
    fiestaReclamado: "Regalo de la fiesta reclamado",
    cumpleAviso: "¡Feliz cumpleaños! Elegí una carta de regalo",
    cumpleDetalle: "Cualquier carta Común, Buena o Perfecta que todavía no tengas, entera.",
    cumpleSinElegibles: "Ya tenés todas las cartas elegibles: te regalamos un Sobre de Revelación.",
    cumplePremio: "Reclamar regalo de cumpleaños",
    cumpleReclamado: "Regalo de cumpleaños reclamado",
    bienvenidaAviso: "Tu regalo de bienvenida",
    bienvenidaDetalle: "3 cartas Comunes al azar para empezar tu colección.",
    bienvenidaPremio: "Abrir regalo",
    bonoTienda: (nombre: string) => `Hoy ×1,5 en fragmentos de ${nombre}`,
  },

  // Reclamar desbloqueo y grados (D20)
  reclamos: {
    reclamar: "Reclamar",
    listaParaReclamar: "¡Lista para reclamar!",
    /** Sin grado: la carta todavía no se desbloqueó */
    reclamarGrado: (grado: string) => (grado ? `Reclamar Grado ${grado}` : "Reclamar carta"),
    alcanzado: (grado: string) =>
      grado === "I"
        ? "Juntaste todos los fragmentos: reclamala para consagrarla."
        : `Alcanzaste el Grado ${grado}: reclamalo para verlo.`,
    fiestaHoy: "Hoy es su fiesta",
  },
} as const;
