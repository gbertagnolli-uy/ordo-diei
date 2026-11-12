// Prueba de la API de la biblioteca (lane 270, fase 1) contra la base local. node i270api.mjs <puerto>
import { request } from "playwright";
const base = `http://localhost:${process.argv[2]}`;
const ok = (cond, msg) => console.log(cond ? "OK  " : "FALLA", msg);
async function como(userId) {
  const r = await request.newContext({ baseURL: base });
  const l = await r.post("/api/auth/login", { data: { userId, pinSecreto: "1234" } });
  if (!l.ok()) throw new Error(`login ${userId}: ${l.status()}`);
  return r;
}
const papa = await como(1);
const juan = await como(3);
const ana = await como(4);
const ID = Date.now();

// Un PDF mínimo subido por el camino existente (≤ 4 MB)
const pdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
const sub = await papa.post("/api/upload", { multipart: { modo: "estudio", file: { name: `prueba-${ID}.pdf`, mimeType: "application/pdf", buffer: pdf } } });
const subida = await sub.json();
ok(sub.ok() && /^\/api\/archivos\//.test(subida.url ?? ""), `subida del PDF (${sub.status()} ${subida.url ?? subida.error})`);

// Estantes
const e1 = await (await papa.post("/api/biblioteca/estantes", { data: { nombre: `Clásicos ${ID}` } })).json();
ok(e1.estante?.id > 0, "el padre crea un estante");
const rep = await papa.post("/api/biblioteca/estantes", { data: { nombre: `Clásicos ${ID}` } });
ok(rep.status() === 400 && /Ya hay un estante/.test((await rep.json()).error), "no se repite el nombre del estante");
ok((await juan.post("/api/biblioteca/estantes", { data: { nombre: "x" } })).status() === 403, "un hijo no crea estantes");

// Libros
const nuevo = { titulo: `Martín Fierro ${ID}`, autor: "José Hernández", sinopsis: "Poema gauchesco.", estanteIds: [e1.estante.id], archivos: [{ url: subida.url, formato: "pdf", bytes: pdf.length }] };
ok((await juan.post("/api/biblioteca/libros", { data: nuevo })).status() === 403, "un hijo no carga libros");
const cr = await papa.post("/api/biblioteca/libros", { data: nuevo });
const libro = (await cr.json()).libro;
ok(cr.ok() && libro?.id > 0 && libro.archivos.length === 1 && libro.estanteIds[0] === e1.estante.id, "el padre carga un libro con su archivo y su estante");
ok((await papa.post("/api/biblioteca/libros", { data: { ...nuevo, archivos: [{ url: "https://otro/x.pdf", formato: "pdf" }] } })).status() === 400, "rechaza archivos que no son propios");

const lista = (await (await juan.get("/api/biblioteca/libros")).json()).libros;
const delJuan = lista.find((l) => l.id === libro.id);
ok(delJuan && delJuan.estado === "sin_empezar" && delJuan.porcentaje === 0, "el hijo ve el libro, sin empezar");

// Posición por usuario
let p = await (await juan.put(`/api/biblioteca/libros/${libro.id}/posicion`, { data: { porcentaje: 34, pagina: 12 } })).json();
ok(p.estado === "leyendo" && p.porcentaje === 34, "Juan lee hasta 34 % → leyendo");
const det = (await (await juan.get(`/api/biblioteca/libros/${libro.id}`)).json()).libro;
ok(det.posicion.pagina === 12 && det.porcentaje === 34, "el detalle de Juan trae su página");
const deAna = (await (await ana.get(`/api/biblioteca/libros/${libro.id}`)).json()).libro;
ok(deAna.estado === "sin_empezar" && deAna.posicion.pagina === null, "Ana no ve la posición de Juan");
p = await (await juan.put(`/api/biblioteca/libros/${libro.id}/posicion`, { data: { porcentaje: 99 } })).json();
ok(p.estado === "leido", "a 99 % pasa a leído");
p = await (await juan.put(`/api/biblioteca/libros/${libro.id}/posicion`, { data: { porcentaje: 3 } })).json();
ok(p.estado === "leido", "un leído no vuelve a leyendo al releer el principio");
p = await (await juan.put(`/api/biblioteca/libros/${libro.id}/posicion`, { data: { porcentaje: 3, estado: "leyendo" } })).json();
ok(p.estado === "leyendo", "a mano sí se puede volver a leyendo");
ok((await juan.put(`/api/biblioteca/libros/${libro.id}/posicion`, { data: { porcentaje: "x" } })).status() === 400, "porcentaje inválido → 400");
ok((await juan.put(`/api/biblioteca/libros/999999/posicion`, { data: { porcentaje: 1 } })).status() === 404, "libro inexistente → 404");

// Editar y borrar
const ed = await papa.patch(`/api/biblioteca/libros/${libro.id}`, { data: { titulo: `El gaucho Martín Fierro ${ID}`, autor: "José Hernández", estanteIds: [] } });
const edit = (await ed.json()).libro;
ok(ed.ok() && edit.titulo.startsWith("El gaucho") && edit.estanteIds.length === 0 && edit.archivos.length === 1, "el padre edita título y estantes; los archivos quedan");
ok((await juan.patch(`/api/biblioteca/libros/${libro.id}`, { data: { titulo: "x" } })).status() === 403, "un hijo no edita");
ok((await juan.delete(`/api/biblioteca/libros/${libro.id}`)).status() === 403, "un hijo no borra");
ok((await papa.delete(`/api/biblioteca/libros/${libro.id}`)).ok(), "el padre borra el libro");
ok((await juan.get(`/api/biblioteca/libros/${libro.id}`)).status() === 404, "borrado → 404 (y su estado se fue en cascada)");
ok((await papa.delete(`/api/biblioteca/estantes?id=${e1.estante.id}`)).ok(), "el padre borra el estante");
const anon = await request.newContext({ baseURL: base });
ok((await anon.get("/api/biblioteca/libros")).status() === 401, "sin sesión → 401");
