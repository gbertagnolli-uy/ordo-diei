# Protocolo de delegación a agy (microtareas controladas)

agy (Antigravity CLI, Gemini) implementa; el orquestador especifica y verifica. Las microtareas están escritas para que agy **no tenga que decidir nada**: si una instrucción no se puede cumplir literalmente, se detiene.

## Formato de una microtarea (en `## Microtareas` de cada lane)

```
### M3 · <título corto>                         [agy | orquestador]
Archivos: <rutas exactas; NINGÚN otro archivo se toca>
Precondición: <comando> → <salida esperada>. Si no coincide: DETENERSE y reportar.
Pasos:
  1. <acción literal: reemplazar este texto exacto por este otro / crear este archivo con este contenido>
Verificación: <comando> → <resultado esperado>
```

## Reglas para agy (se copian en cada prompt)

1. Trabajás **solo** en el worktree indicado y **solo** sobre los archivos de la microtarea. No creás, borrás ni renombrás nada más.
2. Los textos «exactos» se copian carácter por carácter (incluidos acentos, `«»` y comillas). No reescribís, no «mejorás», no reformateás código ajeno.
3. Si una precondición falla, un texto a reemplazar no aparece exactamente una vez, o un paso es ambiguo: **no improvisás**. Te detenés y respondés `BLOQUEADO: <motivo>`.
4. Prohibido: `git commit`, `git push`, `git checkout`, `npx prisma db push`, `prisma migrate`, `prisma db execute`, escribir en la base, instalar paquetes no listados en la microtarea, tocar `.env*`.
5. Al terminar corrés la verificación de la microtarea y los gates de la lane, y respondés con: archivos tocados, salida de los gates, y cualquier desvío.

## Lección (lane 260, 2026-11-07)
Antes de escribir una precondición `grep -c '<línea>'` → `1`, el orquestador la corre **contra el archivo real**. Si la línea aparece más de una vez (p. ej. el mismo `const` en dos `map`), se ancla con la sangría exacta y `^…$` y se dice en la microtarea cuál de las apariciones se toca.

## Lección (lane 259, 2026-11-07)
El código que va literal en una spec (incluidos los tests) tiene que pasar `eslint`: sin `any` (usar `as unknown as {…}`), sin variables sin uso. agy lo copia tal cual.

## Gates estándar (desde el worktree)

```bash
npx tsc --noEmit                     # sin errores
npm test                             # todo verde (los tests que escriben en la base se saltean solos)
npx eslint <archivos tocados>        # sin errores nuevos
```

## Receta de port (lanes que migran código de otro repo: 270, 271, 276)

Una microtarea = **un archivo de origen → un archivo de destino**. Formato:
```
### P7 · Portar <nombre>                                  [agy]
Origen: vendor/<repo>/<ruta exacta>
Destino: src/<ruta exacta>   (crear; si ya existe: BLOQUEADO)
Tabla de imports: <import de origen> → <import de destino>   (lista completa; un import que no esté: BLOQUEADO)
Tabla de textos: "<texto en inglés>" → "<texto en español>"  (lista completa; un texto visible que no esté: dejarlo igual y listarlo en el reporte)
Quitar: <símbolos/props/ramas exactas a borrar, con su import>
Verificación: npx tsc --noEmit · npx eslint <destino>
```
Cambios permitidos, y **solo** estos:
1. Primera línea: `// Portado de vendor/<repo>/<ruta> (<owner>/<repo>@<commit7>)` (D-BP3).
2. Reemplazar imports según la tabla.
3. Reemplazar textos visibles según la tabla.
4. Borrar lo listado en «Quitar» (y su import), sin poner nada en su lugar.
5. Adaptaciones de framework listadas en la spec de la lane (p. ej. TanStack Router → `next/navigation`), con la equivalencia exacta que da la spec.
6. `"use client";` arriba si el archivo usa hooks o eventos y va a `src/components` o `src/app`.

Prohibido: cambiar lógica, renombrar funciones o variables, reordenar, «modernizar», agregar features, tocar otro archivo. Si el archivo no compila solo con esos cambios: `BLOQUEADO: <error textual>`.

### Lecciones de la lane 271 (2026-11-07)
- **Ensayar antes de delegar**: el orquestador aplica la receta él mismo con un script (`scratchpad/ensayo-*.py`), corre los gates sobre ese resultado, lo guarda como «esperado», lo borra del worktree y recién ahí delega. El control final es `diff -r --strip-trailing-cr esperado/ destino/`: debe salir vacío.
- **El reporte de agy no es control**: en la fase 2b–2d declaró «Desvíos: ninguno» y había cambiado un número de un SVG y un comentario. Solo el `diff` contra el ensayo lo detectó.
- **Textos visibles**: antes de escribir «Tabla de textos: ninguna», escanear el archivo (`scratchpad/textos.py`) y leer las zonas con JSX. En el core se escapó `"Untitled"` de `displayTitle` (P13).

## Cómo lo corre el orquestador

- Prompt = reglas de arriba + ruta del worktree + la microtarea copiada textual (ver `C:\Users\evoxu\.x7\X7\00 - Sistema\Delegación a otros agentes.md` para flags del CLI).
- Una microtarea por invocación (o un bloque contiguo de la misma lane que toque los mismos archivos).
- Después de cada corrida: `git diff --stat` (solo los archivos declarados), lectura del diff completo, gates. Si algo se desvió, se revierte con `git checkout -- <archivo>` en el worktree de la lane y se reformula.
- Commit lo hace el orquestador con `git add <paths>` explícitos.
- Las microtareas marcadas **[orquestador]** (base de datos, diagnóstico visual, decisiones) no se delegan.
- **Prompts largos (más de ~30 KB):** Windows corta la línea de comandos en 32 KB (`agy: Argument list too long`, código 126). En ese caso el prompt completo va a un archivo y a `agy -p` se le pasa una instrucción corta («leé entero el archivo X y seguilo al pie de la letra»), agregando la carpeta del archivo con un segundo `--add-dir` (lane 271, fase 2f).
- **El resultado esperado del ensayo se guarda fuera del alcance de agy.** En la 2f de la lane 271, agy leyó `scratchpad/esperado271/` (no estaba en su prompt) porque estaba bajo una carpeta agregada con `--add-dir`. El control por `diff` solo vale si agy no pudo ver el resultado: el ensayo va a una carpeta que no se le pasa, y el prompt largo a una carpeta propia (`scratchpad/agy/`) sin nada más.
- **Servidores (decisión de Gabriel, 2026-11-07, AGENTS.md regla 10):** ni agy ni el orquestador levantan `next dev`/`start`/`build`, la base local ni Playwright sin permiso explícito de Gabriel. Las pruebas visuales las hace Gabriel. La nota de abajo queda como antecedente.
- **Memoria:** con el `next dev` de una lane, la base local y 2 agy en paralelo, el equipo (16 GB) se quedó sin memoria y Claude Code cortó los procesos. Con servidor + base levantados, agy de a uno; antes de despachar, cerrar los `next dev` de lanes que no se están probando.
- **Base local (2026-11-07, lane 270):** para apagarla hay que cortar también los `postgres.exe`, no solo el `node iniciar.mjs`. Un postgres huérfano, al terminar, borra el `postmaster.pid` de la instancia nueva y esta se apaga sola al minuto («data directory lock file is invalid»). Nunca borrar `datos/postmaster.pid` si hay algún `postgres.exe` vivo (`Get-Process postgres`).
- **Prompts largos (276 f2, 270 f2):** 23 y 12 archivos completos (54 KB y 50 KB) por puntero a archivo: salida idéntica al ensayo.
