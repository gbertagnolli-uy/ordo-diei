export type CategoriaRutina =
  | "higiene"
  | "hogar"
  | "oracion"
  | "nutricion"
  | "estudio"
  | "pausa"
  | "recreacion"
  | "deporte"
  | "creatividad"
  | "lectura"
  | "descanso";

export type DiasAplicables = "todos" | "laborables" | "finDeSemana" | number[];

export interface EtapaRutina {
  id: string;
  titulo: string;
  descripcion?: string;
  horaInicio: string; // formato "HH:mm" (ej. "08:00")
  horaFin: string;    // formato "HH:mm" (ej. "08:15")
  duracionMin: number;
  categoria: CategoriaRutina;
  icono: string;      // Identificador de icono Lucide
  alarmaSonora: boolean;
  diasSemana: DiasAplicables;
  bloqueMacro?: "manana" | "estudio_am" | "mediodia" | "tarde" | "hogar" | "noche";
}

export interface MetaMensual {
  id: string;
  mes: string; // "YYYY-MM"
  titulo: string;
  virtudDelMes?: string;
  descripcion?: string;
  completada: boolean;
  categoria?: CategoriaRutina;
}

export interface RutinaSemanalConfig {
  diasLaborables: string[]; // ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
  enfoqueSemanal: string;
  notasSabado: string;
  notasDomingo: string;
}

export interface ConfiguracionRutina {
  version: number;
  sonidoHabilitado: boolean;
  tipoSonido: "campanilla" | "monasterio" | "cuenco" | "marimba" | "suave";
  volumen: number; // 0 a 100
  notificacionesNavegador: boolean;
  etapas: EtapaRutina[];
  metasMensuales: MetaMensual[];
  semanalConfig: RutinaSemanalConfig;
}

export const CATEGORIAS_INFO: Record<
  CategoriaRutina,
  { label: string; colorBg: string; colorText: string; borderColor: string; defaultIcon: string }
> = {
  higiene: {
    label: "Higiene y Cuidado",
    colorBg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    colorText: "text-cyan-700 dark:text-cyan-300",
    borderColor: "border-cyan-300 dark:border-cyan-700",
    defaultIcon: "Bath",
  },
  hogar: {
    label: "Orden y Colaboración",
    colorBg: "bg-amber-500/10 dark:bg-amber-500/20",
    colorText: "text-amber-800 dark:text-amber-300",
    borderColor: "border-amber-300 dark:border-amber-700",
    defaultIcon: "Home",
  },
  oracion: {
    label: "Oración y Fe",
    colorBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    colorText: "text-indigo-800 dark:text-indigo-300",
    borderColor: "border-indigo-300 dark:border-indigo-700",
    defaultIcon: "Church",
  },
  nutricion: {
    label: "Comidas y Nutrición",
    colorBg: "bg-orange-500/10 dark:bg-orange-500/20",
    colorText: "text-orange-800 dark:text-orange-300",
    borderColor: "border-orange-300 dark:border-orange-700",
    defaultIcon: "Utensils",
  },
  estudio: {
    label: "Estudio y Enfoque",
    colorBg: "bg-blue-500/10 dark:bg-blue-500/20",
    colorText: "text-blue-800 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-700",
    defaultIcon: "BookOpen",
  },
  pausa: {
    label: "Pausa y Respiro",
    colorBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    colorText: "text-emerald-800 dark:text-emerald-300",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    defaultIcon: "Coffee",
  },
  recreacion: {
    label: "Recreación y Agua",
    colorBg: "bg-teal-500/10 dark:bg-teal-500/20",
    colorText: "text-teal-800 dark:text-teal-300",
    borderColor: "border-teal-300 dark:border-teal-700",
    defaultIcon: "Smile",
  },
  deporte: {
    label: "Aire Libre y Juego",
    colorBg: "bg-lime-500/10 dark:bg-lime-500/20",
    colorText: "text-lime-800 dark:text-lime-300",
    borderColor: "border-lime-300 dark:border-lime-700",
    defaultIcon: "Activity",
  },
  creatividad: {
    label: "Arte, Plantas y Música",
    colorBg: "bg-fuchsia-500/10 dark:bg-fuchsia-500/20",
    colorText: "text-fuchsia-800 dark:text-fuchsia-300",
    borderColor: "border-fuchsia-300 dark:border-fuchsia-700",
    defaultIcon: "Palette",
  },
  lectura: {
    label: "Lectura y Sabiduría",
    colorBg: "bg-purple-500/10 dark:bg-purple-500/20",
    colorText: "text-purple-800 dark:text-purple-300",
    borderColor: "border-purple-300 dark:border-purple-700",
    defaultIcon: "BookMarked",
  },
  descanso: {
    label: "Descanso y Sueño",
    colorBg: "bg-slate-500/10 dark:bg-slate-500/20",
    colorText: "text-slate-800 dark:text-slate-300",
    borderColor: "border-slate-300 dark:border-slate-700",
    defaultIcon: "Moon",
  },
};

export const RUTINA_PREDETERMINADA: EtapaRutina[] = [
  {
    id: "etapa-01",
    titulo: "Levantarse, vestirse, lavarse la cara, peinarse",
    descripcion: "Comenzar el día con diligencia, aseo personal y presencia.",
    horaInicio: "08:00",
    horaFin: "08:15",
    duracionMin: 15,
    categoria: "higiene",
    icono: "Sun",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "manana",
  },
  {
    id: "etapa-02",
    titulo: "Hacer la cama",
    descripcion: "Primera victoria de orden del día: tender sábanas y dejar el cuarto prolijo.",
    horaInicio: "08:15",
    horaFin: "08:20",
    duracionMin: 5,
    categoria: "hogar",
    icono: "BedDouble",
    alarmaSonora: false,
    diasSemana: "todos",
    bloqueMacro: "manana",
  },
  {
    id: "etapa-03",
    titulo: "Rezamos",
    descripcion: "Ofrecimiento de obras de la mañana, bendición y oraciones familiares.",
    horaInicio: "08:20",
    horaFin: "08:30",
    duracionMin: 10,
    categoria: "oracion",
    icono: "Church",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "manana",
  },
  {
    id: "etapa-04",
    titulo: "Desayuno",
    descripcion: "Desayuno familiar nutritivo y conversación cordial.",
    horaInicio: "08:30",
    horaFin: "09:00",
    duracionMin: 30,
    categoria: "nutricion",
    icono: "Utensils",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "manana",
  },
  {
    id: "etapa-05",
    titulo: "Estudio",
    descripcion: "Primer bloque de estudio: máxima concentración y foco mental.",
    horaInicio: "09:00",
    horaFin: "09:25",
    duracionMin: 25,
    categoria: "estudio",
    icono: "BookOpen",
    alarmaSonora: true,
    diasSemana: "laborables",
    bloqueMacro: "estudio_am",
  },
  {
    id: "etapa-06",
    titulo: "Pausa",
    descripcion: "Breve pausa activa: estirar el cuerpo, respirar profundo.",
    horaInicio: "09:25",
    horaFin: "09:30",
    duracionMin: 5,
    categoria: "pausa",
    icono: "Coffee",
    alarmaSonora: true,
    diasSemana: "laborables",
    bloqueMacro: "estudio_am",
  },
  {
    id: "etapa-07",
    titulo: "Estudio",
    descripcion: "Continuación del aprendizaje: práctica y resolución de tareas.",
    horaInicio: "09:30",
    horaFin: "09:55",
    duracionMin: 25,
    categoria: "estudio",
    icono: "BookOpen",
    alarmaSonora: true,
    diasSemana: "laborables",
    bloqueMacro: "estudio_am",
  },
  {
    id: "etapa-08",
    titulo: "Pausa",
    descripcion: "Descanso intermedio de estudio.",
    horaInicio: "09:55",
    horaFin: "10:00",
    duracionMin: 5,
    categoria: "pausa",
    icono: "PauseCircle",
    alarmaSonora: true,
    diasSemana: "laborables",
    bloqueMacro: "estudio_am",
  },
  {
    id: "etapa-09",
    titulo: "Recreación, agua, baño",
    descripcion: "Hidratarse, ir al baño, movimiento ligero para despejar.",
    horaInicio: "10:00",
    horaFin: "10:15",
    duracionMin: 15,
    categoria: "recreacion",
    icono: "Smile",
    alarmaSonora: true,
    diasSemana: "laborables",
    bloqueMacro: "estudio_am",
  },
  {
    id: "etapa-10",
    titulo: "Ayudo en áreas comunes, ropa, barrer, ordenar",
    descripcion: "Colaboración solidaria: recoger áreas comunes, ordenar ropa o barrer.",
    horaInicio: "10:15",
    horaFin: "10:20",
    duracionMin: 5,
    categoria: "hogar",
    icono: "Sparkles",
    alarmaSonora: false,
    diasSemana: "laborables",
    bloqueMacro: "estudio_am",
  },
  {
    id: "etapa-11",
    titulo: "Segunda tanda de estudio",
    descripcion: "Bloque extendido de estudio profundo, materias principales y lectura formativa.",
    horaInicio: "10:20",
    horaFin: "12:00",
    duracionMin: 100,
    categoria: "estudio",
    icono: "GraduationCap",
    alarmaSonora: true,
    diasSemana: "laborables",
    bloqueMacro: "estudio_am",
  },
  {
    id: "etapa-12",
    titulo: "Ángelus - Preparar almuerzo",
    descripcion: "Oración del Ángelus a mediodía y colaboración en la cocina.",
    horaInicio: "12:00",
    horaFin: "12:40",
    duracionMin: 40,
    categoria: "oracion",
    icono: "Bell",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "mediodia",
  },
  {
    id: "etapa-13",
    titulo: "Almuerzo",
    descripcion: "Almuerzo en familia, bendición de los alimentos y sobremesa tranquila.",
    horaInicio: "12:40",
    horaFin: "13:15",
    duracionMin: 35,
    categoria: "nutricion",
    icono: "Utensils",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "mediodia",
  },
  {
    id: "etapa-14",
    titulo: "Orden y limpieza de cocina",
    descripcion: "Dejar platos limpios, mesada ordenada y cocina impecable en equipo.",
    horaInicio: "13:15",
    horaFin: "13:40",
    duracionMin: 25,
    categoria: "hogar",
    icono: "Home",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "mediodia",
  },
  {
    id: "etapa-15",
    titulo: "Descanso, café, libro, sentarse afuera",
    descripcion: "Momento sereno de sobremesa: café, lectura amena o contemplación al sol.",
    horaInicio: "13:40",
    horaFin: "14:30",
    duracionMin: 50,
    categoria: "descanso",
    icono: "Coffee",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "tarde",
  },
  {
    id: "etapa-16",
    titulo: "Ejercicio afuera, aire libre, juego",
    descripcion: "Juego en el patio, actividad deportiva, aire fresco y recreación saludable.",
    horaInicio: "14:30",
    horaFin: "15:00",
    duracionMin: 30,
    categoria: "deporte",
    icono: "Activity",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "tarde",
  },
  {
    id: "etapa-17",
    titulo: "Coronita de la Misericordia",
    descripcion: "A las 15:00 h, hora de la Divina Misericordia, rezamos la Coronita juntos.",
    horaInicio: "15:00",
    horaFin: "15:30",
    duracionMin: 30,
    categoria: "oracion",
    icono: "Church",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "tarde",
  },
  {
    id: "etapa-18",
    titulo: "Manualidad, arte, plantación, música",
    descripcion: "Talleres prácticos: cuidado del jardín/huerto, artes plásticas, dibujo o música.",
    horaInicio: "15:30",
    horaFin: "16:30",
    duracionMin: 60,
    categoria: "creatividad",
    icono: "Palette",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "tarde",
  },
  {
    id: "etapa-19",
    titulo: "Lectura",
    descripcion: "Tiempo de lectura individual o compartida: historias formativas o literatura clásica.",
    horaInicio: "16:30",
    horaFin: "17:00",
    duracionMin: 30,
    categoria: "lectura",
    icono: "BookMarked",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "tarde",
  },
  {
    id: "etapa-20",
    titulo: "Merienda",
    descripcion: "Merienda familiar de media tarde y conversación amena.",
    horaInicio: "17:00",
    horaFin: "18:00",
    duracionMin: 60,
    categoria: "nutricion",
    icono: "Utensils",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "tarde",
  },
  {
    id: "etapa-21",
    titulo: "Colaboro en tareas del orden del hogar",
    descripcion: "Orden vespertino: guardar materiales, ordenar habitaciones y preparar la casa.",
    horaInicio: "18:00",
    horaFin: "18:30",
    duracionMin: 30,
    categoria: "hogar",
    icono: "Home",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "hogar",
  },
  {
    id: "etapa-22",
    titulo: "Baño",
    descripcion: "Ducha y baño personal para relajarse y terminar la jornada limpios.",
    horaInicio: "18:30",
    horaFin: "19:00",
    duracionMin: 30,
    categoria: "higiene",
    icono: "Bath",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "hogar",
  },
  {
    id: "etapa-23",
    titulo: "Tiempo de lecturas, recreación",
    descripcion: "Juegos de mesa en familia, libros recreativos o conversación tranquila.",
    horaInicio: "19:00",
    horaFin: "20:00",
    duracionMin: 60,
    categoria: "recreacion",
    icono: "Smile",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "hogar",
  },
  {
    id: "etapa-24",
    titulo: "Preparación de la cena",
    descripcion: "Preparar la mesa, cocinar en familia y calentar la comida.",
    horaInicio: "20:00",
    horaFin: "20:30",
    duracionMin: 30,
    categoria: "nutricion",
    icono: "Utensils",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "noche",
  },
  {
    id: "etapa-25",
    titulo: "Cena",
    descripcion: "Cena compartida en paz, bendición de la mesa y charla del día.",
    horaInicio: "20:30",
    horaFin: "21:00",
    duracionMin: 30,
    categoria: "nutricion",
    icono: "Utensils",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "noche",
  },
  {
    id: "etapa-26",
    titulo: "Los pequeños duermen",
    descripcion: "Acompañar a los más chicos a sus camas, cuento breve y descanso.",
    horaInicio: "21:00",
    horaFin: "21:30",
    duracionMin: 30,
    categoria: "descanso",
    icono: "Moon",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "noche",
  },
  {
    id: "etapa-27",
    titulo: "Oración de la noche",
    descripcion: "Examen de conciencia, Santo Rosario / oraciones de la noche (Completorium).",
    horaInicio: "21:30",
    horaFin: "22:00",
    duracionMin: 30,
    categoria: "oracion",
    icono: "Church",
    alarmaSonora: true,
    diasSemana: "todos",
    bloqueMacro: "noche",
  },
  {
    id: "etapa-28",
    titulo: "A dormir...",
    descripcion: "Silencio de la casa, descanso reparador y paz bajo la protección divina.",
    horaInicio: "22:00",
    horaFin: "08:00",
    duracionMin: 600,
    categoria: "descanso",
    icono: "Moon",
    alarmaSonora: false,
    diasSemana: "todos",
    bloqueMacro: "noche",
  },
];

export const CONFIGURACION_DEFAULT: ConfiguracionRutina = {
  version: 1,
  sonidoHabilitado: true,
  tipoSonido: "campanilla",
  volumen: 75,
  notificacionesNavegador: false,
  etapas: RUTINA_PREDETERMINADA,
  metasMensuales: [
    {
      id: "meta-1",
      mes: "2026-10",
      titulo: "Mes del Santo Rosario en Familia",
      virtudDelMes: "Piedad y Fidelidad",
      descripcion: "Rezar al menos una decena diaria en familia y completar el Rosario los fines de semana.",
      completada: false,
      categoria: "oracion",
    },
    {
      id: "meta-2",
      mes: "2026-10",
      titulo: "Orden continuo de espacios comunes",
      virtudDelMes: "Diligencia y Caridad",
      descripcion: "Lograr que la cocina y sala queden impecables tras el bloque de las 13:15 y 18:00.",
      completada: false,
      categoria: "hogar",
    },
    {
      id: "meta-3",
      mes: "2026-10",
      titulo: "Completar lecturas formativas",
      virtudDelMes: "Sabiduría y Concentración",
      descripcion: "Leer 30 minutos todos los días a las 16:30.",
      completada: false,
      categoria: "lectura",
    },
  ],
  semanalConfig: {
    diasLaborables: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    enfoqueSemanal: "Ritmo de Homeschooling matutino + Tarde de arte, naturaleza y oración",
    notasSabado: "Sábado: Orden general del hogar, compras familiares, cocina especial y paseo al aire libre.",
    notasDomingo: "Domingo: Día del Señor. Santa Misa, almuerzo festivo, descanso de pantallas y tiempo familiar.",
  },
};
