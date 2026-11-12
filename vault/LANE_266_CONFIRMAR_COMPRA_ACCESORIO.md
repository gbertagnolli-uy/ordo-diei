---
lane: 266
titulo: Confirmar la compra de accesorios del compañero
plane: "#23"
estado: integrada
rama: task/lane-266-confirmar-compra-accesorio
agente: claude (orquestador) + agy
actualizado: 2026-11-07
---

# Lane 266 — Confirmar la compra de accesorios del compañero

## Especificación
Plane #23: «Agregar un modal de confirmación al comprar accesorios para el Compañero».

Hoy, en `/dashboard/companero` › pestaña Accesorios, el botón «Comprar» de `FilaAccesorio` (`src/components/engagement/CompaneroView.tsx`) compra en el acto (`accion({ accion: "comprar", clave })`). Esperado: «Comprar» abre un modal que dice qué se compra y cuánto cuesta; recién «Sí, comprar» ejecuta la compra. «Cancelar» o cerrar el modal no compra nada.

Texto del modal:
- Título: `¿Comprar {nombre}?`
- Cuerpo: `{descripcion}` y debajo `Precio: {textoPrecio(a)}` (para los de regalo `textoPrecio` ya devuelve «De regalo»).
- Botones: «Cancelar» (outline) y «Sí, comprar» (con spinner mientras compra).

## Decisiones
- D1 · Se usa el `Modal` de la app (`@/components/ui/Modal`), el mismo que usan las confirmaciones de tareas.
- D2 · El modal se cierra solo si la compra salió bien; si falla, queda abierto y aparece el toast de error que ya existe.

## Archivos en alcance
- `src/components/engagement/CompaneroView.tsx` (modificar)

## Microtareas

### M1 · Modal de confirmación en FilaAccesorio [agy]
- [x] hecha (agy, diff revisado = spec)

Archivos: `src/components/engagement/CompaneroView.tsx`
Precondición: `grep -c 'function FilaAccesorio' src/components/engagement/CompaneroView.tsx` → `1`; `grep -c 'accion({ accion: "comprar", clave: a.clave }' src/components/engagement/CompaneroView.tsx` → `1`. Si no: DETENERSE.
Pasos:
1. Debajo de la línea `import { toast } from "@/lib/toast";` agregar: `import { Modal } from "@/components/ui/Modal";`
2. Reemplazar:
```tsx
  const [ocupado, setOcupado] = useState(false);
  const suyo = datos.suyos.includes(a.clave);
```
por:
```tsx
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const suyo = datos.suyos.includes(a.clave);
```
3. Reemplazar la función `accion` completa:
```tsx
  async function accion(cuerpo: Record<string, unknown>, ok?: string) {
    setOcupado(true);
    try {
      await enviarCompanero(cuerpo);
      if (ok) toast.success(ok);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setOcupado(false);
    }
  }
```
por:
```tsx
  async function accion(cuerpo: Record<string, unknown>, ok?: string): Promise<boolean> {
    setOcupado(true);
    try {
      await enviarCompanero(cuerpo);
      if (ok) toast.success(ok);
      router.refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      return false;
    } finally {
      setOcupado(false);
    }
  }
```
4. Reemplazar:
```tsx
          <Button size="sm" disabled={ocupado || datos.sancionado} onClick={() => accion({ accion: "comprar", clave: a.clave }, `${a.nombre}: ¡ya es tuyo!`)}>
            {ocupado && <Spinner />} Comprar
          </Button>
```
por:
```tsx
          <Button size="sm" disabled={ocupado || datos.sancionado} onClick={() => setConfirmar(true)}>
            Comprar
          </Button>
```
5. Reemplazar el cierre del componente:
```tsx
      </ItemActions>
    </Item>
  );
}
```
(es la **primera** aparición en el archivo, la de `FilaAccesorio`; si `grep -c '      </ItemActions>' ` da más de 1, usar la que está dentro de `function FilaAccesorio`) por:
```tsx
      </ItemActions>
      <Modal isOpen={confirmar} onClose={() => !ocupado && setConfirmar(false)} title={`¿Comprar ${a.nombre}?`} width="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{a.descripcion}</p>
          <p className="text-sm font-medium">Precio: {textoPrecio(a)}</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" disabled={ocupado} onClick={() => setConfirmar(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={ocupado || datos.sancionado}
              onClick={async () => {
                if (await accion({ accion: "comprar", clave: a.clave }, `${a.nombre}: ¡ya es tuyo!`)) setConfirmar(false);
              }}
            >
              {ocupado && <Spinner />} Sí, comprar
            </Button>
          </div>
        </div>
      </Modal>
    </Item>
  );
}
```
Verificación: `grep -c 'setConfirmar(true)' src/components/engagement/CompaneroView.tsx` → `1`; `grep -c 'Sí, comprar' src/components/engagement/CompaneroView.tsx` → `1`; gates.

### M2 · Prueba manual [orquestador]
- [x] hecha (base local)
Base local con saldo: «Comprar» abre el modal; «Cancelar» no descuenta nada; «Sí, comprar» compra, toast «¡ya es tuyo!» y el botón pasa a «Poner».

## Criterios de aceptación
- Ninguna compra de accesorio ocurre sin pasar por «Sí, comprar».
- El modal muestra nombre, descripción y precio correctos.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/components/engagement/CompaneroView.tsx`

## Pendientes

## Hallazgos

## Bitácora
- 2026-11-06 · claude (orquestador) · RESERVA · creada desde Plane #23
- 2026-11-07 · claude (orquestador) · INICIO · worktree creado, microtareas [agy] delegadas
- 2026-11-07 · claude (orquestador) · avance · M1 hecha por agy, diff = spec, gates: tsc 0 · eslint 0 · npm test 573/0/51, commit b9846ee. Falta M2 (prueba manual, necesita base local) y push/PR (OK de Gabriel)
- 2026-11-07 · claude (orquestador) · avance · M2 en base local (puerto 3166, Playwright): «Comprar» (Jardín) abre «¿Comprar Jardín?» con descripción, «Precio: 50 pts», Cancelar / Sí, comprar; Cancelar → sigue «Comprar», saldo 500; Sí, comprar → toast «Jardín: ¡ya es tuyo!», botón «Poner», saldo 450. Falta push/PR
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #69 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
