# Bloqueos y límites — documento común a todas las lanes de Estudio

> Creado en la lane 165 (2026-10-16). **Toda lane que se tope con algo que le impide avanzar lo anota acá** (ID, fecha, lane, qué pasó, qué se hizo en su lugar) y sigue con lo demás. No se borran entradas: se marcan «RESUELTO».

## Límites conocidos desde el inicio

| ID | Tema | Qué pasa | Decisión tomada |
|---|---|---|---|
| B-1 | Almacenamiento | Supabase/Postgres tiene límites y `Archivo` guarda imágenes en la base | El material se **enlaza**: YouTube, Google Drive/Docs, enlaces. Solo texto y markdown se guardan en la base. No se suben PDF ni videos |
| B-2 | Imprimir | Una web no puede mandar a la impresora ni saber si salió papel. `window.print()` abre el diálogo del navegador | El «límite de impresión» cuenta las veces que el hijo **abre la vista de impresión** (el servidor registra y bloquea al pasar el tope). El padre puede dar una más. Impresión directa por correo a la impresora (HP ePrint) queda como opción futura: pide SMTP |
| B-3 | PDF de Drive | Un PDF de Drive es de otro origen: no se puede leer ni imprimir desde nuestro HTML | Se muestra con el visor de Drive en `iframe` (`/preview`) y se imprime abriendo la exportación `export?format=pdf` en pestaña propia. Requiere que el archivo esté compartido «cualquiera con el enlace» |
| B-4 | Google Docs privados | Sin OAuth no se puede leer un Doc privado | Se pide «cualquiera con el enlace puede ver». OAuth de Google queda fuera |
| B-5 | ePub | Un ePub no se puede incrustar desde otro origen sin descargarlo (CORS) | Enlace con botón «Abrir»; lector ePub propio solo si el archivo es accesible por CORS. Alternativa: convertirlo a markdown fuera de la app |
| B-6 | Playlists de YouTube | Listar una lista requiere clave de la API de YouTube | Se pegan los enlaces de los videos (carga masiva por pegado). Sin clave no hay importación de listas |
| B-7 | Notificaciones push/correo | No hay servicio de envío configurado | Centro de notificaciones dentro de la app; sin correo ni push |
| B-8 | Base de datos | Está prohibido `db push`; el SQL aditivo se aplica a mano contra la base compartida | Cada lane genera `migrate diff`, revisa que no tenga `DROP` y lo aplica con `db execute` |
| B-9 | Entorno de worktrees | Los worktrees no traen `.env` (git lo ignora); sin él, los tests de `integrar.sh` fallan con error de Prisma | Se copia `.env` desde `ordo-diei/` al worktree antes de integrar |

## Bloqueos que aparezcan durante la implementación

| ID | Fecha | Lane | Qué pasó | Qué se hizo | Estado |
|---|---|---|---|---|---|
