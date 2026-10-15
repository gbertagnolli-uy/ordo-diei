# Lane 116: Selector de hábitos colectivos con JellyRadio en pestaña Familia

> Pedido (2026-10-14): "En /dashboard/habitos en la tab "Familia" que se usa para ingresar un habito completado de forma colectiva, el selector de habitos no funciona, no son botones sino textos "Que rezamos o hicimos juntos" no deja seleccionar. La idea es que sean seleccionables, usando este ccomponente: JellyRadio"

## Cambios realizados
- **Componente JellyRadio**:
  - Incorporado en `src/components/JellyRadio.tsx` (y re-exportado en `src/components/ui/jelly-radio.tsx` para consistencia).
  - Animación elástica con física de resorte (`motion/react`) que desplaza los chips adyacentes y agranda con efecto jelly el chip seleccionado.
  - Soporte SSR seguro con `useIsomorphicLayoutEffect` y verificación segura de `document.fonts.ready`.
  - Integración nativa con tokens de diseño del sistema (The Noble Manuscript): `--surface-container` para el estado inactivo, `--primary` para el activo, `--on-surface` y `--on-primary` para textos e íconos.
- **Pestaña Familia (`src/components/habitos/FamiliaHabitos.tsx`)**:
  - Se reemplazó el `ToggleGroup` estático por `JellyRadio`.
  - Se mapearon las oraciones del catálogo como `JellyRadioItem` con sus respectivos íconos (`HabitoIcon`) y nombres.
  - Se agregó contenedor con scroll horizontal suave (`overflow-x-auto`) para garantizar visualización y tacto perfecto en dispositivos móviles y de escritorio sin recortar el rebote elástico.
  - Se incluyó feedback con `toast.success` al registrar la práctica compartida.
  - Se validó que el botón "Registrar para todos" requiera un hábito seleccionado.

## Verificación
- `npm test`: 97 pasando (3 saltados que requieren base de datos real).
- `npx tsc --noEmit`: 0 errores de tipos.
- `npx eslint`: 0 errores y 0 warnings en los archivos afectados.
- `npx next build`: Compilación exitosa con Turbopack y generación de páginas estáticas sin advertencias de SSR.
