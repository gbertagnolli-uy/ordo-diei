# Lane 167 — M2: Visor de material por tipo

Flujo M2 del roadmap (catálogo A3, F3 parcial). Sigue a M1 (lane 166).

- `MarkdownTexto`: markdown (react-markdown 10.1.0 + remark-gfm 4.0.1) con tipografía grande para leer; sin HTML crudo, sin imágenes, enlaces en otra pestaña. Texto plano respeta saltos de línea.
- `VisorMaterial`: pantalla completa (Sheet) con barra fija (título, tipo, «n de m», acciones, Abrir) y navegación anterior/siguiente (botones y flechas ← →). Video de YouTube/Vimeo/archivo, markdown/texto, PDF y Google Docs/Slides/Hojas/Drive en iframe (con aviso «si no se ve, abrilo en otra pestaña»); ePub, webs y lo que no admite iframe: tarjeta con botón «Abrir».
- `MaterialesDelDia`: cada tarjeta abre el visor; el texto muestra un adelanto.
- Punto de enganche `acciones` del visor: lo usa P1 (imprimir).
- Límite conocido (BLOQUEOS B-3/B-5): un PDF de otro sitio puede negarse a ser incrustado; un ePub no se incrusta.
