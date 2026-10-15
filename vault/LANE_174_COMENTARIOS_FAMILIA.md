# Lane 174 — Q1 + Q3: comentarios, reacciones y avisos entre los integrantes de la familia

Decisión del usuario (2026-10-16): Estudio es de una sola familia; «Social LMS» = interactuar entre el núcleo familiar. Catálogo G1, G2, G5.

- **Tablas** (aditivas): `Homeschool_Comentarios`, `Homeschool_Reacciones`, `Homeschool_Avisos`.
- **Comentarios** sobre una lección, un material o una evidencia (`ComentariosEstudio`): lista corta (sin anidado ni menciones), 1000 caracteres, Ctrl+Enter, borra el autor o un padre. Ve y escribe quien puede ver el objeto: padres siempre; un hijo, lo suyo; una evidencia destacada la ve toda la familia.
- **Reacciones** 👍 ❤️ 🙏 en cada comentario y en cada evidencia (una por persona y emoji; alterna).
- **Avisos dentro de la app** (`CampanaAvisos` en la barra superior): si comenta un hijo, avisa a los padres; si comenta un padre, avisa al/los hijo(s) a quien concierne. Contador cada minuto, se marcan leídos al abrir y cada aviso lleva a donde ocurrió. Sin correo ni push (BLOQUEOS B-7).
- Integrado en: el visor de lección del hijo, la vista de lección del padre y el detalle de la evidencia (portafolio).
- Rutas: `/api/homeschooling/comentarios`, `/comentarios/[id]`, `/reacciones`, `/notificaciones` (la ruta `/avisos` ya existía para los avisos de repaso).
- Pendiente: comentarios en el visor de material (Q1b), muro de logros de la familia (Q2), mensajes directos (Q4).
- Tests: `comentarios.test.ts` (lib 3; servidor 1 sin base, 1 con base no corrido: `PERMITIR_TESTS_DB=1`).
