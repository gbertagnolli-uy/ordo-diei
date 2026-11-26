// Catálogo centralizado de tutoriales de bienvenida y ayuda contextual para todas las pantallas de Ordo Diei.
// No importa módulos de cliente ni de servidor para poder usarse también en tests puros y SSR.

export type RolGuia = "todos" | "padres" | "hijos";

export interface PasoTutorial {
  titulo: string;
  descripcion: string;
  icono: string;
  rol?: RolGuia;
}

export interface BotonGuia {
  nombre: string;
  queHace: string;
  rol?: RolGuia;
}

export interface ConsejoGuia {
  pregunta: string;
  respuesta: string;
  rol?: RolGuia;
}

export interface GuiaPantalla {
  /** Clave estable para guardar en localStorage si el usuario ya vio el tutorial de esta pantalla. */
  clave: string;
  titulo: string;
  resumenCorto: string;
  paraQueSirve: string;
  pasos: PasoTutorial[];
  botonesClave: BotonGuia[];
  consejos?: ConsejoGuia[];
}

export type GuiaFiltrada = GuiaPantalla;

const p = (titulo: string, descripcion: string, icono: string, rol: RolGuia = "todos"): PasoTutorial => ({
  titulo,
  descripcion,
  icono,
  rol,
});

const b = (nombre: string, queHace: string, rol: RolGuia = "todos"): BotonGuia => ({
  nombre,
  queHace,
  rol,
});

const c = (pregunta: string, respuesta: string, rol: RolGuia = "todos"): ConsejoGuia => ({
  pregunta,
  respuesta,
  rol,
});

export const GUIAS_POR_CLAVE: Record<string, GuiaPantalla> = {
  acceso: {
    clave: "acceso",
    titulo: "Ingreso a Ordo Diei",
    resumenCorto: "Elegí tu perfil familiar y escribí tu PIN secreto para entrar.",
    paraQueSirve: "Desde acá cada miembro de la familia entra a su espacio personal o consulta la Agenda del Día compartida.",
    pasos: [
      p("1. Elegí tu perfil", "Tocá tu foto o tu nombre en la pantalla. Las medallas muestran los primeros puestos de la semana.", "👋"),
      p("2. Escribí tu PIN", "Usá los números en pantalla o el teclado para ingresar tu código secreto de 4 dígitos.", "🔢"),
      p("3. Mirá la Agenda pública", "Si solo querés ver las tareas del día de toda la familia sin iniciar sesión, tocá «Agenda del Día».", "📅"),
    ],
    botonesClave: [
      b("Avatar de perfil", "Selecciona a la persona para ingresar su PIN."),
      b("Agenda del Día", "Abre la vista familiar compartida de hoy sin necesidad de PIN."),
      b("Cambiar de usuario", "Vuelve a la lista de perfiles si tocaste otro nombre."),
      b("Borrar", "Borra el último número escrito del PIN."),
    ],
    consejos: [
      c("¿Qué pasa si me olvido el PIN?", "Un padre o madre puede cambiarlo en segundos desde Panel de administración → Restablecer PIN."),
      c("¿Por qué vuelve sola a fotos y frases?", "Después de unos segundos sin uso, la pantalla pasa a modo reposo para cuidar el monitor."),
    ],
  },

  "agenda-publica": {
    clave: "agenda-publica",
    titulo: "Agenda del Día",
    resumenCorto: "Mirá de un vistazo todas las tareas de la familia para hoy.",
    paraQueSirve: "Permite ver en una pantalla compartida qué tiene que hacer cada integrante hoy, su avance y sus pasos.",
    pasos: [
      p("1. Elegí cómo verla", "Alterná arriba entre «Por Miembros» (columnas por persona) y «Lista del Día» (todo junto).", "👨‍👩‍👧‍👦"),
      p("2. Filtrá por persona o estado", "Tocá la foto de alguien o un filtro («Pendientes», «En revisión», «Completadas») para enfocar la vista.", "🔍"),
      p("3. Tocá una tarea", "Al tocar cualquier tarjeta se abre el detalle con los responsables y la lista de pasos.", "✅"),
    ],
    botonesClave: [
      b("Por Miembros / Lista del Día", "Cambia entre columnas por persona y lista unificada."),
      b("Avatares superiores", "Filtra las tareas de una persona o vuelve a ver a toda la familia."),
      b("Chips de estado y buscador", "Filtra por pendientes, en revisión, completadas o por texto."),
      b("Ingresar para completar", "Te lleva al inicio para entrar con tu PIN y marcar la tarea."),
    ],
  },

  "dashboard-tareas": {
    clave: "dashboard-tareas",
    titulo: "Mis Tareas",
    resumenCorto: "Acá ves tus tareas de hoy, usás el cronómetro y ganás puntos.",
    paraQueSirve: "Es tu tablero principal para organizar y completar tus misiones diarias y semanales.",
    pasos: [
      p("1. Elegí tu vista", "Usá Lista, Tablero o Calendario según cómo te resulte más cómodo ver tus tareas.", "🗂️"),
      p("2. Iniciá la tarea para ganar 100%", "Tocá una tarea y apretá «Iniciar tarea» para arrancar el cronómetro y sumar el puntaje completo.", "⏱️"),
      p("3. Checklist y foto si hace falta", "Si tiene pasos o pide foto de prueba, completalos antes de finalizar.", "📸"),
      p("4. Finalizá para enviar", "Tocá «Finalizar» para enviar la tarea a revisión de tus padres o acreditarla.", "🎉"),
    ],
    botonesClave: [
      b("Lista / Tablero / Calendario", "Cambia el formato de visualización de tus tareas."),
      b("Iniciar tarea", "Arranca el cronómetro flotante y asegura el 100% de puntos al terminar."),
      b("Marcar realizada (80%)", "Completa una tarea sin haber usado el cronómetro (otorga 80% de puntos)."),
      b("Panel de agenda", "Muestra u oculta el calendario lateral rápido y el detalle."),
      b("Imprimir agenda semanal", "Abre la hoja semanal lista para imprimir."),
    ],
    consejos: [
      c("¿Por qué 100% vs 80%?", "Si tocás «Iniciar tarea» antes de hacerla ganás el 100% de puntos. Si la marcás directo después, sumás 80%."),
      c("¿Puedo pausar el cronómetro?", "Sí, desde el detalle o la tarjeta flotante de abajo a la derecha sin perder el tiempo acumulado."),
    ],
  },

  "dashboard-historial": {
    clave: "dashboard-historial",
    titulo: "Historial de Tareas",
    resumenCorto: "Revisá las misiones completadas y tus movimientos anteriores.",
    paraQueSirve: "Guarda el registro de todo lo que ya hiciste, los puntos ganados y los cambios de estado.",
    pasos: [
      p("1. Mirá tus totales", "Arriba ves cuántas tareas completaste, tus puntos y tu racha.", "📊"),
      p("2. Cambiá de pestaña", "Alterná entre «Misiones completadas» y el registro de movimientos.", "📑"),
    ],
    botonesClave: [
      b("Misiones completadas", "Lista tus tareas terminadas y aprobadas."),
      b("Logros y recompensas", "Muestra la línea temporal de cambios de estado."),
    ],
  },

  "dashboard-familia": {
    clave: "dashboard-familia",
    titulo: "Jerarquía Familiar",
    resumenCorto: "Conocé a todos los miembros de la familia, su nivel y su posición.",
    paraQueSirve: "Muestra la estructura del hogar y permite consultar rápido el resumen de cada integrante.",
    pasos: [
      p("1. Explorá el árbol", "Ves a los padres arriba y a los hijos abajo con su foto, nivel y puntos.", "🌳"),
      p("2. Tocá una tarjeta", "Al hacer clic en cualquier miembro se abre su tarjeta de estadísticas rápidas.", "🪪"),
    ],
    botonesClave: [
      b("Tarjeta de miembro", "Abre el resumen de nivel, rachas y progreso de esa persona."),
    ],
  },

  "agenda-semanal-imprimir": {
    clave: "agenda-semanal-imprimir",
    titulo: "Agenda Semanal Imprimible",
    resumenCorto: "Prepará e imprimí la hoja con todas las tareas de la semana.",
    paraQueSirve: "Genera una grilla limpia de lunes a domingo para pegar en la heladera o escritorio.",
    pasos: [
      p("1. Elegí la semana", "Usá «Semana anterior» o «Semana siguiente» para ubicar las fechas.", "📆"),
      p("2. Imprimí", "Tocá «Imprimir» para sacar la hoja en papel o guardarla como PDF.", "🖨️"),
    ],
    botonesClave: [
      b("Semana anterior / siguiente", "Cambia la semana mostrada en la grilla."),
      b("Imprimir", "Abre la ventana de impresión sin menús ni barras de la app."),
    ],
  },

  horarios: {
    clave: "horarios",
    titulo: "Horarios y Rutina Familiar",
    resumenCorto: "Seguí el bloque horario actual con el temporizador visual y avisos.",
    paraQueSirve: "Mantiene el ritmo diario del hogar desde la mañana hasta la noche con campanas suaves y vistas diaria, semanal y mensual.",
    pasos: [
      p("1. Mirá el bloque En Vivo", "El disco de colores muestra cuánto tiempo queda de la actividad actual (verde, ámbar, rojo).", "⏳"),
      p("2. Usá el Modo Enfoque", "Tocá «Modo Enfoque» para poner el temporizador en pantalla completa sin distracciones.", "🖥️"),
      p("3. Recorré las pestañas", "Visitá «Diaria», «Semanal» y «Mensual» para tildar bloques cumplidos y ver metas.", "📋"),
      p("4. Editá la rutina", "Tocá «+ Nueva Etapa» o el menú ⋯ de una etapa para cambiar horarios, campana e ícono.", "✏️", "padres"),
    ],
    botonesClave: [
      b("Modo Enfoque", "Abre el temporizador en pantalla completa con controles grandes."),
      b("Pausar / +5 min / Anterior / Siguiente", "Ajusta el temporizador actual sin perder el resto del día."),
      b("Ícono de Audio", "Elige el tono de campana, ajusta el volumen o prueba el sonido."),
      b("+ Nueva Etapa / Restablecer", "Agrega bloques horarios o vuelve a la rutina base.", "padres"),
    ],
  },

  habitos: {
    clave: "habitos",
    titulo: "Mis Hábitos",
    resumenCorto: "Practicá tus hábitos cada día y subí paso a paso sin perder tu avance.",
    paraQueSirve: "Ayuda a construir constancia en oración, orden, cuidado y lectura mediante pequeños pasos diarios.",
    pasos: [
      p("1. Elegí o adoptá un hábito", "Tocá «+ Agregar hábito» o «Adoptar» en los hábitos comunitarios para sumarlo a tu día.", "🌱"),
      p("2. Marcá tu día", "En cada tarjeta tocá «Hecho» cuando lo cumplas, o «No pude» para anotar el motivo sin perder tu escalera.", "✅"),
      p("3. Mirá tu escalera y trayectoria", "Abajo ves en qué escalón vas, tu constancia de 60 días y el mapa de 6 meses.", "📈"),
      p("4. Registro familiar en grupo", "En la pestaña «Familia» podés marcar en un toque las oraciones que rezaron juntos.", "🙏", "padres"),
    ],
    botonesClave: [
      b("+ Agregar hábito", "Abre el asistente para crear o adoptar un hábito y elegir sus días."),
      b("Hecho / No pude / Deshacer", "Registra el cumplimiento diario o justifica una ausencia."),
      b("Menú ⋯ del hábito", "Permite ajustar días y ancla, dejar de practicar, editar o archivar."),
      b("Cargar libro / Registrar páginas", "En «Leer un libro», anota las páginas leídas hacia tu premio."),
    ],
    consejos: [
      c("¿Qué pasa si fallo un día?", "El sistema retoma desde tu escalón sin castigos duros; si avisás con «No pude», justificás el día."),
    ],
  },

  "mis-premios": {
    clave: "mis-premios",
    titulo: "Mis Premios y Cofre Diario",
    resumenCorto: "Abrí tus cofres, premios sorpresa, cartas de evento y usá tus vales.",
    paraQueSirve: "Reúne todo lo que ganaste por tu esfuerzo y, para los padres, muestra los premios pendientes de entregar.",
    pasos: [
      p("1. Reclamá tus premios disponibles", "Tocá «Abrir cofre» o «Reclamar premio» en las tarjetas listas arriba.", "🎁"),
      p("2. Esperá el cofre de las 18:00", "Si tuviste buena conducta hoy, tu cofre diario se habilita para abrir desde las 18:00.", "🕕", "hijos"),
      p("3. Usá tus vales frente a tus padres", "Deslizá «Arrancá para usar» en un vale cuando vayas a canjearlo en casa.", "🎟️"),
      p("4. Entregá pedidos físicos", "En «Para entregar» confirmá cuando ya cumpliste un libro o premio pedido.", "📦", "padres"),
    ],
    botonesClave: [
      b("Abrir cofre / Reclamar", "Abre el regalo 3D, descubre cartas/puntos o envía el pedido del premio."),
      b("Arrancá para usar", "Desprende el troquel del vale para marcarlo como usado."),
      b("Marcar entregado", "Confirma que el premio físico o pedido ya fue entregado al hijo.", "padres"),
    ],
  },

  "premio-grupal": {
    clave: "premio-grupal",
    titulo: "Premio Grupal",
    resumenCorto: "Mirá cuánto falta entre toda la familia para ganar el desafío compartido.",
    paraQueSirve: "Muestra el medidor de avance grupal hacia un vale común según el porcentaje de tareas completadas entre dos fechas.",
    pasos: [
      p("1. Revisá el premio en juego", "Arriba dice qué vale ganan todos si alcanzan la meta en las fechas indicadas.", "🎯"),
      p("2. Mirá el medidor de porcentaje", "Cada tarea completada por cualquier integrante hace subir el nivel del objetivo común.", "💧"),
    ],
    botonesClave: [
      b("Medidor visual", "Muestra el porcentaje actual versus la meta fijada por los padres."),
    ],
  },

  premios: {
    clave: "premios",
    titulo: "Premios Familiares",
    resumenCorto: "Configurá premios periódicos por tareas y restaurá vales usados.",
    paraQueSirve: "Permite a padres y madres crear premios semanales o mensuales automáticos ligados a tareas específicas.",
    pasos: [
      p("1. Creá un premio", "Tocá «+ Nuevo Premio», elegí si es vale o cantidad, la frecuencia y qué tareas lo desbloquean.", "🏆"),
      p("2. Administrá los existentes", "Usá el menú ⋯ o deslizá una fila para editar o eliminar un premio.", "✏️"),
      p("3. Auditá vales", "Abajo ves todos los vales de la familia y podés restaurar uno si se arrancó por error.", "🎟️"),
    ],
    botonesClave: [
      b("+ Nuevo Premio", "Abre el formulario para crear un premio semanal o mensual."),
      b("Editar / Eliminar (⋯)", "Modifica o borra un premio configurado."),
      b("Restaurar", "Vuelve a dejar disponible un vale que figuraba usado."),
    ],
  },

  logros: {
    clave: "logros",
    titulo: "Mis Logros",
    resumenCorto: "Explorá las insignias conseguidas y cuánto te falta para las próximas.",
    paraQueSirve: "Agrupa tus medallas y metas cumplidas en tareas, constancia, hábitos, oración, nivel y cartas.",
    pasos: [
      p("1. Abrí cada categoría", "Tocá cualquiera de los 6 bloques desplegables para ver sus logros.", "🏅"),
      p("2. Mirá las barras de progreso", "Cada tarjeta muestra si ya la obtuviste o cuánto te falta para destrabarla.", "📏"),
    ],
    botonesClave: [
      b("Desplegables por categoría", "Expandí o contraé Tareas, Constancia, Hábitos, Oración, Nivel y Cartas."),
    ],
  },

  perfil: {
    clave: "perfil",
    titulo: "Mi Perfil",
    resumenCorto: "Tu resumen de nivel, puntos, rachas, ánimo, conducta y avisos push.",
    paraQueSirve: "Concentra todas tus estadísticas personales, tu foto, evolución emocional y configuración de notificaciones.",
    pasos: [
      p("1. Revisá tu nivel y monedas", "Arriba ves tu foto, nivel actual, XP, puntos disponibles, estrellas e incienso.", "⭐"),
      p("2. Consultá ánimo y conducta", "Más abajo tenés tu curva de estado de ánimo y el registro de conducta de los últimos días.", "💛"),
      p("3. Activá avisos en este dispositivo", "En «Avisos» podés activar notificaciones push para recibir recordatorios.", "🔔"),
    ],
    botonesClave: [
      b("+ Cambiar foto de perfil", "Te permite subir una foto nueva para tu perfil."),
      b("Ver logros", "Lleva directo a tu colección completa de logros."),
      b("Switch Avisos / Probar", "Activa las notificaciones del navegador en el equipo actual."),
    ],
  },

  rules: {
    clave: "rules",
    titulo: "Reglas del Hogar",
    resumenCorto: "Leé los acuerdos y normas de convivencia de la familia.",
    paraQueSirve: "Mantiene visibles para todos las reglas importantes de la casa.",
    pasos: [
      p("1. Leé las normas vigentes", "Están siempre disponibles para recordar los acuerdos familiares.", "📜"),
      p("2. Editá cuando haga falta", "Como padre/madre podés modificar el texto y tocar «Guardar».", "✍️", "padres"),
    ],
    botonesClave: [
      b("Guardar", "Actualiza las reglas del hogar para toda la familia.", "padres"),
    ],
  },

  "estudio-padres": {
    clave: "estudio-padres",
    titulo: "Panel de Estudio (Padres)",
    resumenCorto: "Supervisá las clases de hoy, las revisiones pendientes y el avance semanal.",
    paraQueSirve: "Es el centro de control de homeschooling para padres y madres.",
    pasos: [
      p("1. Usá las pestañas de arriba", "Movete entre Materias, Plan, Revisión, Libreta, Lectura, Memoria, Reportes y Apoyos.", "🎓"),
      p("2. Revisá alertas y entregas", "Arriba ves si hay fotos o tareas esperando aprobación en «Revisión».", "📥"),
      p("3. Ponete al día si hubo atrasos", "Si un hijo tiene clases atrasadas, tocá «Ponerse al día» para repartirlas desde hoy.", "🔄"),
    ],
    botonesClave: [
      b("Pestañas de Estudio", "Navegan a cada herramienta curricular y de seguimiento."),
      b("Buscador (⌘K o /)", "Busca al instante materias, cursos, lecciones, materiales o actividades."),
      b("Mensajes y Campana de avisos", "Chat directo familiar y notificaciones recientes de Estudio."),
      b("Ponerse al día", "Reprograma automáticamente clases atrasadas de un alumno."),
    ],
  },

  "estudio-hoy": {
    clave: "estudio-hoy",
    titulo: "Hoy Aprendo",
    resumenCorto: "Acá ves tus clases de hoy paso a paso, videos, lecturas y trabajos.",
    paraQueSirve: "Organiza tu jornada de estudio de forma clara para que sepas qué hacer primero y qué sigue después.",
    pasos: [
      p("1. Empezá por «Lo que sigue»", "Tocá «Empezar» en la tarjeta principal para abrir la clase con sus videos y lecturas.", "▶️"),
      p("2. Imprimí o sacá foto si hace falta", "Usá «Imprimir mi hoja» para trabajar en papel y «Foto de mi trabajo» para enviar tu cuaderno.", "📷"),
      p("3. Usá las secciones extras", "Abajo tenés acceso rápido a Mi lectura, Mi memoria, Mis actividades, Mi portafolio y Modo calmo.", "🧩"),
    ],
    botonesClave: [
      b("Empezar", "Abre la clase en pantalla completa con consignas, materiales y quiz."),
      b("Imprimir mi hoja", "Prepara e imprime la hoja diaria del cuaderno."),
      b("Sacar una foto de mi trabajo", "Sube fotos de tu tarea hecha para que la revisen tus padres."),
      b("Modo calmo", "Reduce colores intensos y animaciones si necesitás trabajar más tranquilo."),
    ],
  },

  "estudio-plan": {
    clave: "estudio-plan",
    titulo: "Plan de Estudio (Calendario)",
    resumenCorto: "Organizá en el calendario qué días se estudia cada clase, feriados y vacaciones.",
    paraQueSirve: "Permite ver el año escolar completo, mover clases arrastrándolas y gestionar días sin clase.",
    pasos: [
      p("1. Elegí un hijo o «Todos»", "Usá las pestañas superiores para ver el calendario de un alumno o de toda la familia.", "🗓️"),
      p("2. Configurá el año o cargá la semana", "Usá «Configurar el año» para vacaciones y fiestas, o «Cargar la semana» para tareas rápidas.", "⚡"),
      p("3. Mové o calificá días", "Arrastrá una clase pendiente a otro día o tocala para calificar, imprimir o sumar materiales.", "✋"),
    ],
    botonesClave: [
      b("Configurar el año", "Marca vacaciones y fiestas litúrgicas y reparte las clases."),
      b("Cargar la semana", "Carga materiales diarios rápidos de lunes a viernes."),
      b("Hoy no hay clase", "Suspende un día por enfermedad o salida corriendo los planes."),
      b("Calendario del teléfono", "Genera un enlace .ics para ver el plan en Google o Apple Calendar."),
    ],
  },

  "estudio-semana": {
    clave: "estudio-semana",
    titulo: "Hoja Semanal de Estudio",
    resumenCorto: "Imprimí la lista de clases y lecturas de la semana para el cuaderno o heladera.",
    paraQueSirve: "Resume de lunes a viernes (y fin de semana si aplica) todo lo planeado para un hijo.",
    pasos: [
      p("1. Elegí el hijo y la semana", "Seleccioná al alumno y movete con «Semana anterior / siguiente».", "👦"),
      p("2. Imprimí la hoja", "Tocá «Imprimir la semana» para obtener una copia limpia en papel.", "🖨️"),
    ],
    botonesClave: [
      b("‹ Semana anterior / siguiente › / Esta semana", "Navega por semanas."),
      b("Imprimir la semana", "Lanza la impresión A4 limpia."),
    ],
  },

  "estudio-materias": {
    clave: "estudio-materias",
    titulo: "Materias y Cursos",
    resumenCorto: "Creá materias, armá cursos con lecciones y asignalos al plan de tus hijos.",
    paraQueSirve: "Es la biblioteca curricular donde se organizan los contenidos por materia y curso.",
    pasos: [
      p("1. Creá una materia", "Tocá «Nueva materia» para definir nombre, color, ícono y portada.", "📚"),
      p("2. Sumá cursos", "Dentro de una materia creá un curso propio, importá un archivo o elegí de la Biblioteca católica.", "🧩"),
      p("3. Asigná el curso al plan", "Usá «Asignar curso al plan» para repartir sus clases en fechas para cada hijo.", "📅"),
    ],
    botonesClave: [
      b("Nueva materia / Nuevo curso", "Crea materias o cursos nuevos."),
      b("Asignar curso al plan", "Asistente en 4 pasos para programar el curso en el calendario."),
      b("Biblioteca católica / Importar curso", "Agrega cursos prearmados o archivos .json compartidos."),
      b("Cargar material al plan diario", "Agrega actividades sueltas para un día puntual."),
    ],
  },

  "estudio-materia-detalle": {
    clave: "estudio-materia-detalle",
    titulo: "Detalle de Materia, Curso y Clases",
    resumenCorto: "Construí y ordená las clases, adjuntá materiales y armá evaluaciones.",
    paraQueSirve: "Permite editar cada curso paso a paso: lecciones, textos, videos, documentos imprimibles y preguntas de quiz.",
    pasos: [
      p("1. Navegá con el árbol lateral", "A la izquierda (o botón «Cursos y lecciones» en celular) ves todos los cursos y clases.", "🌲"),
      p("2. Cargá clases rápido o una por una", "Usá «Agregar varias» para crear muchas clases por línea, o «Nueva clase» para detallarla.", "➕", "padres"),
      p("3. Agregá materiales y quiz", "Dentro de cada clase podés sumar textos, imágenes, videos, PDFs/ePubs y cuestionarios.", "📝", "padres"),
    ],
    botonesClave: [
      b("Agregar varias / Nueva clase", "Crea lecciones en lote o individualmente.", "padres"),
      b("Materiales / Quiz / Imprimir", "Administra adjuntos, preguntas y hojas imprimibles de cada clase."),
      b("Plan de cada alumno", "Pausa, reanuda o ajusta días de estudio de cada hijo.", "padres"),
    ],
  },

  "estudio-lectura": {
    clave: "estudio-lectura",
    titulo: "Lista de Lectura",
    resumenCorto: "Llevá el registro de libros en papel leídos, páginas y narraciones.",
    paraQueSirve: "Acompaña el hábito lector escolar con metas de páginas, racha y narración final.",
    pasos: [
      p("1. Agregá un libro", "Tocá «+ Agregar libro» con título, autor y total de páginas.", "📖"),
      p("2. Registrá tus páginas", "Mientras lo estás leyendo, tocá «Registrar lectura» para anotar hasta qué página llegaste.", "🔖"),
      p("3. Terminá con tu narración", "Al acabarlo tocá «Lo terminé» para calificarlo con estrellas y contar lo que más te gustó.", "⭐"),
    ],
    botonesClave: [
      b("+ Agregar libro", "Suma un nuevo libro por leer o ya en curso."),
      b("Registrar lectura", "Actualiza la página actual y minutos leídos."),
      b("Lo terminé / Agregar narración", "Cierra el libro con estrellas y resumen."),
    ],
  },

  "estudio-memoria": {
    clave: "estudio-memoria",
    titulo: "Memoria y Catecismo",
    resumenCorto: "Aprendé oraciones, versículos y preguntas de memoria con repaso espaciado.",
    paraQueSirve: "Programa automáticamente qué textos conviene repasar hoy para recordarlos a largo plazo.",
    pasos: [
      p("1. Elegí oraciones o textos", "Sumá oraciones del catálogo o textos propios con «+ Agregar».", "🕊️", "padres"),
      p("2. Tocá un texto para leerlo", "Toda la familia puede abrir cualquier ítem para practicarlo.", "📜"),
      p("3. Tomá la lección con «Recitar hoy»", "Cuando haya ítems pendientes, el padre toma el recitado oral o imprime hoja de caligrafía.", "🗣️", "padres"),
    ],
    botonesClave: [
      b("+ Agregar", "Suma textos del catálogo católico o propios.", "padres"),
      b("Recitar hoy (N)", "Inicia la sesión guiada de repaso oral.", "padres"),
      b("Hoja para copiar a mano", "Genera renglones imprimibles para practicar caligrafía.", "padres"),
    ],
  },

  "estudio-recitar": {
    clave: "estudio-recitar",
    titulo: "Sesión de Recitado",
    resumenCorto: "Tomá la lección oral ocultando el texto y calificá cuánto la recuerda.",
    paraQueSirve: "Ajusta automáticamente los días hasta el próximo repaso según cómo haya recitado el alumno.",
    pasos: [
      p("1. Escuchá el recitado", "Si necesita ayuda tocá «Pista» o «Ver el texto para corregir».", "👂"),
      p("2. Calificá cómo salió", "Elegí entre «No la supo», «Con dudas», «Bien» o «Perfecto» para avanzar.", "⭐"),
    ],
    botonesClave: [
      b("Pista / Ver el texto", "Muestra iniciales o el texto completo sin que mire el niño."),
      b("Botones de calificación (4 niveles)", "Guarda el resultado y programa el siguiente repaso."),
    ],
  },

  "estudio-horas": {
    clave: "estudio-horas",
    titulo: "Actividades Fuera de Pantalla",
    resumenCorto: "Registrá salidas, museos, música, deportes o experimentos que suman horas de estudio.",
    paraQueSirve: "Documenta el aprendizaje práctico y suma sus horas a cada materia y reporte.",
    pasos: [
      p("1. Cronometrá en vivo o cargá después", "Tocá «Cronometrar» mientras hacen la actividad o «+ Nueva actividad» para cargarla manualmente.", "⏱️", "padres"),
      p("2. Explorá por mes", "Usá las flechas de mes y el buscador para revisar todas las actividades registradas.", "🔍"),
    ],
    botonesClave: [
      b("Cronometrar / Parar y registrar", "Mide el tiempo real de la actividad y abre el formulario precargado.", "padres"),
      b("+ Nueva actividad", "Carga título, materia, horario, lugar y participantes.", "padres"),
      b("Reportes", "Abre los gráficos e informes de horas acumuladas."),
    ],
  },

  "estudio-portafolio": {
    clave: "estudio-portafolio",
    titulo: "Portafolio de Trabajos",
    resumenCorto: "Galería de evidencias y fotos de los trabajos escolares aprobados o en revisión.",
    paraQueSirve: "Guarda las fotos de cuadernos, dibujos y maquetas para revisar, comentar e imprimir.",
    pasos: [
      p("1. Subí tu trabajo", "Tocá «Mostrar mi trabajo» para sacar o elegir hasta 6 fotos y contar qué hiciste.", "📸", "hijos"),
      p("2. Filtrá y tocá una tarjeta", "Buscá por materia, mes o destacadas; al tocar se abre la vista completa con comentarios.", "🖼️"),
      p("3. Imprimí el portafolio", "Usá «Portafolio para imprimir» para armar la carpeta física A4.", "🖨️", "padres"),
    ],
    botonesClave: [
      b("Mostrar mi trabajo", "Sube fotos y descripción de un trabajo escolar.", "hijos"),
      b("Portafolio para imprimir", "Abre la versión imprimible por rango de fechas.", "padres"),
      b("Destacar / Comentar / Volver a enviar", "Acciones dentro del detalle de cada evidencia."),
    ],
  },

  "estudio-revision": {
    clave: "estudio-revision",
    titulo: "Revisión de Trabajos",
    resumenCorto: "Revisá las fotos enviadas por tus hijos, calificalas o pedí ajustes.",
    paraQueSirve: "Centraliza las evidencias escolares pendientes de aprobación paterna.",
    pasos: [
      p("1. Revisá las pendientes", "Podés aprobar con estrellas y nota para la libreta, o pedir un ajuste con un comentario.", "📝"),
      p("2. Aprobá rápido", "Deslizá una fila o usá «Aprobar las N» cuando quieras validar varias juntas.", "⚡"),
    ],
    botonesClave: [
      b("Aprobar / Ajustar", "Califica el trabajo o lo devuelve al alumno con indicaciones."),
      b("Aprobar las N", "Aprueba en lote las evidencias visibles en Pendientes."),
      b("Destacar", "Marca trabajos aprobados para incluirlos en reportes y portafolio."),
    ],
  },

  "estudio-reportes": {
    clave: "estudio-reportes",
    titulo: "Reportes de Estudio",
    resumenCorto: "Consultá horas estudiadas, gráficos por materia y cumplimiento de metas.",
    paraQueSirve: "Resume el tiempo dedicado por año, trimestre o mes y permite fijar metas de horas por materia.",
    pasos: [
      p("1. Elegí período y alumno", "Seleccioná si querés ver el año escolar, un trimestre o un mes.", "📊"),
      p("2. Fijá metas de horas", "En la tabla de materias podés escribir la meta anual de horas (se guarda al salir del campo).", "🎯", "padres"),
      p("3. Guardá o imprimí", "Usá «Imprimir / Guardar PDF» para conservar un informe formal.", "🖨️"),
    ],
    botonesClave: [
      b("Selectores de Alumno / Período / Fecha", "Recalculan métricas y gráfico de barras."),
      b("Imprimir / Guardar PDF", "Prepara el informe limpio para papel o PDF."),
    ],
  },

  "estudio-libreta": {
    clave: "estudio-libreta",
    titulo: "Libreta de Calificaciones",
    resumenCorto: "Registrá notas por materia y consultá el promedio general de cada hijo.",
    paraQueSirve: "Lleva el historial de exámenes, proyectos, orales y tareas calificadas.",
    pasos: [
      p("1. Elegí al alumno", "Tocá el nombre del hijo arriba para ver sus materias y promedios.", "📚"),
      p("2. Cargá una nota", "Tocá «+ Agregar nota» o «+ Nota» en una materia para puntuar de 0 a 100.", "💯"),
      p("3. Abrí el Boletín", "Tocá «Boletín» para generar el informe formal por trimestre.", "📜"),
    ],
    botonesClave: [
      b("+ Agregar nota / + Nota", "Abre el formulario con puntajes rápidos (100 a 50) y comentario."),
      b("Boletín", "Lleva al boletín imprimible por períodos."),
      b("Imprimir", "Imprime la libreta completa."),
    ],
  },

  "estudio-boletin": {
    clave: "estudio-boletin",
    titulo: "Boletín por Período",
    resumenCorto: "Armá e imprimí el boletín trimestral o cuatrimestral con comentario y firmas.",
    paraQueSirve: "Consolida promedio, asistencia, horas, materias, lecturas y memoria de un período escolar.",
    pasos: [
      p("1. Definí los períodos del año", "Tocá «Períodos» para crear los 3 trimestres del año con un clic o fechas propias.", "🗓️"),
      p("2. Escribí el comentario final", "Al pie podés escribir una devolución familiar que se guarda automáticamente.", "✍️"),
      p("3. Imprimí el boletín", "Tocá «Imprimir boletín» para obtener la hoja oficial A4.", "🖨️"),
    ],
    botonesClave: [
      b("Períodos", "Administra trimestres o períodos escolares."),
      b("Píldoras de Período e Hijo", "Cambia el boletín mostrado."),
      b("Imprimir boletín", "Abre la impresión A4."),
    ],
  },

  "estudio-dias-sin-clase": {
    clave: "estudio-dias-sin-clase",
    titulo: "Días sin Clase",
    resumenCorto: "Registrá feriados o ausencias para que el plan corra las lecciones sin atrasos.",
    paraQueSirve: "Evita que los alumnos acumulen clases vencidas en feriados, paseos o días de enfermedad.",
    pasos: [
      p("1. Agregá un día sin clase", "Tocá «+ Agregar», elegí fecha, a quién aplica y el motivo.", "📅"),
      p("2. Revisá el impacto antes de guardar", "El diálogo muestra cómo se mueven las fechas de cada curso afectado.", "👀"),
    ],
    botonesClave: [
      b("+ Agregar", "Abre el asistente para suspender clases un día."),
      b("Menú ⋯ (Editar / Eliminar)", "Cambia el motivo o quita el día libre recalculando el plan."),
    ],
  },

  "estudio-muro": {
    clave: "estudio-muro",
    titulo: "Muro Familiar de Estudio",
    resumenCorto: "Compartí avisos escolares, celebrá logros y mirá la fiesta litúrgica del día.",
    paraQueSirve: "Espacio común de comunicación y aliento para toda la familia.",
    pasos: [
      p("1. Mirá la celebración de hoy", "Arriba aparece el oficio o santo del día con su color litúrgico.", "⛪"),
      p("2. Publicá un aviso", "Escribí un título y detalle, elegí si fijarlo arriba y tocá «Publicar».", "📢", "padres"),
      p("3. Reaccioná y comentá", "Tocá «Comentar» en cualquier publicación para dejar reacciones o mensajes.", "💬"),
    ],
    botonesClave: [
      b("Publicar", "Crea un aviso visible para toda la familia.", "padres"),
      b("Comentar / Reacciones", "Despliega el hilo de comentarios y emojis 👍 ❤️ 🙏."),
    ],
  },

  "estudio-mensajes": {
    clave: "estudio-mensajes",
    titulo: "Mensajes de Estudio",
    resumenCorto: "Conversá 1 a 1 con padres o hermanos sobre dudas de clase y tareas.",
    paraQueSirve: "Mensajería privada interna entre los integrantes del hogar.",
    pasos: [
      p("1. Elegí a una persona", "Tocá a quien quieras escribirle en la columna izquierda.", "💬"),
      p("2. Escribí y enviá", "Usá Enter para enviar rápido o Shift+Enter para hacer un salto de línea.", "✉️"),
    ],
    botonesClave: [
      b("Lista de familiares", "Cambia la conversación abierta."),
      b("Enviar", "Envía el mensaje escrito."),
    ],
  },

  "estudio-neuro": {
    clave: "estudio-neuro",
    titulo: "Apoyos para Cada Alumno",
    resumenCorto: "Configurá Modo relajado, Primero/Después e Historias sociales por hijo.",
    paraQueSirve: "Adapta la vista de «Hoy aprendo» para niños que necesitan menos estímulos o pasos anticipados.",
    pasos: [
      p("1. Activá apoyos por alumno", "Prendé «Modo relajado» o «Primero / Después» (con su recompensa al terminar).", "🫶"),
      p("2. Armá historias sociales", "Usá las plantillas o creá una historia con pasos simples e íconos.", "📖"),
      p("3. Mostrala hoy", "Tocá «Mostrar hoy» en una historia para que aparezca arriba en el día del hijo elegido.", "✨"),
    ],
    botonesClave: [
      b("Switches de Modo relajado / Primero-Después", "Guardan al instante la preferencia del alumno."),
      b("Plantillas / + Nueva", "Crean historias sociales de 3 a 5 pasos."),
      b("Mostrar hoy / Ver", "Envía la historia a un hijo hoy o la previsualiza."),
    ],
  },

  "estudio-imprimir": {
    clave: "estudio-imprimir",
    titulo: "Vista Imprimible",
    resumenCorto: "Hoja formateada en blanco y negro lista para imprimir o guardar como PDF.",
    paraQueSirve: "Genera material limpio para el cuaderno o evaluaciones en papel.",
    pasos: [
      p("1. Revisá la vista previa", "Si la pantalla tiene switches de formato (como consigna o renglones), ajustalos antes de imprimir.", "📄"),
      p("2. Imprimí", "Tocá «Imprimir» o «Imprimir de nuevo» cuando estés listo.", "🖨️"),
    ],
    botonesClave: [
      b("Imprimir / Imprimir de nuevo", "Abre el diálogo de impresión del dispositivo."),
      b("Volver", "Regresa a la pantalla anterior de Estudio."),
    ],
  },

  liturgia: {
    clave: "liturgia",
    titulo: "Liturgia Tradicional",
    resumenCorto: "Accedé al Calendario, Breviario, Misal, Salterio, Propios y Santo Rosario.",
    paraQueSirve: "Reúne los textos litúrgicos tradicionales bilingües (Latín / Español) para vivir el año cristiano en casa.",
    pasos: [
      p("1. Elegí qué querés rezar o consultar", "Para la oración diaria empezá por «Breviarium», «Missale» o «Rosarium».", "⛪"),
      p("2. Elegí idioma y versión", "Adentro de cada libro podés leer en Ambos idiomas, solo Latín o solo Español, y cambiar de rúbrica (1906/1888/1570).", "📖"),
    ],
    botonesClave: [
      b("Tarjetas de libros", "Abren el Calendarium, Breviarium, Missale, Propios, Ordinarium, Psalterium o Rosarium."),
    ],
  },

  "liturgia-calendarium": {
    clave: "liturgia-calendarium",
    titulo: "Calendarium Litúrgico",
    resumenCorto: "Consultá la fiesta de hoy, el mes con sus colores, las Horas, la Misa y el Martirologio.",
    paraQueSirve: "Muestra el cuadro completo de lo que celebra la Iglesia en cualquier fecha.",
    pasos: [
      p("1. Cambiá de día o mes", "Tocá cualquier día del calendario mensual o usá las flechas de fecha arriba.", "📅"),
      p("2. Saltá directo a rezar", "Desde las tarjetas de abajo entrás directo a la Hora actual del Breviario, la Misa o el Rosario del día.", "🕯️"),
    ],
    botonesClave: [
      b("Navegador de fecha y Hoy", "Mueve la fecha consultada."),
      b("Celdas del mes", "Seleccionan cualquier día para ver su celebración y colores."),
      b("Abrir Breviarium / Missale / Rosarium", "Llevan al texto completo de esa fecha."),
    ],
  },

  "liturgia-breviarium": {
    clave: "liturgia-breviarium",
    titulo: "Breviarium (Liturgia de las Horas)",
    resumenCorto: "Rezamos las 8 Horas canónicas del día en Latín y Español.",
    paraQueSirve: "Santifica cada momento del día desde Maitines y Laudes hasta Vísperas y Completas.",
    pasos: [
      p("1. Ubicá la hora actual", "La tarjeta destacada «AHORA» sugiere la hora que corresponde al momento del día.", "🕰️"),
      p("2. Elegí idioma y secciones", "Dentro de una Hora podés cambiar entre Ambos, Latín o Español y saltar entre Salmos y Oraciones.", "📖"),
    ],
    botonesClave: [
      b("Barra de 8 Horas", "Salta rápido entre Maitines, Laudes, Prima, Tercia, Sexta, Nona, Vísperas y Completas."),
      b("Ambos / Latín / Español", "Alterna las columnas de idioma en el lector."),
    ],
  },

  "liturgia-missale": {
    clave: "liturgia-missale",
    titulo: "Missale Romanum",
    resumenCorto: "Leé y seguí la Santa Misa del día completa o solo sus partes propias.",
    paraQueSirve: "Permite preparar las lecturas y oraciones antes de ir a Misa o seguirlas en familia.",
    pasos: [
      p("1. Elegí «Misa completa» o «Solo el propio»", "«Solo el propio» muestra Introito, Oración, Epístola, Evangelio y demás partes cambiantes del día.", "✝️"),
      p("2. Saltá por secciones", "Usá las píldoras superiores para ir directo al Evangelio, Canon o Comunión.", "📍"),
    ],
    botonesClave: [
      b("Solo el propio / Misa completa", "Alterna entre las partes propias del día y el texto completo."),
      b("Ambos / Latín / Español", "Cambia el idioma de lectura."),
    ],
  },

  "liturgia-ordinarium": {
    clave: "liturgia-ordinarium",
    titulo: "Ordinarium y Preces",
    resumenCorto: "Consultá las partes fijas de la Misa y las oraciones comunes del cristiano.",
    paraQueSirve: "Sirve de referencia rápida para aprender y repasar el Ordo Missæ, Credo, Padre Nuestro y demás preces.",
    pasos: [
      p("1. Elegí la pestaña", "Alterná entre «Ordo Missæ» y «Preces comunes».", "🙏"),
      p("2. Leé en Latín o Español", "Usá los botones de idioma para comparar o rezar en la lengua que prefieras.", "🗣️"),
    ],
    botonesClave: [
      b("Ordo Missæ / Preces comunes", "Cambia entre el Ordinario de la Misa y las oraciones comunes."),
      b("Ir al Missale del día", "Abre las lecturas propias de hoy."),
    ],
  },

  "liturgia-psalterium": {
    clave: "liturgia-psalterium",
    titulo: "Psalterium (Salterio)",
    resumenCorto: "Buscá y leé los 150 Salmos y los 6 Cánticos bíblicos bilingües.",
    paraQueSirve: "Ofrece acceso directo a todo el Salterio en numeración Vulgata tradicional.",
    pasos: [
      p("1. Buscá por número o palabra", "Escribí por ejemplo «50» o «Miserere» y filtrá entre Salmos o Cánticos.", "🔍"),
      p("2. Leé y avanzá", "Tocá un salmo para leerlo y usá «Anterior / Siguiente» para recorrer el salterio.", "📖"),
    ],
    botonesClave: [
      b("Buscador y filtros (Todos / Salmos / Cánticos)", "Encuentra cualquier salmo o cántico al instante."),
      b("Volver al Salterio / Anterior / Siguiente", "Navega dentro del modo lectura."),
    ],
  },

  "liturgia-proprium": {
    clave: "liturgia-proprium",
    titulo: "Propio del Tiempo y de los Santos",
    resumenCorto: "Explorá las fiestas de todo el año litúrgico y del santoral tradicional.",
    paraQueSirve: "Permite consultar la Misa y el Oficio de cualquier domingo, tiempo fuerte o santo por mes.",
    pasos: [
      p("1. Elegí un tiempo o un mes", "Tocá el tiempo litúrgico o el mes del año (o usá el buscador en Santos).", "🗓️"),
      p("2. Abrí Missa u Officium", "Al tocar una celebración podés leer tanto su Misa como su Oficio.", "📜"),
    ],
    botonesClave: [
      b("Botones de Tiempo / Mes", "Filtran las celebraciones del ciclo."),
      b("Missa / Officium", "Alternan entre los textos de la Misa y los del Breviario."),
      b("Ver en Calendarium", "Abre esa fecha en el calendario litúrgico."),
    ],
  },

  "liturgia-rosarium": {
    clave: "liturgia-rosarium",
    titulo: "Santo Rosario",
    resumenCorto: "Contemplá los misterios y rezá el Rosario paso a paso con contador táctil.",
    paraQueSirve: "Guía el rezo de los 5 misterios del día o de las 3 coronas completas (15 misterios) en familia.",
    pasos: [
      p("1. Elegí 5 o 15 misterios", "Tocá «Comenzar a rezar» para los misterios de hoy o «Rezar 15 misterios» para el Rosario completo.", "📿"),
      p("2. Contá las Avemarías", "Dentro del rezo tenés 10 botones numerados por decena para no perder la cuenta.", "🔟"),
      p("3. Modo contemplativo", "Tocá «Pantalla completa» en cualquier misterio para ver la imagen sagrada y las lecturas sin distracciones.", "🖼️"),
    ],
    botonesClave: [
      b("Comenzar a rezar / Rezar 15 misterios", "Abre la guía ordenada de rezo."),
      b("Botones 1 al 10 y Reiniciar decena", "Llevan la cuenta táctil de cada misterio."),
      b("Pantalla completa", "Abre el visor contemplativo con atajos ← → e I (lecturas)."),
    ],
  },

  cartas: {
    clave: "cartas",
    titulo: "Cartas Católicas",
    resumenCorto: "Coleccioná cartas de santos, ángeles y misterios reuniendo fragmentos de gracia.",
    paraQueSirve: "Muestra tu colección, las cartas en camino, eventos de fiesta para reclamar y el Álbum 3D.",
    pasos: [
      p("1. Reclamá eventos arriba", "Cuando hay bienvenida, cumpleaños o fiesta de un santo hoy, reclamá sus cartas o fragmentos arriba.", "✨"),
      p("2. Juntá fragmentos hasta el 100%", "Al llegar al 100% consagrás la carta (Grado I). ¡Seguí juntando hasta el 300% (Grado IV)!", "🃏"),
      p("3. Explorá el Álbum y el Álbum 3D", "En la pestaña «Álbum» podés ver todas las cartas o recorrerlas en el domo 3D.", "🌐"),
    ],
    botonesClave: [
      b("Mi colección / Álbum", "Alterna entre tus cartas obtenidas/en camino y el catálogo completo."),
      b("Normal / Álbum 3D", "Cambia la grilla clásica por el domo esférico interactivo."),
      b("Reclamar Grado", "Sube la carta de grado cuando alcanzaste los fragmentos necesarios."),
      b("Ir a la Tienda", "Te lleva a comprar sobres o fragmentos con tus monedas."),
    ],
    consejos: [
      c("¿Qué pasa con los fragmentos sobrantes después de Grado IV?", "Cada fragmento excedente se transforma automáticamente en Incienso para la Tienda."),
    ],
  },

  "cartas-detalle": {
    clave: "cartas-detalle",
    titulo: "Detalle de Carta",
    resumenCorto: "Incliná la carta holográfica, mirá sus grados y leé su oración e historia.",
    paraQueSirve: "Muestra la ficha completa de un santo, ángel o misterio y cuánto te falta para su próximo grado.",
    pasos: [
      p("1. Interactuá con la carta", "Mové el cursor o el dedo sobre la carta para ver el brillo holográfico, o pasá a «Versiones» para ver los 4 grados.", "✨"),
      p("2. Desbloqueá sus textos", "Al 25% se revela la Frase, al 50% sus Datos y al 100% su Historia completa.", "📖"),
    ],
    botonesClave: [
      b("Carta / Versiones", "Alterna entre la carta interactiva y el carrusel de grados I al IV."),
      b("Anterior / Siguiente", "Recorre las cartas sin volver al álbum."),
      b("Reclamar", "Disponible en fiestas litúrgicas o al completar un grado."),
    ],
  },

  "cartas-admin": {
    clave: "cartas-admin",
    titulo: "Administración de Cartas",
    resumenCorto: "Creá cartas nuevas, editá sus textos, subí artes por grado y simulá la revelación.",
    paraQueSirve: "Panel de padres para mantener y ampliar el catálogo de cartas católicas.",
    pasos: [
      p("1. Filtrá o creá una carta", "Usá los filtros superiores para buscar o tocá «+ Nueva Carta».", "➕"),
      p("2. Editá los 4 grados y datos", "Podés subir una imagen distinta para Grado I–IV y ordenar las filas de datos.", "🎨"),
      p("3. Probá el deslizador en vivo", "A la derecha simulás de 0% a 300% exactamente cómo verá la carta un hijo.", "🎚️"),
    ],
    botonesClave: [
      b("+ Nueva Carta", "Abre el formulario completo con vista previa en tiempo real."),
      b("Editar / Archivar / Eliminar", "Acciones disponibles en cada fila de la tabla."),
    ],
  },

  companero: {
    clave: "companero",
    titulo: "Mi Compañero",
    resumenCorto: "Elegí tu héroe acompañante, equipale escenarios y objetos y subí de nivel.",
    paraQueSirve: "Tu compañero te acompaña flotando por toda la app, reacciona a tus logros y desbloquea poses con tu XP.",
    pasos: [
      p("1. Elegí y nombrá a tu compañero", "Si todavía no tenés uno, elegilo y ponele el nombre que quieras.", "🛡️"),
      p("2. Comprá y equipá accesorios", "En la pestaña «Accesorios» usá tus monedas para poner escenarios y objetos.", "🎒"),
      p("3. Mirá su Álbum y gestos", "Mantenelo apretado en pantalla para moverlo de lugar, o arrastralo abajo del todo para guardarlo en el Dock.", "✨"),
    ],
    botonesClave: [
      b("Escena (tocar)", "Al tocar al compañero dice una frase nueva."),
      b("Mejoras / Accesorios / Álbum", "Muestra próximos desbloqueos, tienda de objetos y galería de poses."),
      b("Cambiar de compañero / Lápiz", "Permite cambiar el personaje o editar su nombre."),
    ],
  },

  tienda: {
    clave: "tienda",
    titulo: "Tienda Familiar",
    resumenCorto: "Canjeá tus Puntos, Estrellas e Incienso por sobres, fragmentos, vales y premios.",
    paraQueSirve: "Permite disfrutar recompensas, ahorrar hacia una meta o comprar algo grande entre hermanos.",
    pasos: [
      p("1. Revisá tus 3 monedas arriba", "Si te faltan monedas, tocá «+ Ganar monedas» para ver cómo conseguirlas.", "🪙"),
      p("2. Explorá por categoría", "Filtrá entre Todo, Cartas, Premios o Vales, o activá «Solo lo que puedo comprar».", "🛒"),
      p("3. Comprá, ahorrá o compartí", "Al tocar un producto podés comprarlo, fijarlo como «Mi meta» o iniciar una «Compra compartida».", "🤝"),
    ],
    botonesClave: [
      b("+ Ganar monedas", "Explica cómo conseguir Puntos, Estrellas e Incienso."),
      b("Solo lo que puedo comprar", "Muestra únicamente los productos que ya podés pagar hoy."),
      b("Fijar como mi meta / Compra compartida", "Dentro del producto, fija un objetivo de ahorro o reparte el costo con familiares."),
    ],
  },

  biblioteca: {
    clave: "biblioteca",
    titulo: "Biblioteca Familiar",
    resumenCorto: "Encontrá libros digitales (ePub/PDF) y retomá tu lectura donde la dejaste.",
    paraQueSirve: "Reúne los libros subidos para la familia organizados por estantes y progreso personal.",
    pasos: [
      p("1. Retomá en «Seguir leyendo»", "Arriba aparecen primero los libros que ya empezaste.", "📖"),
      p("2. Filtrá por tipo, estado o estante", "Usá el buscador y los botones de filtro para encontrar tu próxima lectura.", "🔎"),
      p("3. Tocá un libro para abrir su ficha", "Desde la ficha entrás al lector fullscreen con marcador automático.", "✨"),
    ],
    botonesClave: [
      b("Buscador y filtros", "Filtra por título, autor, estado de lectura o estante."),
      b("Gestionar", "Permite a los padres subir libros ePub/PDF y organizar estantes.", "padres"),
    ],
  },

  "biblioteca-gestionar": {
    clave: "biblioteca-gestionar",
    titulo: "Gestionar Biblioteca",
    resumenCorto: "Subí archivos ePub o PDF (hasta 4 MB), creá estantes y editá fichas de libros.",
    paraQueSirve: "Panel para que padres y madres mantengan ordenado el catálogo digital del hogar.",
    pasos: [
      p("1. Creá estantes", "Escribí el nombre de un estante nuevo y tocá «+ Crear» para ordenar por tema o edad.", "🗄️"),
      p("2. Subí libros en lote", "Tocá «+ Agregar libros» y elegí uno o varios ePub/PDF; los metadatos y portadas se extraen solos.", "📤"),
    ],
    botonesClave: [
      b("+ Agregar libros", "Sube archivos ePub o PDF (máximo 4 MB cada uno)."),
      b("Estantes (+ Crear / Renombrar / Borrar)", "Organiza las categorías de la biblioteca."),
      b("Editar / Borrar libro", "Modifica título, autor, sinopsis y estantes asignados."),
    ],
  },

  "biblioteca-libro": {
    clave: "biblioteca-libro",
    titulo: "Ficha del Libro",
    resumenCorto: "Leé la sinopsis, mirá tu avance y abrí el lector o marcá el libro como leído.",
    paraQueSirve: "Punto de entrada individual a cada libro de la biblioteca.",
    pasos: [
      p("1. Tocá «Leer» o «Seguir»", "Abre el libro exactamente en la página o posición donde quedaste.", "📖"),
      p("2. Actualizá tu estado", "Si ya lo terminaste en papel o PDF, podés usar «Marcar como leído».", "✅"),
    ],
    botonesClave: [
      b("Leer / Seguir", "Abre el visor ePub o PDF a pantalla completa."),
      b("Marcar como leído / Volver a leer", "Actualiza manualmente tu progreso."),
    ],
  },

  "biblioteca-leer": {
    clave: "biblioteca-leer",
    titulo: "Lector de Libros",
    resumenCorto: "Leé cómodo a pantalla completa: tu página se guarda automáticamente.",
    paraQueSirve: "Lector adaptado para ePub (con índice, tamaño de letra y temas) y visor directo de PDF.",
    pasos: [
      p("1. Pasá de página", "Tocá los bordes laterales, deslizá el dedo o usá las flechas ← y → del teclado.", "📄"),
      p("2. Mostrá u ocultá los menús", "Tocá el centro de la pantalla (o apretá Escape) para ver el índice, tema y tamaño de letra.", "🎨"),
    ],
    botonesClave: [
      b("Índice", "Salta directo a cualquier capítulo del libro ePub."),
      b("Ajustes de lectura", "Cambia tamaño de fuente y tema Claro, Sepia u Oscuro."),
      b("Volver", "Guarda tu posición y regresa a la ficha del libro."),
    ],
  },

  notas: {
    clave: "notas",
    titulo: "Bloc de Notas",
    resumenCorto: "Creá páginas y subpáginas personales, listas de tareas, tablas y enlaces.",
    paraQueSirve: "Tu cuaderno digital privado con almacenamiento local y sincronización en la nube.",
    pasos: [
      p("1. Creá una página nueva", "Tocá «Página nueva» o usá Ctrl/⌘+Alt+N para empezar a escribir.", "📝"),
      p("2. Usá atajos mágicos al escribir", "Escribí / para insertar títulos, listas, tablas o recuadros, y [[ para enlazar otra página.", "🪄"),
      p("3. Personalizá y buscá", "Arriba a la derecha cambiás formato (Aa), colores/estilo y ves estadísticas o modo presentación.", "🎨"),
    ],
    botonesClave: [
      b("Página nueva / Buscar (⌘K)", "Crea páginas o busca al instante en todas tus notas."),
      b("Aa / Estilo / Info", "Herramientas de formato, apariencia de la página y modo Presentar."),
      b("Papelera", "Recupera páginas borradas durante 30 días o vacialas."),
    ],
  },

  diario: {
    clave: "diario",
    titulo: "Mi Diario Personal",
    resumenCorto: "Escribí tus vivencias privadas con ánimo, fotos, notas de voz, lugar, clima y recuerdos.",
    paraQueSirve: "Diario íntimo privado (solo vos podés leerlo) con calendario, estadísticas y asistente.",
    pasos: [
      p("1. Tocá «Escribir» para tu entrada", "Elegí tu estado de ánimo, fecha y escribí libremente; se autoguarda cada pocos segundos.", "✍️"),
      p("2. Enriquecé tus recuerdos", "Sumá fotos, notas de voz, etiquetas, clima, lugar o enlazá otra entrada anterior.", "📷"),
      p("3. Explorá tu historia", "Usá el calendario, Línea de tiempo, Galería, Mapa de huellas, Estadísticas y «En este día».", "🗺️"),
    ],
    botonesClave: [
      b("Escribir", "Abre el editor completo para el día elegido."),
      b("Calendario y Año", "Filtra entradas por día, mes o etiqueta y muestra tu ánimo."),
      b("Línea de tiempo / Galería / Grafo / Mapa", "Vistas alternativas para recorrer recuerdos, fotos, enlaces y lugares."),
      b("Asistente / Exportar / Importar", "Conversá con el asistente del diario o hacé copias de seguridad."),
    ],
  },

  "diario-familia": {
    clave: "diario-familia",
    titulo: "Diario Familiar",
    resumenCorto: "Crónica compartida del hogar donde todos pueden escribir y ver recuerdos juntos.",
    paraQueSirve: "Guarda anécdotas, paseos y momentos lindos visibles para toda la familia.",
    pasos: [
      p("1. Mirá quién escribió cada recuerdo", "Cada entrada muestra la foto y nombre de quien la compartió.", "👨‍👩‍👧‍👦"),
      p("2. Sumá un momento familiar", "Tocá «Escribir» para contar algo lindo del día con fotos o lugar (recordá que lo ven todos).", "📸"),
    ],
    botonesClave: [
      b("Escribir", "Crea una entrada compartida visible para toda la familia."),
      b("Calendario, Galería, Mapa y Línea de tiempo", "Exploran los recuerdos familiares por fecha, foto o lugar."),
    ],
  },

  "diario-compartido": {
    clave: "diario-compartido",
    titulo: "Guardar Contenido Compartido",
    resumenCorto: "Elegí en qué diario y en qué día guardar lo que compartiste desde otra aplicación.",
    paraQueSirve: "Recibe textos o enlaces compartidos hacia Ordo Diei para sumarlos a tu diario.",
    pasos: [
      p("1. Elegí el destino", "Seleccioná «Mi diario» (privado) o «Diario familiar» (compartido).", "📘"),
      p("2. Elegí fecha y entrada", "Podés crear una entrada nueva o agregarlo a una que ya hayas escrito ese día.", "📅"),
    ],
    botonesClave: [
      b("Mi diario / Diario familiar", "Define la privacidad de lo que vas a guardar."),
      b("Crear entrada / Agregar", "Guarda el texto compartido."),
    ],
  },

  admin: {
    clave: "admin",
    titulo: "Panel de Administración",
    resumenCorto: "Centro de mando para padres: misiones del día, meta semanal, herramientas e historial.",
    paraQueSirve: "Reúne todos los accesos administrativos y permite auditar o revertir acciones recientes.",
    pasos: [
      p("1. Completá «Tu parte de hoy»", "Tus mini-misiones diarias como padre/madre suman puntos y desbloquean tu cofre.", "🌟"),
      p("2. Fijá la Meta de la semana", "Definí cuántos logros grupales entre todos ganan el vale familiar.", "🎯"),
      p("3. Accedé a cualquier herramienta", "Elegí entre Tareas, Aprobaciones, Conducta, Premios, Tienda, Biblioteca o Rutina.", "🛠️"),
    ],
    botonesClave: [
      b("Fijar la meta / Cambiar", "Define la meta semanal familiar y su vale de recompensa."),
      b("Tarjetas de administración", "Abren cada sección de gestión con contadores de pendientes."),
      b("Historial de Acciones (Revertir)", "Permite deshacer aprobaciones, entregas o compras recientes."),
    ],
  },

  "admin-aprobaciones": {
    clave: "admin-aprobaciones",
    titulo: "Bandeja de Aprobaciones",
    resumenCorto: "Aprobá o rechazá en un toque tareas terminadas y hábitos solicitados por tus hijos.",
    paraQueSirve: "Concentra todo lo que espera confirmación parental en un solo lugar rápido.",
    pasos: [
      p("1. Revisá hábitos y tareas", "Arriba aparecen hábitos nuevos o lecturas por aprobar, y abajo tareas esperando revisión.", "✅"),
      p("2. Tocá o deslizá para decidir", "Usá «Aprobar» / «Rechazar» (o deslizá la fila en celular) y ampliá las fotos de prueba antes de confirmar.", "👆"),
    ],
    botonesClave: [
      b("Aprobar / Rechazar", "Valida o devuelve la tarea/hábito."),
      b("Aprobar todo", "Aprueba todas las solicitudes de hábitos de un integrante o de todos."),
      b("Ver foto de prueba", "Abre en grande la fotografía enviada por el hijo."),
    ],
  },

  "admin-comportamiento": {
    clave: "admin-comportamiento",
    titulo: "Regalar Premio y Penitencias",
    resumenCorto: "Premiá gestos nobles fuera de las tareas o aplicá correcciones con trazabilidad.",
    paraQueSirve: "Permite entregar puntos, incienso, XP, cartas, reconocimientos o vales por mérito espontáneo, y restaurar vales.",
    pasos: [
      p("1. Tocá «+ Registrar comportamiento»", "Elegí uno o varios hijos y marcá «Premiar» o «Penitencia».", "🎁"),
      p("2. Armá el paquete de premios", "Elegí el tipo de premio, tocá «+ Agregar» para sumarlo a la lista y luego «Registrar».", "✨"),
      p("3. Auditá los vales abajo", "Podés ver qué vales están disponibles o usados y restaurarlos si hace falta.", "🎟️"),
    ],
    botonesClave: [
      b("+ Registrar comportamiento", "Abre el formulario de premios sorpresa o penitencias."),
      b("+ Agregar (dentro del modal)", "Suma cada premio al paquete antes de guardar."),
      b("Restaurar (Vales)", "Reactiva un vale marcado como usado."),
    ],
  },

  "admin-conducta": {
    clave: "admin-conducta",
    titulo: "Registrar Conducta Diaria",
    resumenCorto: "Calificá cómo se portó cada hijo hoy: esto habilita el cofre de las 18:00 o sanciones.",
    paraQueSirve: "Lleva el registro diario de conducta y muestra la racha de los últimos 14 días.",
    pasos: [
      p("1. Elegí hijo y fecha", "Si ya había registro ese día, se carga para que puedas corregirlo.", "👦"),
      p("2. Marcá el nivel y una nota opcional", "Niveles altos desbloquean el cofre de las 18:00; los más bajos activan sanción diaria.", "💛"),
      p("3. Tocá «Guardar conducta»", "Se actualiza al instante la tira de 14 días de la derecha.", "💾"),
    ],
    botonesClave: [
      b("Selector Hijo / Día", "Carga o crea la evaluación de esa fecha."),
      b("SelectorNivel", "Elige la calificación de «Muy mal» a «Excelente»."),
      b("Guardar conducta", "Guarda la nota y recalcula cofre/sanción del día."),
    ],
  },

  "admin-hijos": {
    clave: "admin-hijos",
    titulo: "Resumen de los Hijos",
    resumenCorto: "Mirá en una pestaña por hijo su conducta, rendimiento, hábitos y tareas pendientes.",
    paraQueSirve: "Visión integral para acompañar a cada hijo sin navegar por cinco pantallas distintas.",
    pasos: [
      p("1. Elegí la pestaña del hijo", "Un punto rojo en el nombre avisa si tiene tareas vencidas.", "👤"),
      p("2. Revisá sus 3 bloques", "Conducta reciente, Rendimiento semanal/constancia y Tareas abiertas.", "📊"),
    ],
    botonesClave: [
      b("Registrar conducta / Tareas / Aprobaciones / Ver perfil", "Atajos directos desde la ficha del hijo."),
    ],
  },

  "admin-premio-grupal": {
    clave: "admin-premio-grupal",
    titulo: "Administrar Premio Grupal",
    resumenCorto: "Creá desafíos con fecha de inicio y fin para que toda la familia gane un vale.",
    paraQueSirve: "Permite lanzar objetivos comunes (ej. vacaciones o mes especial) medidos por % de cumplimiento.",
    pasos: [
      p("1. Completá el vale y la meta %", "Definí qué ganan todos, el porcentaje mínimo (ej. 80%) y las fechas.", "🎯"),
      p("2. Seguí el avance abajo", "Ves el progreso en vivo o podés archivar un premio grupal anterior.", "📈"),
    ],
    botonesClave: [
      b("Crear premio", "Activa el nuevo desafío grupal."),
      b("Archivar", "Cierra una campaña pasada o cancelada."),
    ],
  },

  "admin-reposo": {
    clave: "admin-reposo",
    titulo: "Configurar Pantalla de Reposo",
    resumenCorto: "Ajustá el tiempo antes de pasar a reposo, el tema de fotos y las citas del Catecismo.",
    paraQueSirve: "Controla el salvapantallas contemplativo que se ve en el inicio antes de iniciar sesión.",
    pasos: [
      p("1. Definí los tiempos", "Configurá cuántos segundos tarda en activarse el reposo en el login o con sesión abierta.", "⏱️"),
      p("2. Elegí fotos y refrescá", "Podés buscar otro tema en Unsplash, tocar «Cargar fotos ahora» u ocultar fotos puntuales.", "🖼️"),
    ],
    botonesClave: [
      b("Guardar", "Aplica tiempos, tema de búsqueda y visualización de referencias."),
      b("Cargar fotos ahora", "Descarga nuevas fotos al pool inmediatamente."),
      b("Ocultar / Mostrar", "Modera fotos individuales del fondo."),
    ],
  },

  "admin-rutina": {
    clave: "admin-rutina",
    titulo: "Configurar Rutina Familiar",
    resumenCorto: "Definí las etapas horarias base del día y las notas semanales de toda la familia.",
    paraQueSirve: "Edita los horarios maestros que luego ven y usan todos en «Horarios».",
    pasos: [
      p("1. Editá o creá etapas", "Tocá «+ Nueva etapa» o el lápiz en cualquier bloque para fijar horario, ícono y alarma.", "⏰"),
      p("2. Guardá el enfoque semanal", "Abajo completás el mensaje de la semana, sábado y domingo y tocás «Guardar semana».", "📝"),
    ],
    botonesClave: [
      b("+ Nueva etapa / Restablecer", "Agrega un bloque horario o vuelve al horario predeterminado."),
      b("Guardar semana", "Actualiza los textos de la pestaña Semanal."),
    ],
  },

  "admin-tareas": {
    clave: "admin-tareas",
    titulo: "Administrar Tareas",
    resumenCorto: "Buscá, filtrá, editá en masa y organizá todas las tareas de la familia.",
    paraQueSirve: "Panel maestro de tareas en vista Lista o Calendario con acciones por lote.",
    pasos: [
      p("1. Buscá y filtrá", "Filtrá por persona o texto, y tocá «Más filtros» para dificultad, tipo, recurrencia o checklist.", "🔍"),
      p("2. Editá varias a la vez", "Marcá las casillas de varias tareas para cambiar asignación, fecha, dificultad o recompensas juntas.", "☑️"),
      p("3. Creá o editá en un clic", "Tocá cualquier fila o evento del calendario para editarla, o «+ Nueva tarea» para crear una.", "➕"),
    ],
    botonesClave: [
      b("+ Nueva tarea", "Abre el asistente completo para crear una tarea."),
      b("Lista / Calendario", "Alterna entre tabla editable y proyección en calendario."),
      b("Más filtros", "Despliega filtros avanzados sin recargar la pantalla."),
      b("Barra de acciones en masa", "Modifica Asignación, Fecha, Hora, Dificultad, Recompensa o Elimina en bloque."),
    ],
  },

  "admin-tienda": {
    clave: "admin-tienda",
    titulo: "Administrar Tienda",
    resumenCorto: "Creá premios y vales para canjear con monedas y aprobá o entregá compras.",
    paraQueSirve: "Controla el catálogo de la tienda familiar y el flujo de pedidos de los hijos.",
    pasos: [
      p("1. Creá productos o vales", "Tocá «+ Nuevo producto», elegí precio en una o varias monedas y fijá requisitos si querés.", "🏷️"),
      p("2. Revisá la pestaña «Compras»", "Aprobá pedidos pendientes, marcá como entregados los premios físicos o cancelá devolviendo monedas.", "📦"),
    ],
    botonesClave: [
      b("+ Nuevo producto", "Abre el editor lateral con vista previa en vivo."),
      b("Productos / Compras", "Alterna entre el catálogo y la bandeja de pedidos."),
      b("Aprobar / Rechazar / Entregado", "Gestiona cada compra realizada por la familia."),
    ],
  },

  "tasks-new": {
    clave: "tasks-new",
    titulo: "Crear Nueva Tarea",
    resumenCorto: "Asistente paso a paso para crear tareas únicas, recurrentes, grupales o rotativas.",
    paraQueSirve: "Guía la creación completa de una tarea con dificultad, puntos, checklist y foto de prueba.",
    pasos: [
      p("1. Qué y Quién", "Definí título, descripción y si es para una persona, global o con turnos rotativos.", "👥"),
      p("2. Cuándo y Esfuerzo", "Elegí recurrencia, fecha/hora límite, tiempo estimado y dificultad.", "⏱️"),
      p("3. Extras opcionales", "Activá checklist por pasos, foto de prueba obligatoria o elegibilidad de sorpresa.", "📸"),
    ],
    botonesClave: [
      b("Atrás / Siguiente", "Avanza por los 5 pasos del asistente."),
      b("Tarea Global / Rotar responsable", "Asigna a toda la familia o turna automáticamente."),
      b("Registrar Tarea", "Guarda y asigna la tarea en el último paso."),
    ],
  },

  "users-new": {
    clave: "users-new",
    titulo: "Nuevo Miembro de la Familia",
    resumenCorto: "Sumá a un padre, madre, hijo o hija con su foto y PIN de ingreso.",
    paraQueSirve: "Da de alta un nuevo perfil familiar en Ordo Diei.",
    pasos: [
      p("1. Completá nombre, rol y fecha", "Elegí si es Padre/Madre (administrador) o Hijo/Hija.", "👪"),
      p("2. Definí el PIN y foto", "Cargá un PIN numérico de 4 dígitos y opcionalmente una foto de perfil.", "🔐"),
    ],
    botonesClave: [
      b("Registrar Miembro", "Crea la cuenta familiar para que ya aparezca en la pantalla de ingreso."),
    ],
  },

  "users-pines": {
    clave: "users-pines",
    titulo: "Restablecer PIN",
    resumenCorto: "Cambiá el código secreto de cualquier integrante si lo olvidó.",
    paraQueSirve: "Permite a padres y madres asignar un nuevo PIN de ingreso en segundos.",
    pasos: [
      p("1. Elegí al miembro", "Seleccioná a la persona en la lista desplegable.", "👤"),
      p("2. Escribí el nuevo PIN y guardá", "Ingresá el nuevo código numérico y tocá «Restablecer PIN».", "🔑"),
    ],
    botonesClave: [
      b("Restablecer PIN", "Actualiza inmediatamente el PIN de acceso del usuario elegido."),
    ],
  },
};

interface ReglaRutaGuia {
  prefijo: string;
  exacta?: boolean;
  clave: string;
}

const REGLAS_RUTA: ReglaRutaGuia[] = [
  { prefijo: "/", exacta: true, clave: "acceso" },
  { prefijo: "/agenda", clave: "agenda-publica" },
  { prefijo: "/agenda-del-dia", clave: "agenda-publica" },
  { prefijo: "/dashboard/imprimir/agenda-semanal", clave: "agenda-semanal-imprimir" },
  { prefijo: "/dashboard/horarios", clave: "horarios" },
  { prefijo: "/dashboard/rutina", clave: "horarios" },
  { prefijo: "/dashboard/habitos", clave: "habitos" },
  { prefijo: "/dashboard/oracion", clave: "habitos" },
  { prefijo: "/dashboard/mis-premios", clave: "mis-premios" },
  { prefijo: "/dashboard/premio-grupal", clave: "premio-grupal" },
  { prefijo: "/dashboard/premios", clave: "premios" },
  { prefijo: "/dashboard/logros", clave: "logros" },
  { prefijo: "/dashboard/perfil", clave: "perfil" },
  { prefijo: "/dashboard/rules", clave: "rules" },
  // Estudio
  { prefijo: "/dashboard/homeschooling/plan", clave: "estudio-plan" },
  { prefijo: "/dashboard/homeschooling/semana", clave: "estudio-semana" },
  { prefijo: "/dashboard/homeschooling/materias/", clave: "estudio-materia-detalle" },
  { prefijo: "/dashboard/homeschooling/materias", clave: "estudio-materias" },
  { prefijo: "/dashboard/homeschooling/lectura", clave: "estudio-lectura" },
  { prefijo: "/dashboard/homeschooling/memoria/recitar", clave: "estudio-recitar" },
  { prefijo: "/dashboard/homeschooling/memoria/copia", clave: "estudio-imprimir" },
  { prefijo: "/dashboard/homeschooling/memoria", clave: "estudio-memoria" },
  { prefijo: "/dashboard/homeschooling/horas", clave: "estudio-horas" },
  { prefijo: "/dashboard/homeschooling/portafolio/imprimir", clave: "estudio-imprimir" },
  { prefijo: "/dashboard/homeschooling/portafolio", clave: "estudio-portafolio" },
  { prefijo: "/dashboard/homeschooling/revision", clave: "estudio-revision" },
  { prefijo: "/dashboard/homeschooling/reportes", clave: "estudio-reportes" },
  { prefijo: "/dashboard/homeschooling/libreta", clave: "estudio-libreta" },
  { prefijo: "/dashboard/homeschooling/boletin", clave: "estudio-boletin" },
  { prefijo: "/dashboard/homeschooling/dias-sin-clase", clave: "estudio-dias-sin-clase" },
  { prefijo: "/dashboard/homeschooling/muro", clave: "estudio-muro" },
  { prefijo: "/dashboard/homeschooling/mensajes", clave: "estudio-mensajes" },
  { prefijo: "/dashboard/homeschooling/neurodivergencia", clave: "estudio-neuro" },
  { prefijo: "/dashboard/homeschooling/imprimir", clave: "estudio-imprimir" },
  // Liturgia
  { prefijo: "/dashboard/liturgia/calendarium", clave: "liturgia-calendarium" },
  { prefijo: "/dashboard/liturgia/breviarium", clave: "liturgia-breviarium" },
  { prefijo: "/dashboard/liturgia/missale", clave: "liturgia-missale" },
  { prefijo: "/dashboard/liturgia/ordinarium", clave: "liturgia-ordinarium" },
  { prefijo: "/dashboard/liturgia/psalterium", clave: "liturgia-psalterium" },
  { prefijo: "/dashboard/liturgia/proprium-de-tempore", clave: "liturgia-proprium" },
  { prefijo: "/dashboard/liturgia/proprium-sanctorum", clave: "liturgia-proprium" },
  { prefijo: "/dashboard/liturgia/rosarium", clave: "liturgia-rosarium" },
  { prefijo: "/dashboard/liturgia", clave: "liturgia" },
  // Colección y Lectura/Escritura
  { prefijo: "/dashboard/cartas/admin", clave: "cartas-admin" },
  { prefijo: "/dashboard/cartas/", clave: "cartas-detalle" },
  { prefijo: "/dashboard/cartas", clave: "cartas" },
  { prefijo: "/dashboard/companero", clave: "companero" },
  { prefijo: "/dashboard/tienda", clave: "tienda" },
  { prefijo: "/dashboard/biblioteca/gestionar", clave: "biblioteca-gestionar" },
  { prefijo: "/dashboard/biblioteca/libro", clave: "biblioteca-libro" },
  { prefijo: "/dashboard/biblioteca/leer", clave: "biblioteca-leer" },
  { prefijo: "/dashboard/biblioteca", clave: "biblioteca" },
  { prefijo: "/dashboard/notas", clave: "notas" },
  { prefijo: "/dashboard/diario/compartido", clave: "diario-compartido" },
  { prefijo: "/dashboard/diario/familia", clave: "diario-familia" },
  { prefijo: "/dashboard/diario", clave: "diario" },
  // Administración
  { prefijo: "/dashboard/admin/aprobaciones", clave: "admin-aprobaciones" },
  { prefijo: "/dashboard/admin/agenda", clave: "admin-aprobaciones" },
  { prefijo: "/dashboard/admin/comportamiento", clave: "admin-comportamiento" },
  { prefijo: "/dashboard/admin/conducta", clave: "admin-conducta" },
  { prefijo: "/dashboard/admin/hijos", clave: "admin-hijos" },
  { prefijo: "/dashboard/admin/premio-grupal", clave: "admin-premio-grupal" },
  { prefijo: "/dashboard/admin/reposo", clave: "admin-reposo" },
  { prefijo: "/dashboard/admin/rutina", clave: "admin-rutina" },
  { prefijo: "/dashboard/admin/tareas", clave: "admin-tareas" },
  { prefijo: "/dashboard/admin/tienda", clave: "admin-tienda" },
  { prefijo: "/dashboard/admin", clave: "admin" },
  { prefijo: "/dashboard/tasks/new", clave: "tasks-new" },
  { prefijo: "/dashboard/users/new", clave: "users-new" },
  { prefijo: "/dashboard/users/pines", clave: "users-pines" },
];

const esRolPadre = (rol?: string | null) => rol === "Padre" || rol === "Madre";

function coincidePrefijo(pathname: string, regla: ReglaRutaGuia): boolean {
  if (regla.exacta) return pathname === regla.prefijo;
  if (regla.prefijo.endsWith("/")) return pathname.startsWith(regla.prefijo);
  return pathname === regla.prefijo || pathname.startsWith(`${regla.prefijo}/`);
}

export function filtrarGuiaPorRol(guia: GuiaPantalla, rolFamiliar?: string | null): GuiaFiltrada {
  const rol: RolGuia = esRolPadre(rolFamiliar) ? "padres" : "hijos";
  const admite = (r?: RolGuia) => !r || r === "todos" || r === rol;
  return {
    ...guia,
    pasos: guia.pasos.filter((x) => admite(x.rol)),
    botonesClave: guia.botonesClave.filter((x) => admite(x.rol)),
    consejos: guia.consejos?.filter((x) => admite(x.rol)),
  };
}

/** Devuelve la guía específica de la pantalla actual (filtrada por rol si se indica). */
export function obtenerGuiaDeRuta(
  pathname: string | null,
  searchParams?: { get(k: string): string | null } | null,
  rolFamiliar?: string | null,
): GuiaFiltrada {
  const ruta = pathname || "/";

  if (ruta === "/dashboard") {
    const seccion = searchParams?.get("s") ?? searchParams?.get("view");
    if (seccion === "history") return filtrarGuiaPorRol(GUIAS_POR_CLAVE["dashboard-historial"], rolFamiliar);
    if (seccion === "family") return filtrarGuiaPorRol(GUIAS_POR_CLAVE["dashboard-familia"], rolFamiliar);
    return filtrarGuiaPorRol(GUIAS_POR_CLAVE["dashboard-tareas"], rolFamiliar);
  }

  if (ruta === "/dashboard/homeschooling") {
    const clave = esRolPadre(rolFamiliar) ? "estudio-padres" : "estudio-hoy";
    return filtrarGuiaPorRol(GUIAS_POR_CLAVE[clave], rolFamiliar);
  }

  let mejor: ReglaRutaGuia | null = null;
  for (const regla of REGLAS_RUTA) {
    if (coincidePrefijo(ruta, regla) && (!mejor || regla.prefijo.length > mejor.prefijo.length)) {
      mejor = regla;
    }
  }

  const base = mejor ? GUIAS_POR_CLAVE[mejor.clave] : GUIAS_POR_CLAVE["dashboard-tareas"];
  return filtrarGuiaPorRol(base, rolFamiliar);
}

/** Indica si una ruta es de impresión (donde no debe abrirse el tutorial automático para no tapar window.print). */
export function esRutaDeImpresion(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.includes("/imprimir/") || pathname.includes("/memoria/copia/");
}
