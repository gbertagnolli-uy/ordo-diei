# Lane 191 — G7: mensajes directos entre los integrantes de la familia

El «DM» de Roost (`vendor/roost/src/components/messages/`), reducido a lo que sirve a una casa: 1 a 1, solo texto, sin adjuntos ni grupos ni tiempo real.

- **Tabla** `Homeschool_Mensajes` (aditiva). Solo los dos participantes leen una conversación (ni siquiera un padre lee la de los hermanos).
- **Pantalla «Mensajes»**: lista de todos los demás integrantes (último mensaje, hora relativa, no leídos) y la conversación (burbujas, separadores de día, ✓ enviado / ✓✓ leído, Enter envía y Shift+Enter hace salto de línea). En el teléfono, una a la vez con «volver». Mientras está abierta consulta cada 8 s si la pestaña está visible.
- **Sobre** en la barra superior de Estudio con los mensajes sin leer (cada minuto; ruta liviana `?resumen=1`).
- Rutas: `GET/POST /api/homeschooling/mensajes`, `GET /mensajes/[conId]` (marca como leídos los recibidos).
- Tests: validaciones y lectura contra la base; el flujo completo con base no se corrió (`PERMITIR_TESTS_DB=1`).
- Pendiente: aviso en la campana, mensajes a todos/ a los padres a la vez, «escribiendo…».
