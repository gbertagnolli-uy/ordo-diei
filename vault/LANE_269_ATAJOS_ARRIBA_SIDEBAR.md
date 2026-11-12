---
lane: 269
titulo: Atajos arriba de todo en el sidebar
plane: "#26"
estado: integrada
rama: task/lane-269-atajos-arriba-sidebar
agente: claude (orquestador) + agy
actualizado: 2026-11-07
---

# Lane 269 — Atajos arriba de todo en el sidebar

## Especificación
Plane #26: «En el sidebar los atajos deben aparecer arriba de todo: Atajos · Para hoy (`/dashboard?s=today`) · Atrasadas (`/dashboard?s=late`)».

Hoy (`src/components/app/AppSidebar.tsx`) el grupo «Atajos» sale de `NAV` y se dibuja **al final** del contenido, después de Rutina, Liturgia, Colección y Administración, junto con «Mis tareas» y «Hogar». Esperado: el grupo «Atajos» (con sus contadores) es el **primero** dentro de `SidebarContent`, inmediatamente debajo del encabezado «Ordo Diei». El resto del orden no cambia.

## Decisiones
- D1 · No se reordena el arreglo `NAV`: `TaskWorkspace.tsx` lo usa para títulos y breadcrumbs. Solo cambia dónde se dibuja cada grupo.

## Arquitectura
Se extrae el JSX de un grupo de `NAV` a una función local `grupoTareas` y se la usa en dos lugares: arriba (solo «Atajos») y en la posición actual (los demás grupos).

## Archivos en alcance
- `src/components/app/AppSidebar.tsx` (modificar)

## Microtareas

### M1 · Dibujar «Atajos» primero [agy]
- [x] hecha (agy, diff revisado = spec)

Archivos: `src/components/app/AppSidebar.tsx`
Precondición: `grep -c '{NAV.map((group) => (' src/components/app/AppSidebar.tsx` → `1` y `grep -c '<SidebarContent>' src/components/app/AppSidebar.tsx` → `1`. Si no: DETENERSE.
Pasos:
1. Reemplazar este bloque exacto:
```tsx
  return (
    <Sidebar collapsible="icon" variant="inset">
```
por:
```tsx
  // Un grupo de NAV (Mis tareas, Atajos, Hogar) con sus contadores
  const grupoTareas = (group: (typeof NAV)[number]) => (
    <SidebarGroup key={group.heading}>
      <SidebarGroupLabel>{group.heading}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => {
          const count = counts[item.id];
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild isActive={active === item.id} tooltip={item.label}>
                <Link href={sectionHref(item.id)}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
              {!!count && <SidebarMenuBadge className="tabular-nums">{count}</SidebarMenuBadge>}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" variant="inset">
```
2. Reemplazar este bloque exacto (el `NAV.map` del final del contenido):
```tsx
        {NAV.map((group) => (
          <SidebarGroup key={group.heading}>
            <SidebarGroupLabel>{group.heading}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const count = counts[item.id];
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={active === item.id} tooltip={item.label}>
                      <Link href={sectionHref(item.id)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {!!count && <SidebarMenuBadge className="tabular-nums">{count}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
```
por:
```tsx
        {NAV.filter((g) => g.heading !== "Atajos").map(grupoTareas)}
```
3. Reemplazar `      <SidebarContent>` por:
```tsx
      <SidebarContent>
        {/* Los atajos van arriba de todo (Plane #26) */}
        {NAV.filter((g) => g.heading === "Atajos").map(grupoTareas)}
```
Verificación: `grep -c 'NAV.filter' src/components/app/AppSidebar.tsx` → `2`; `grep -c 'NAV.map' src/components/app/AppSidebar.tsx` → `0`; gates.

### M2 · Verificación visual [orquestador]
- [x] hecha (base local)
Sidebar expandido y colapsado (íconos): «Atajos» primero, contadores visibles, «Para hoy» activo en `/dashboard?s=today`.

## Criterios de aceptación
- El primer grupo del sidebar es «Atajos» (Para hoy, Atrasadas) con sus contadores.
- «Mis tareas» y «Hogar» siguen al final, en el mismo orden que antes.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/components/app/AppSidebar.tsx`

## Pendientes
- Las lanes 270, 271, 272, 274 y 276 agregan enlaces a este archivo: van después de que esta entre a `dev`.

## Hallazgos

## Bitácora
- 2026-11-06 · claude (orquestador) · RESERVA · creada desde Plane #26
- 2026-11-07 · claude (orquestador) · INICIO · worktree creado, microtareas [agy] delegadas
- 2026-11-07 · claude (orquestador) · avance · M1 hecha por agy, diff = spec, gates: tsc 0 · eslint 0 · npm test 573/0/51, commit b15d61e. Falta M2 (verificación visual) y push/PR (OK de Gabriel)
- 2026-11-07 · claude (orquestador) · avance · M2: captura en base local (puerto 3169, Juan Prueba): «Atajos» aparece primero en el menú lateral. Falta push/PR
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #71 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
