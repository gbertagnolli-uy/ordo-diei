import { api, cookieDe, guardar, hoyMontevideo, prisma, SUFIJO } from "./lib.ts";

const resultados: { ok: boolean; texto: string }[] = [];
const chequeo = (ok: boolean, texto: string) => { resultados.push({ ok, texto }); console.log((ok ? "OK    " : "FALLA ") + texto); };

const hoy = hoyMontevideo();
const mk = (nombre: string, rolFamiliar: "Padre" | "Hijo") =>
  prisma.usuario.create({ data: { nombre: `${nombre} ${SUFIJO}`, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });
const padre = await mk("padre", "Padre");
const hijo = await mk("hijo", "Hijo");
const hermano = await mk("hermano", "Hijo");
const estado: Record<string, unknown> = { hoy, padreId: padre.id, hijoId: hijo.id, hermanoId: hermano.id };
guardar(estado);
const cp = await cookieDe(padre), ch = await cookieDe(hijo), ce = await cookieDe(hermano);
estado.cookies = { padre: cp, hijo: ch, hermano: ce };

// ---- El padre arma la materia, el curso, las lecciones, el quiz y el plan
let r = await api(cp, "/api/homeschooling/materias", { body: { nombre: `Historia ${SUFIJO}`, descripcion: "Prueba", icono: "Landmark", color: "success", dificultad: "Media" } });
chequeo(r.status === 200, `crear materia (${r.status})`); const materiaId = r.json.id;
r = await api(cp, "/api/homeschooling/cursos", { body: { materiaId, titulo: `Uruguay ${SUFIJO}`, tipo: "curso_videos", unidadTipo: "leccion", minutosPorUnidad: 20 } });
chequeo(r.status === 200, `crear curso (${r.status})`); const recursoId = r.json.id;
const lecciones: number[] = [];
for (const [t, url] of [["Los charrúas", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"], ["La colonia", null], ["La independencia", "https://vimeo.com/76979871"]] as const) {
  r = await api(cp, "/api/homeschooling/lecciones", { body: { recursoId, titulo: t, instrucciones: `Mirá y resumí ${t}`, url } });
  chequeo(r.status === 200, `crear lección «${t}» (${r.status})`); lecciones.push(r.json.id);
}
r = await api(cp, `/api/homeschooling/lecciones/${lecciones[0]}/preguntas`, { method: "PUT", body: { preguntas: [
  { enunciado: "¿Quiénes eran los charrúas?", opciones: ["Un pueblo originario", "Una ciudad"], correcta: 0, explicacion: "Eran pueblos originarios", segundoVideo: 5 },
  { enunciado: "¿Capital de Uruguay?", opciones: ["Salto", "Montevideo", "Paysandú"], correcta: 1, explicacion: "Montevideo" },
  { enunciado: "¿Idioma oficial?", opciones: ["Español", "Portugués"], correcta: 0 },
] } });
chequeo(r.status === 200, `guardar preguntas (${r.status})`);
r = await api(cp, "/api/homeschooling/planes", { body: { recursoId, alumnoId: hijo.id, inicio: hoy, fin: hoy, diasSemana: [1, 2, 3, 4, 5, 6, 7] } });
chequeo(r.status === 200 && r.json.dias === 1, `crear plan de un día con las 3 lecciones (${r.status}, días ${r.json?.dias})`);
r = await api(cp, "/api/homeschooling/planes", { body: { recursoId, alumnoId: hijo.id, inicio: hoy, fin: hoy, diasSemana: [1] } });
chequeo(r.status === 409, `plan repetido → 409 (${r.status})`);

// ---- Permisos: el hermano no ve ni completa lo del hijo
r = await api(ce, `/api/homeschooling/materias/${materiaId}/cursos`);
chequeo(r.status === 403, `un hermano sin plan no ve la materia → 403 (${r.status})`);
r = await api(ch, "/api/homeschooling/materias", { body: { nombre: "x" } });
chequeo(r.status === 403, `un hijo no crea materias → 403 (${r.status})`);

// ---- El hijo: «Hoy aprendo»
r = await api(ch, "/api/homeschooling/hoy");
chequeo(r.status === 200 && r.json.length === 1, `GET hoy: un día (${r.status}, ${r.json?.length})`);
const dia = r.json?.[0]; const tareaId = dia?.tareaId;
chequeo(!!tareaId, `el día tiene su Tarea (${tareaId})`);
chequeo(dia?.lecciones?.length === 3 && dia.lecciones[1].bloqueada && dia.lecciones[2].bloqueada && !dia.lecciones[0].bloqueada, "solo la primera lección está libre; la 2 y la 3 bloqueadas");
const t = await prisma.tarea.findUniqueOrThrow({ where: { id: tareaId } });
const limite = new Date(t.horaEjecucion!.getTime() + t.tiempoEjecucionEstimadoSeg * 1000);
chequeo(limite.toISOString().slice(11, 16) === "21:00", `horaEjecucion + estimado = 18:00 de Montevideo (${limite.toISOString()})`);
chequeo(t.generaPuntosYRecompensa && t.asignadoId === hijo.id && t.estado === "Pendiente", "Tarea: puntos y recompensa, del hijo, Pendiente");

// ---- La guardia y los permisos de la Tarea
r = await api(ch, `/api/tasks/${tareaId}/complete`, { body: { elapsedSeconds: 60 } });
chequeo(r.status === 400, `completar la Tarea sin hacer las lecciones → 400 (${r.status}: ${r.json?.error})`);
r = await api(ce, `/api/tasks/${tareaId}/complete`, { body: { elapsedSeconds: 60 } });
chequeo(r.status === 403, `un hermano no completa la Tarea del otro → 403 (${r.status})`);
r = await api(ce, `/api/homeschooling/lecciones/${lecciones[0]}/completar`, { method: "POST" });
chequeo(r.status === 403, `un hermano no completa la lección → 403 (${r.status})`);
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[1]}/completar`, { method: "POST" });
chequeo(r.status === 409, `lección 2 sin la 1 → 409 (${r.status}: ${r.json?.error})`);
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[0]}/completar`, { method: "POST" });
chequeo(r.status === 409, `lección 1 con quiz sin aprobar → 409 (${r.status}: ${r.json?.error})`);

// ---- Preguntas: la respuesta correcta nunca viaja
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[0]}/preguntas?tipo=final`);
const textoPreguntas = JSON.stringify(r.json);
chequeo(r.status === 200 && !/"correcta"|"explicacion"/.test(textoPreguntas) && r.json.length === 2, "preguntas del quiz sin correcta ni explicación");
const finales = r.json as { id: number }[];
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[0]}/preguntas?tipo=checkpoint`);
chequeo(r.status === 200 && r.json.length === 1 && r.json[0].segundoVideo === 5 && !/"correcta"/.test(JSON.stringify(r.json)), "checkpoint a los 5 s, sin correcta");
const cpId = r.json[0].id;
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[0]}/checkpoint`, { body: { preguntaId: cpId, elegida: 1 } });
chequeo(r.status === 200 && r.json.correcta === false, `checkpoint mal respondido → correcta:false (${JSON.stringify(r.json)})`);
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[0]}/preguntas?completas=1`);
chequeo(r.status === 403, `un hijo no pide las preguntas completas → 403 (${r.status})`);

// ---- Quiz: reprobar y aprobar
const malas = Object.fromEntries(finales.map((p) => [p.id, 1]));
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[0]}/calificar`, { body: { respuestas: malas } });
chequeo(r.status === 200 && r.json.aprobado === false && !/"correcta"\s*:/.test(JSON.stringify(r.json)), `quiz reprobado (nota ${r.json?.nota}) sin revelar el índice correcto`);
const preg = await prisma.preguntaLeccion.findMany({ where: { leccionId: lecciones[0], segundoVideo: null }, orderBy: { orden: "asc" } });
const buenas = Object.fromEntries(preg.map((p) => [p.id, p.correcta]));
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[0]}/calificar`, { body: { respuestas: buenas } });
chequeo(r.status === 200 && r.json.aprobado === true && r.json.nota === 100 && r.json.ultimaDelDia === false, `quiz aprobado (${r.json?.nota} %), no es la última lección`);
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[1]}/completar`, { method: "POST" });
chequeo(r.status === 200 && r.json.ultimaDelDia === false, `lección 2 completada (${r.status})`);
r = await api(ch, `/api/tasks/${tareaId}/complete`, { body: { elapsedSeconds: 60 } });
chequeo(r.status === 400, `con 2 de 3 lecciones la Tarea sigue bloqueada → 400 (${r.status})`);
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[2]}/completar`, { method: "POST" });
chequeo(r.status === 200 && r.json.ultimaDelDia === true && r.json.tareaId === tareaId, `lección 3: última del día (${r.status})`);
r = await api(ch, `/api/homeschooling/lecciones/${lecciones[2]}/completar`, { method: "POST" });
chequeo(r.status === 200, `completar dos veces la misma lección es idempotente (${r.status})`);

// ---- Premios: completar, aprobar, y no cobrar dos veces
const antes = await prisma.usuario.findUniqueOrThrow({ where: { id: hijo.id } });
r = await api(ch, `/api/tasks/${tareaId}/complete`, { body: { elapsedSeconds: 1200 } });
chequeo(r.status === 200, `completar la Tarea del día (${r.status}) puntos=${r.json?.puntos} base=${r.json?.basePoints}`);
const hora = new Intl.DateTimeFormat("es", { timeZone: "America/Montevideo", hour: "2-digit", minute: "2-digit" }).format(new Date());
const tc = await prisma.tarea.findUniqueOrThrow({ where: { id: tareaId } });
console.log(`   (ahora son las ${hora} en Montevideo; estado de la Tarea: ${tc.estado}; puntosGenerados: ${tc.puntosGenerados}; puntosGanadosPerdidos: ${tc.puntosGanadosPerdidos})`);
chequeo(tc.estado === "Esperando_Aprobacion", "la Tarea queda esperando la aprobación del padre");
r = await api(ch, `/api/tasks/${tareaId}/complete`, { body: { elapsedSeconds: 1200 } });
chequeo(r.status === 400, `completar de nuevo → 400, no se cobra dos veces (${r.status})`);
r = await api(ce, `/api/tasks/${tareaId}/approve`, { method: "POST", body: {} });
chequeo(r.status === 403 || r.status === 401, `un hijo no aprueba → ${r.status}`);
r = await api(cp, `/api/tasks/${tareaId}/approve`, { method: "POST", body: {} });
chequeo(r.status === 200, `el padre aprueba la Tarea (${r.status})`);
const despues = await prisma.usuario.findUniqueOrThrow({ where: { id: hijo.id } });
chequeo(despues.availablePoints + despues.lockedPoints > antes.availablePoints + antes.lockedPoints || despues.puntosAcumulados > antes.puntosAcumulados, `el hijo recibió puntos (${antes.availablePoints}→${despues.availablePoints}; acumulados ${antes.puntosAcumulados}→${despues.puntosAcumulados}; estrellas ${antes.stars}→${despues.stars})`);
r = await api(cp, `/api/tasks/${tareaId}/approve`, { method: "POST", body: {} });
chequeo(r.status !== 200, `aprobar dos veces no cobra de nuevo (${r.status})`);
const despues2 = await prisma.usuario.findUniqueOrThrow({ where: { id: hijo.id } });
chequeo(despues2.availablePoints === despues.availablePoints && despues2.puntosAcumulados === despues.puntosAcumulados, "los puntos no cambiaron en la segunda aprobación");
r = await api(ch, "/api/homeschooling/hoy");
chequeo(r.json?.[0]?.estado === "hecha", `el día figura «hecha» (${r.json?.[0]?.estado})`);

// ---- Evidencia: sube, el padre aprueba y los saldos no cambian
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const form = new FormData(); form.append("file", new Blob([png], { type: "image/png" }), "trabajo.png");
r = await api(ch, "/api/upload", { form });
chequeo(r.status === 200 && /^\/api\/archivos\//.test(r.json?.url), `subir foto (${r.status}) ${r.json?.url}`);
const url = r.json.url;
r = await api(ch, "/api/homeschooling/evidencias", { body: { titulo: "Mi maqueta", nota: "La hice con cartón", diaLectivoId: dia.diaId, imagenes: [url] } });
chequeo(r.status === 200 && r.json.status === "pendiente", `crear evidencia (${r.status})`); const evId = r.json?.id;
r = await api(ce, `/api/homeschooling/evidencias/${evId}`);
chequeo(r.status === 403, `un hermano no ve la evidencia → 403 (${r.status})`);
r = await api(ch, `/api/homeschooling/evidencias/${evId}`, { method: "PATCH", body: { accion: "aprobar", estrellas: 5 } });
chequeo(r.status === 403, `un hijo no aprueba su evidencia → 403 (${r.status})`);
const s0 = await prisma.usuario.findUniqueOrThrow({ where: { id: hijo.id } });
r = await api(cp, `/api/homeschooling/evidencias/${evId}`, { method: "PATCH", body: { accion: "aprobar", estrellas: 4 } });
chequeo(r.status === 200 && r.json.status === "aprobada" && r.json.stars === 4, `el padre aprueba con 4 estrellas (${r.status})`);
r = await api(cp, `/api/homeschooling/evidencias/${evId}`, { method: "PATCH", body: { accion: "destacar" } });
chequeo(r.status === 200 && r.json.is_featured, "destacar");
const s1 = await prisma.usuario.findUniqueOrThrow({ where: { id: hijo.id } });
chequeo(s0.availablePoints === s1.availablePoints && s0.lockedPoints === s1.lockedPoints && s0.stars === s1.stars && s0.experienciaHabitos === s1.experienciaHabitos, "aprobar y destacar no cambian ningún saldo");

// ---- Horas y reporte
r = await api(cp, "/api/homeschooling/actividades", { body: { materiaId, titulo: "Visita al museo", inicio: new Date(Date.now() - 36e5).toISOString(), fin: new Date().toISOString(), alumnoIds: [hijo.id, hermano.id] } });
chequeo(r.status === 200 && r.json.duracion_min === 60, `crear actividad de 60 min con 2 hijos (${r.status})`);
const d = new Date(hoy + "T12:00:00");
const desde = `${hoy.slice(0, 8)}01`, hasta = `${hoy.slice(0, 8)}28`;
r = await api(ch, `/api/homeschooling/reportes/resumen?alumnoId=${hijo.id}&desde=${desde}&hasta=${hasta}`);
const mat = r.json?.materias?.find((m: { materiaId: number }) => m.materiaId === materiaId);
chequeo(r.status === 200 && mat?.minutosActividades === 60 && mat?.minutosLecciones > 0 && mat?.leccionesHechas === 3, `resumen: actividades ${mat?.minutosActividades} min, lecciones ${mat?.minutosLecciones} min, ${mat?.leccionesHechas} lecciones hechas`);
void d;

// ---- Neurodivergencia
r = await api(ch, "/api/homeschooling/preferencias", { method: "PUT", body: { modoRelajado: true } });
chequeo(r.status === 200 && r.json.modoRelajado === true, `el hijo activa su modo relajado (${r.status})`);
r = await api(ch, "/api/homeschooling/preferencias", { method: "PUT", body: { primeroDespues: true } });
chequeo(r.status === 403, `el hijo no cambia Primero/Después → 403 (${r.status})`);
r = await api(cp, "/api/homeschooling/preferencias", { method: "PUT", body: { alumnoId: hijo.id, primeroDespues: true, recompensaDespues: "15 min de Lego" } });
chequeo(r.status === 200 && r.json.primeroDespues, `el padre activa Primero/Después (${r.status})`);
r = await api(cp, "/api/homeschooling/historias", { body: { titulo: "Vamos al médico", pasos: [{ texto: "Vamos", icono: "Car" }, { texto: "Me miran", icono: "Stethoscope" }, { texto: "Volvemos", icono: "Home" }] } });
chequeo(r.status === 200, `crear historia social (${r.status})`); const hid = r.json?.id;
r = await api(cp, `/api/homeschooling/historias/${hid}/mostrar`, { body: { alumnoIds: [hijo.id] } });
chequeo(r.status === 200, `mostrar hoy (${r.status})`);

Object.assign(estado, { materiaId, recursoId, lecciones, tareaId, evId, hid, diaId: dia.diaId });
guardar(estado);
const fallas = resultados.filter((x) => !x.ok);
console.log(`\nFASE A: ${resultados.length - fallas.length}/${resultados.length} OK, ${fallas.length} FALLA`);
await prisma.$disconnect();
