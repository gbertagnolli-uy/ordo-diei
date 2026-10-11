# Imágenes subidas por los usuarios (lane 41)

> Pedido (2026-10-10): "Resolvé que las imagenes queden funcionando."

## Problema
- La app se despliega en Vercel, que no deja escribir en disco: `/api/upload` y `/api/users/foto` guardaban en `public/uploads/`, que además está en `.gitignore`. En producción las 8 fotos de perfil daban 404 y no se podía subir ninguna imagen (perfil, hábitos comunitarios, arte de cartas).
- Fotos de celular de hasta 12 MB: Vercel corta los pedidos en 4,5 MB.

## Solución (elegida por el usuario: en la base, no Supabase Storage)
- Tabla `Archivos` (`Clave` UUID, `Datos` bytea, `Tipo`, `Bytes`, `Ancho`, `Alto`). SQL aditivo con `migrate diff` + `db execute` (sin `db push`).
- `src/lib/archivos.ts`: `guardarImagen` normaliza con **sharp** (EXIF, máx. 1600 px, WebP q82; ~50–200 KB) y devuelve `/api/archivos/<uuid>`.
- `GET /api/archivos/[clave]`: sin sesión (las fotos se ven en el ingreso), `Cache-Control: immutable`. La clave no se adivina; el arte de cartas de grados no alcanzados nunca se envía (D19).
- `POST /api/upload`: ahora exige sesión, salvo en la configuración inicial (sin usuarios).
- Navegador: `src/lib/subirImagen.ts` comprime con **browser-image-compression 2.0.2** (MIT; 2048 px, 1,5 MB) antes de subir. Lo usan los 5 lugares que suben imágenes.
- Hábitos: `validarImagen` acepta `/api/archivos/<uuid>`. Cartas: la imagen compuesta lee el arte subido desde la base.
- `scripts/migrar-uploads.ts`: pasó las 8 fotos de `public/uploads` a la base (26 MB → ~780 KB) y actualizó `Usuarios.Foto_URL`. Originales y URLs anteriores en `~/Downloads/dev/ordo-diei-respaldos/uploads-20261010-1947/`.

## Verificación
`npm test` 50 + 3 saltados, `tsc`, eslint de lo tocado, `next build`. E2E en :3141: 8 fotos 200 sin sesión, subir sin sesión 401, con sesión 200, no-imagen 400, clave inexistente 404. Chromium headless: ingreso, perfil y hábitos con 0 imágenes rotas.

## Imágenes que NO pasan por acá
- `public/habitos/*.avif` (41, en git): fotos del carrusel de hábitos. Las originales (`public/Imagenes/`, 129 MB) están fuera de git; `npm run imagenes` las regenera.
- `arte-cartas/` (74, en git): arte del catálogo, servido por `/api/cartas/arte` según el grado (lane 39).

## Lane 44 · arte de cartas optimizado (2026-10-10)
> Pedido: "necesito que al cargar una imagen manual desde la app tambien se optimice la imagen, intente y me aparece 'El archivo pesa 1015 KB (supera los 300 KB recomendados).'"

- El panel medía el archivo **original** antes de subirlo; además el perfil general (1600 px) no garantizaba ≤ 300 KB.
- Perfiles de optimización por nombre (`PERFILES_IMAGEN`): `general` (1600 px) y `carta` (1200 px, ≤ 300 KB: el servidor baja la calidad WebP 82 → 42 hasta entrar). El navegador comprime antes con el mismo perfil.
- `/api/upload` devuelve `{ url, bytes, ancho, alto }`; el panel muestra "Optimizada: X KB → Y KB" y solo avisa si aun optimizada supera 300 KB. Acepta también `.avif`.
- Prueba en Chromium headless, subiendo desde "Nueva carta": JPEG de ruido de 3247 KB (2520×3520) → 290 KB (816×1140). Imagen de prueba borrada de la base.
