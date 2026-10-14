# Pendientes y cosas para revisar — Reposo v2 (R1–R3) y Liturgia (L1–L9)

> Archivo **único y común** (pedido del usuario, 2026-10-14): cada lane agrega acá lo que no pudo cerrar sola, lo que decidió por su cuenta y lo que el usuario tiene que mirar. Orden: lo más urgente primero dentro de cada lane. Marcá con `[x]` lo resuelto.

## Cómo leerlo
- **Revisar**: decisión o dato que el agente tomó y conviene que lo mire una persona.
- **Pendiente**: trabajo que quedó sin hacer (con motivo).
- **Sin verificar**: criterio de aceptación que solo se prueba en el navegador o con la base real.
- **Para el usuario**: acción que solo vos podés hacer (cargar una clave, dar un OK…).

## Generales
- [ ] **Para el usuario**: cargar `UNSPLASH_ACCESS_KEY` en las variables de entorno de Vercel (D55). Sin eso el reposo muestra el respaldo de partículas.
- [ ] **Para el usuario**: la primera carga masiva de la liturgia en la base (L2) requiere tu OK explícito; ver la sección de L2.
- [ ] **Revisar**: el código de la lane se numeró al crearla (la tabla de `LANES.md` dice cuál es cuál).

## L1 · Spike del motor DO (lane 131)
- **Revisar**: la regla de respaldo de idioma por línea se resolvió con una heurística (latín idéntico + palabras funcionales inglesas + lista de encabezados). Detalle y mediciones en `liturgia/SPIKE_MOTOR.md` §9.3. Si preferís exactitud total, se puede generar una pasada extra en inglés (duplica el tiempo de generación).
- **Revisar**: el Rosario necesita textos que **DO no trae** (Letanía Lauretana, Signum Crucis suelto, oración de Fátima, frutos y citas de los 15 misterios). Los escribe la lane L9 en `src/data/liturgia/rosarium.json` con la fuente anotada; **hay que revisarlos contra una fuente impresa**.
- **Sin verificar**: la proyección de espacio (< 150 MB) es una extrapolación de un mes (octubre 2026); se vuelve a medir tras la primera carga real.
