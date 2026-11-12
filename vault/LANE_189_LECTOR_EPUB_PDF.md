# Lane 189 — M2b: ePub y PDF dentro de la app

Pedido: «que el padre pueda cargar contenido de cada dia en el formato que sea (texto, PDF, Google Docs, ePub, markdown)». Hasta acá el ePub solo se abría en otra pestaña (BLOQUEOS B-5).

- **Ruta** `GET /api/homeschooling/materiales/[id]/archivo`: la app baja el PDF o ePub del material y lo entrega ella misma (sin CORS ni bloqueos de otros sitios). La dirección sale **siempre del material guardado**, nunca del pedido; solo la ve quien puede ver el material (la clave «solo padres» no sale).
- **Seguridad** (`servidor/descarga.ts`, 4 tests con red simulada): solo https; host público (sin IP, `localhost`, `.local`); se **resuelve el DNS** y se rechaza si alguna IP es interna (`esIpPrivada`: 10/8, 127/8, 172.16/12, 192.168/16, 169.254/16, 100.64/10, IPv6 local y mapeadas); redirecciones a mano (máx. 3) **revalidando cada destino**; tipo aceptado (`pdf`/`epub`); tope de 30 MB aplicado también al streaming; tiempo máximo 20 s; mensajes claros («compartilo con cualquiera con el enlace»).
- **Lector de ePub** (`LectorEpub`, epub.js 0.3.93): páginas con ← / → o botones, índice, tamaño de letra. Sin scripts del libro.
- **PDF** de un sitio que no deja incrustar: se muestra por la ruta de la app; los PDF de Drive siguen con el visor de Drive.
- `vistaMaterial` devuelve `archivoUrl`; `archivoExterno.ts` (puro, 3 tests) arma la dirección de descarga (Drive: `uc?export=download`).
- Documentado en BLOQUEOS: B-5 resuelto; B-10 (cuota de `/tmp`), B-11 (tests con base sin correr), B-12 (rotación del `.ics`), B-13 (sin pasada visual).
