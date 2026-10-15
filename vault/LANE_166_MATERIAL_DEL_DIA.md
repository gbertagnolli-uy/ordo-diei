# Lane 166 — M1: Material del día

Flujo M1 de `vault/roost/ROADMAP_ESTUDIO.md` (catálogo A1, A2, A7, C7). Pedido del usuario: «que el padre pueda cargar contenido de cada dia en el formato que sea (texto, PDF, Google Docs, ePub, markdown)» y «la carga de contenidos tambien debe ser algo fluido y sin fricción para los padres».

## Qué quedó
- **Modelo** `MaterialEstudio` (tabla `Homeschool_Materiales`, enum `TipoMaterial`): cuelga de una lección, de un día lectivo o, suelto, de un alumno y una fecha. Esquema aditivo aplicado con `migrate diff` + `db execute` (sin `DROP`). Guarda `limiteImpresiones` (lo usa P1).
- **`lib/homeschooling/material.ts`** (puro, con tests): `detectarMaterial` reconoce YouTube, Vimeo, Google Docs/Slides/Hojas, archivos de Drive, `.pdf`, `.epub`, `.md`, Office, video directo, páginas web y texto/markdown; `vistaMaterial` calcula embed, enlace y enlace imprimible; `esImprimible`.
- **`servidor/titulos.ts`**: trae el título real (oEmbed de YouTube/Vimeo, `<title>` de Docs/Drive y webs públicas), solo https y hosts públicos, con tope de tiempo; si falla no bloquea.
- **`servidor/materiales.ts`** + rutas `/api/homeschooling/materiales` (GET/POST), `/detectar`, `/[id]` (PATCH/DELETE), `/[id]/hecho`. Escribir: solo padres; un hijo solo ve lo que cuelga de un plan suyo o de su nombre.
- **Carga sin fricción**: `AgregarMaterial` es una caja única «Pegá lo que tengas»; detecta, trae el título, muestra vista previa y deja corregir el tipo y el límite de impresiones.
- **Entradas**: Plan → clic en un día → «Material de este día»; Plan → «Material para un día» (tarea suelta sin curso); Curso → clip en cada lección.
- **Hoy del hijo**: el visor muestra el material de la lección y del día; «Para hoy» muestra el material suelto con botón «Terminé».
- **Pendiente (siguientes lanes)**: visor integrado por tipo (M2), imprimir con límite (P1), carga masiva (M3).

## Verificación
- `material.test.ts` (9), `titulos.test.ts` (4) y `materiales.test.ts` (2 de permisos; 2 con base real, **no corridos**: requieren `PERMITIR_TESTS_DB=1`, que solo activa el usuario).
- `tsc` y `eslint` limpios en lo tocado; lectura real de `leccionesDeHoy` contra la base sin errores (los hijos no tienen días hoy, la consulta con datos no se ejercitó).
