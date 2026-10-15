# Lane 150 · Catecismo desde el PDF y verificación de la Vulgata con el epub

**Fecha** 2026-10-14. **Pedido (textual)**: «Del catecismo conseguí un PDF con texto extraíble (no es escaneado) … me tenés que dar el comando para pasarlo a esta computadora»; «La biblia la descargué en epub: también me tenés que dar el comando para copiar junto con el pdf»; luego «listo ya copié los archivos».

**Hecho**: el Catecismo se regenera desde el PDF (993 preguntas, antes 707 con errores de OCR); el epub de la Vulgata verifica el latín de las 562 citas (562/562 iguales). Scripts: `scripts/reposo/catecismo-pdf.{sh,ts}`, `scripts/reposo/verificar-vulgata-epub.ts`, con tests. Detalle y reservas en `PENDIENTES_REPOSO_LITURGIA.md` (sección «Catecismo y Vulgata desde los archivos del usuario»).
