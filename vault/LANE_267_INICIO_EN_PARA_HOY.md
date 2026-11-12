---
lane: 267
titulo: Al abrir la app, ir a /dashboard?s=today
plane: "#24"
estado: integrada
rama: task/lane-267-inicio-en-para-hoy
agente: claude (orquestador) + agy
actualizado: 2026-11-07
---

# Lane 267 — Al abrir la app, ir a «Para hoy»

## Especificación
Plane #24: «Al abrir la app, la pantalla que aparece automáticamente debe ser /dashboard?s=today».

Hoy la app entra a `/dashboard` (sección «Por hacer») en dos lugares:
- después del PIN, `src/components/auth/AuthPageClient.tsx` hace `router.push("/dashboard")` (dos veces: con premio pendiente y sin él);
- la app instalada (PWA) abre `start_url: "/dashboard"` (`src/app/manifest.ts`).

Resultado esperado: los dos entran a `/dashboard?s=today` («Atajos › Para hoy»). El resto de los enlaces a `/dashboard` (logo del sidebar, «Volver al inicio», redirecciones de permisos) **no cambian**: Gabriel pidió la pantalla al abrir la app, no cambiar el inicio de cada enlace.

## Decisiones
- D1 · Solo cambian los dos puntos de entrada (login y PWA).

## Archivos en alcance
- `src/components/auth/AuthPageClient.tsx` (modificar)
- `src/app/manifest.ts` (modificar)

## Microtareas

### M1 · Login → Para hoy [agy]
- [x] hecha (agy)

Archivos: `src/components/auth/AuthPageClient.tsx`
Precondición: `grep -c 'router.push("/dashboard");' src/components/auth/AuthPageClient.tsx` → `2`. Si no: DETENERSE.
Pasos:
1. Reemplazar **las dos** apariciones exactas de `router.push("/dashboard");` por `router.push("/dashboard?s=today");`.
2. No tocar `router.push("/agenda")` ni nada más.
Verificación: `grep -c 'router.push("/dashboard?s=today");' src/components/auth/AuthPageClient.tsx` → `2`; `grep -c 'router.push("/dashboard");' src/components/auth/AuthPageClient.tsx` → `0`.

### M2 · App instalada → Para hoy [agy]
- [x] hecha (agy)

Archivos: `src/app/manifest.ts`
Precondición: `grep -c 'start_url: "/dashboard",' src/app/manifest.ts` → `1`.
Pasos:
1. Reemplazar `    start_url: "/dashboard",` por `    start_url: "/dashboard?s=today",`.
Verificación: `grep -c 'start_url: "/dashboard?s=today",' src/app/manifest.ts` → `1`; gates.

### M3 · Prueba manual [orquestador]
- [x] hecha (base local)

Entrar con PIN (base local): queda en `/dashboard?s=today` con «Para hoy» activo en el sidebar y el título «Para hoy». Con premio pendiente, además aparece el modal del premio.

## Criterios de aceptación
- Tras el PIN la URL es `/dashboard?s=today` y el sidebar marca «Para hoy».
- `manifest.webmanifest` sirve `"start_url":"/dashboard?s=today"`.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/components/auth/AuthPageClient.tsx src/app/manifest.ts`

## Pendientes
- Una PWA ya instalada puede conservar el `start_url` viejo hasta que el navegador actualice el manifiesto (lo hace solo, sin acción del usuario).

## Hallazgos

## Bitácora
- 2026-11-06 · claude (orquestador) · RESERVA · creada desde Plane #24
- 2026-11-07 · claude (orquestador) · INICIO · worktree creado, microtareas [agy] delegadas
- 2026-11-07 · claude (orquestador) · avance · M1+M2 hechas por agy, diff = spec, gates: tsc 0 · eslint 0 · npm test 573/0/51, commit 8ccef58. Falta M3 (prueba manual) y push/PR (OK de Gabriel)
- 2026-11-07 · claude (orquestador) · avance · M3 en base local (puerto 3167, Playwright): Entrar → Juan Prueba → PIN → /dashboard?s=today, «Para hoy» activo en el sidebar, breadcrumb «Atajos › Para hoy»; manifest servido con start_url /dashboard?s=today. (Premio pendiente no probado: no hay premios sembrados.) Falta push/PR
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #70 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
