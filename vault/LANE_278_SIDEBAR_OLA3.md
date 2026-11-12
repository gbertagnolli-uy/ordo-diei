---
lane: 278
titulo: Ola 3 — enlaces nuevos en el sidebar
plane: "- (cierra los enlaces de #29, #30, #31 y #33)"
estado: integrada
rama: task/lane-278-sidebar-ola3
agente: "claude (orquestador) + agy"
actualizado: 2026-11-07
---

# Lane 278 — Ola 3: enlaces nuevos en el sidebar

## Especificación
Las lanes 270 (Biblioteca), 271 (Notas), 272 (Diario) y 274 (Premio grupal) dejaron su enlace en `src/components/app/AppSidebar.tsx` «al final, ola 3», para no tener cuatro lanes abiertas sobre el mismo archivo (D-BP5). Esta lane junta los cinco enlaces en un solo cambio:
- Grupo «Rutina», debajo de «Mis premios»: **Premio grupal** (`Target`, `/dashboard/premio-grupal`).
- Grupo nuevo **«Lectura y escritura»** entre «Liturgia» y «Colección»: **Biblioteca** (`Library`, `/dashboard/biblioteca`), **Notas** (`NotebookPen`, `/dashboard/notas`), **Mi diario** (`BookHeart`, `/dashboard/diario`), **Diario familiar** (`BookUser`, `/dashboard/diario/familia`).

## Decisiones
- D1 · (orquestador, 2026-11-07) Una sola lane para los cinco enlaces; reemplaza 270 «enlace del sidebar», 271 M-P2, 272 M7.3 y 274 M10.
- D2 · Las rutas se tomaron de las ramas reales (`git diff --name-only --diff-filter=A dev...task/lane-NN`), no de la spec.
- D3 · Se integra **última**: después de que 269, 270, 271, 272 y 274 estén en `origin/dev` (antes, los enlaces llevarían a 404). La 269 también toca `AppSidebar.tsx`: verificado con `patch --dry-run` que este cambio entra limpio sobre su versión (otras zonas del archivo), así que la excepción a D-BP5 no genera conflicto.
- D4 · El grupo «Lectura y escritura» es propuesta del orquestador; si Gabriel prefiere otro nombre u orden, se edita un solo bloque.

## Archivos en alcance
- `src/components/app/AppSidebar.tsx` (modificar)

## Microtareas

### M1 · Íconos [agy]
- [x] hecha (`3a413b3`, agy, idéntica al ensayo)
Archivo: `src/components/app/AppSidebar.tsx`. Reemplazar exactamente este bloque (está una sola vez):
```tsx
  AlarmClock,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Church,
  Gift,
  GraduationCap,
  History,
  Hourglass,
  Layers,
  ListTodo,
  Network,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sprout,
  Timer,
} from "lucide-react";
```
por:
```tsx
  AlarmClock,
  BookHeart,
  BookUser,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Church,
  Gift,
  GraduationCap,
  History,
  Hourglass,
  Layers,
  Library,
  ListTodo,
  Network,
  NotebookPen,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sprout,
  Target,
  Timer,
} from "lucide-react";
```

### M2 · Enlaces [agy]
- [x] hecha (`3a413b3`, agy, idéntica al ensayo)
Mismo archivo. Reemplazar exactamente este bloque (está una sola vez):
```tsx
              {!!premiosPendientes && <SidebarMenuBadge className="tabular-nums">{premiosPendientes}</SidebarMenuBadge>}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Liturgia</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith("/dashboard/liturgia")} tooltip="Liturgia">
                <Link href="/dashboard/liturgia">
                  <Church />
                  <span>Liturgia</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Colección</SidebarGroupLabel>
```
por:
```tsx
              {!!premiosPendientes && <SidebarMenuBadge className="tabular-nums">{premiosPendientes}</SidebarMenuBadge>}
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard/premio-grupal"} tooltip="Premio grupal">
                <Link href="/dashboard/premio-grupal">
                  <Target />
                  <span>Premio grupal</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Liturgia</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith("/dashboard/liturgia")} tooltip="Liturgia">
                <Link href="/dashboard/liturgia">
                  <Church />
                  <span>Liturgia</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {/* Lane 278 (ola 3): enlaces de las lanes 270, 271 y 272 */}
        <SidebarGroup>
          <SidebarGroupLabel>Lectura y escritura</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith("/dashboard/biblioteca")} tooltip="Biblioteca">
                <Link href="/dashboard/biblioteca">
                  <Library />
                  <span>Biblioteca</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith("/dashboard/notas")} tooltip="Notas">
                <Link href="/dashboard/notas">
                  <NotebookPen />
                  <span>Notas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard/diario"} tooltip="Mi diario">
                <Link href="/dashboard/diario">
                  <BookHeart />
                  <span>Mi diario</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard/diario/familia"} tooltip="Diario familiar">
                <Link href="/dashboard/diario/familia">
                  <BookUser />
                  <span>Diario familiar</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Colección</SidebarGroupLabel>
```
Verificación: `npx tsc --noEmit`; `npx eslint src/components/app/AppSidebar.tsx` → 0 problemas.

### M3 · Prueba [orquestador]
- [x] hecha (orquestador: `i278.mjs` 6/6 sin errores sobre el commit; falta repetir al integrar, D3)
`verif-db/i278.mjs <puerto> cap278`: los cinco enlaces con su `href`, el grupo «Lectura y escritura», sin errores. Repetir después de integrar 269/270/271/272/274: cada enlace abre su pantalla.

## Criterios de aceptación
- Los cinco enlaces visibles para todos los roles, con su ícono y estado activo.
- tsc 0, eslint 0, tests sin fallas.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/components/app/AppSidebar.tsx`

## Pendientes
- Integrar después de 269, 270, 271, 272 y 274 (D3).
- Social (276, fase 3) agrega su enlace cuando exista la pantalla.

## Hallazgos

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA + INICIO · creada para juntar los enlaces de la ola 3; ensayo: tsc 0, eslint 0, navegador 6/6 sin errores, entra limpio sobre la 269.
- 2026-11-07 · claude (orquestador) + agy · M1–M2 por agy idénticas; tsc 0, eslint 0, tests 624/573/0; navegador 6/6. Commit `3a413b3`. Integrar última (D3).
- 2026-11-07 · claude (orquestador) · ENTREGA · PR #66 a dev (`scripts/abrir-pr.sh`: origin/dev incluido, tests + tsc verdes) con OK de Gabriel. Lo integra Gabriel; después `scripts/limpiar-lane.sh 278`.
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #66 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
