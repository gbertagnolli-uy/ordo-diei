# Inactividad, cierre de sesión y borradores — Especificación

> Decisiones D3, D4, D5 de [`../DECISIONES.md`](../DECISIONES.md). Trabaja junto a [`../idle-marco-fotos/SPEC.md`](../idle-marco-fotos/SPEC.md) (la pantalla que se muestra) y es **prerrequisito de seguridad** de cualquier feature con formularios nuevos (marketplace admin, homeschooling).

## 1. Pedido (textual)
> Si pasan 15 segundos en la pantalla de login y nadie ingresa ni interactua, se debe activar el salvapantallas. Si un usuario inició sesión y no interactua por 1 minuto, se debe activar el salvapantallas y cerrarle la sesión. Si habian cambios sin guardar, deberian guardarse, si todavía no estaba finalizado lo que el usuario dejó sin guardar, deberia guardarse como borrador.

## 2. Reglas de inactividad

| Contexto | Umbral | Al cumplirse |
|---|---|---|
| `/` en selector o PIN | **15 s** | Ir a REPOSO. |
| Con sesión (cualquier ruta de `/dashboard`) | **60 s** | Vaciar pendientes (§4) → cerrar sesión → REPOSO. |
| REPOSO | — | No hay contador; espera «Entrar». |

**Qué cuenta como actividad:** `pointerdown`, `pointermove` (con umbral de 4 px para ignorar vibración), `keydown`, `wheel`, `touchstart`, `touchmove`, `scroll`, `focusin`. Se escuchan en `window` (captura, pasivos) y se limitan a 1 evento por 500 ms.
**No cuenta:** reloj/animaciones, polling (`ActualizarPremios` cada 15 s), temporizadores de tareas, música.
**Exenciones** (`useMantenerActivo(motivo)`): mientras un componente registre un motivo, el contador de sesión **no corre**: reproducción de un video/lección (homeschooling), temporizador visual a pantalla completa, rezo guiado, subida de archivo en curso, apertura de sobre con animación. El hook devuelve un `release` y se libera solo al desmontar.

### 2.1 Aviso previo (propuesta de UX, no cambia la regla)
A los **50 s** (10 s antes) aparece un `Toast` fijo «Tu sesión se cerrará por inactividad en **10**…» con botón «Seguir aquí». Cualquier interacción lo cancela y reinicia los 60 s. A los 60 s se ejecuta el cierre igual que si no existiera el aviso. Se puede apagar en `ConfigReposo.avisoPrevio`.

### 2.2 Varias pestañas / dispositivos
- Misma sesión en varias pestañas: la actividad se comparte con `BroadcastChannel("ordo-actividad")` (+ `localStorage.ultimaActividad` como respaldo). El cierre ocurre cuando **ninguna** pestaña tuvo actividad en 60 s; todas reciben el evento `cerrar`.
- Dispositivos distintos: cada uno tiene su cookie; el cierre de uno no cierra el otro.

### 2.3 Expiración real en el servidor (S3)
Hoy la cookie `session` dura 24 h (`lib/session.ts`). Con solo el contador del navegador, si la pestaña se cierra o se congela la sesión sigue viva. Propuesta:
- `exp` del JWT = **5 min**, renovado por `POST /api/auth/ping` cada 30 s **solo mientras haya actividad** (sliding session).
- Si el navegador vuelve de suspensión (`visibilitychange`/`pageshow`) y pasó más de 60 s desde la última actividad ⇒ cierra al instante, antes de mostrar nada.
- Compatibilidad: el cambio es de `encrypt()`/`getSession()`; ningún endpoint cambia su contrato. Si el usuario no aprueba S3, queda solo el cierre del lado cliente.

## 3. Cierre de sesión por inactividad — secuencia
1. `useInactividad` dispara `onVencer("sesion")`.
2. Mostrar `Spinner` de pantalla («Guardando…») bloqueando entrada.
3. `await BorradorRegistro.vaciarTodo({ timeoutMs: 5000 })` (§4).
4. `POST /api/auth/logout` (existente).
5. `authStore.logout()`; limpiar stores con datos del usuario (modales, etc.).
6. `router.replace("/")` con estado `REPOSO`. Si el paso 3 falló por red: se guarda en `localStorage` bajo `borradores_pendientes:<usuarioId>` y se reenvía al próximo inicio de sesión de esa persona (§4.5).
Orden crítico: **guardar antes de cerrar la sesión** (el guardado necesita la cookie).

## 4. Guardado automático y borradores

### 4.1 Concepto
Hay dos clases de cosas «sin guardar»:
- **Formulario abierto** (crear tarea, hábito, carta, premio, producto, usuario…): el usuario aún no pulsó «Guardar».
- **Edición** de algo existente (cambiar una tarea, un producto).

Cada formulario se registra en el **registro de borradores** con tres capacidades:
```ts
useBorrador({
  clave: "tarea:nueva" | `tarea:${id}`,      // única por usuario
  tipo: "tarea",
  estado,                                      // el valor actual del formulario (serializable)
  sucio: boolean,                              // hay cambios respecto al original
  validar: () => boolean,                      // mismo esquema zod que usa el envío real
  enviar?: () => Promise<void>,                // el guardado real (mismo código que el botón)
  modo: "final" | "solo-borrador",             // ver §4.3
});
```

### 4.2 Decisión por formulario al vencer la sesión
```
¿sucio?  no → no hacer nada
         sí → ¿modo == "final" y validar()? 
                 sí → await enviar()           (D5: "deberían guardarse")
                      si falla → guardar borrador
                 no → guardar borrador          (D5: "no finalizado → borrador")
```
**Un formulario completo de una acción con efectos NO se envía solo** (supuesto S2). Esos formularios usan `modo: "solo-borrador"`: comportamiento (da premios/XP/penitencias), compra en marketplace, aprobaciones, entrega de premios, completar tarea/hábito. Para ellos el «guardado» es siempre un borrador y la persona decide al volver. Lista inicial:

| Formulario | Archivo | Modo | Nota |
|---|---|---|---|
| Nueva tarea | `components/dashboard/TaskForm.tsx` | `final` si válida | crea tarea asignada |
| Editar tarea | `components/tasks/TaskDetailPanel.tsx` | `final` si válida | PATCH |
| Hábito (crear/editar) | `components/habitos/HabitoDialog.tsx` | `final` si válida | los hábitos de hijos pueden requerir aprobación del padre: ya la piden hoy |
| Carta (admin) | `components/cartas/FormularioCartaAdmin.tsx` | `solo-borrador` | contenido grande/arte; ya tiene vista previa |
| Premios familiares | `app/dashboard/premios/PremiosClient.tsx` | `final` si válida | |
| Reglas del hogar | `app/dashboard/rules/ClientRulesPage.tsx` | `final` si válida | |
| Alta de usuario / PINES | `app/dashboard/users/new`, `users/pines` | `solo-borrador` y **sin PIN** | nunca persistir PIN ni hash |
| Comportamiento | `components/comportamiento/*` | `solo-borrador` | otorga premios |
| Producto de marketplace (admin) | nuevo | `final` si válida | |
| Compra / canje | nuevo | **no aplica** (acción) | no se guarda nada |

### 4.3 Qué se guarda en un borrador
- `clave`, `tipo`, `estado` JSON, `version` del esquema, `actualizadoEn`, `entidadId` (si edita algo existente), `origen: "inactividad" | "manual"`.
- **Nunca**: PIN, contraseñas, tokens. Imágenes: solo una referencia si ya se subieron; archivos en memoria se descartan (y el borrador lo avisa: «la imagen no se guardó»).
- Un borrador por (`usuarioId`, `clave`); reemplaza al anterior.
- Caducidad: 30 días (limpieza en `cron`).

### 4.4 Restaurar
- Al abrir un formulario con borrador: franja arriba «**Tienes un borrador** (guardado ayer a las 18:20 por inactividad). [Continuar] [Descartar]». Nada se carga solo.
- Al iniciar sesión, si hay borradores creados por inactividad: `Toast` «Guardamos tu trabajo anterior como borrador» con acceso a «Mis borradores».
- **Mis borradores**: lista en el menú de usuario (`NavUser`) con tipo, resumen, fecha, [Abrir] [Eliminar]. Ruta `/dashboard/borradores`.
- Si el original cambió desde que se guardó el borrador (edición de entidad existente): mostrar aviso «este elemento cambió después; revisa antes de guardar» (comparar `updatedAt`).

### 4.5 Fallo de red
Primero `localStorage` (`borradores_pendientes:<usuarioId>`, cifrado no requerido: no hay secretos por §4.3), luego intento de envío. Al próximo login de ese usuario se sube y se borra local.

### 4.6 Modelo de datos (SQL aditivo)
```prisma
model Borrador {
  id          Int      @id @default(autoincrement())
  usuarioId   Int      @map("Usuario_ID")
  clave       String   @map("Clave")
  tipo        String   @map("Tipo")
  entidadId   Int?     @map("Entidad_ID")
  titulo      String   @map("Titulo")       // resumen legible para la lista
  datos       Json     @map("Datos")
  version     Int      @default(1) @map("Version")
  origen      String   @default("manual") @map("Origen")
  createdAt   DateTime @default(now()) @map("Created_At")
  updatedAt   DateTime @updatedAt @map("Updated_At")

  usuario Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  @@unique([usuarioId, clave])
  @@map("Borradores")
}
```

### 4.7 API
| Ruta | Método | Qué hace |
|---|---|---|
| `/api/borradores` | GET | Lista los del usuario en sesión. |
| `/api/borradores` | PUT | Upsert por `clave` (`navigator.sendBeacon` compatible para `pagehide`). |
| `/api/borradores/[id]` | DELETE | Descarta. |
Solo el dueño ve y modifica; un padre **no** ve borradores ajenos.

## 5. Componentes y archivos nuevos
- `src/hooks/useInactividad.ts` — contador con umbral, eventos, exenciones, multi-pestaña.
- `src/lib/actividad.ts` — `registrarActividad`, `mantenerActivo(motivo)`, canal entre pestañas.
- `src/components/auth/GuardiaInactividad.tsx` — monta `useInactividad` con 60 s en `dashboard/layout.tsx` y 15 s en `AuthPageClient`.
- `src/components/auth/AvisoCierre.tsx` — toast de 10 s.
- `src/lib/borradores/registro.ts` + `useBorrador.ts` — registro en memoria y `vaciarTodo`.
- `src/components/borradores/BandaBorrador.tsx`, `ListaBorradores.tsx`.
- `src/app/api/borradores/*`, `src/app/dashboard/borradores/page.tsx`.

## 6. Criterios de aceptación
1. En el selector o PIN, 15 s sin eventos ⇒ reposo; con eventos no.
2. Con sesión, 60 s sin eventos ⇒ se guarda lo pendiente, se cierra la sesión y aparece el reposo. Lo hecho en `/dashboard` no es accesible sin volver a entrar.
3. Una tarea nueva **válida** a medio guardar ⇒ queda creada. Una **incompleta** ⇒ queda un borrador con lo escrito.
4. Un registro de comportamiento completo ⇒ **solo borrador** (no se otorgan premios).
5. Al volver a abrir el formulario aparece «Tienes un borrador» y «Continuar» restaura todos los campos.
6. Un video/temporizador activo (exención) evita el cierre; al terminar se reinicia la cuenta.
7. Dos pestañas: actividad en una evita el cierre en la otra.
8. Sin red al vencer ⇒ el trabajo se conserva localmente y se sube en el siguiente login del mismo usuario.
9. Ningún borrador contiene PIN ni tokens.
10. Pruebas unitarias del reloj (simulando tiempo), de la decisión §4.2 y de la API de borradores.

## 7. Riesgos y decisiones abiertas
- ¿Aviso de 10 s (§2.1) sí/no? (propuesto: sí).
- ¿Sesión deslizante de 5 min (S3)? Mejora real de seguridad; cambia `session.ts`.
- 60 s es corto para leer (oración, lectura de libro): usar `useMantenerActivo` en esas vistas; lista a revisar con el usuario.
- Un niño podría perder lo que escribe en un formulario largo: por eso el aviso de §2.1 y la restauración de §4.4.
