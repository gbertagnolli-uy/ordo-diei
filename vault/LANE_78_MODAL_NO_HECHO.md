# Lane 78 — Popover "No lo hice" se cerraba al abrirse

**Pedido (textual):** "El cuadro que aparece cuando marcás un habito como no hecho, se abre y cierra instantaneamente, no dejando marcar el habito como no hecho, porque el cuadro/modal se cierra inmediatamente" (captura: popover "Motivo: No lo hice. Podés sumar una nota opcional" con Cancelar / Confirmar).

**Causa:** el popover de nota se abría en el mismo tick en que el `DropdownMenu` "No pude" se cerraba; el cierre del menú (devolución de foco / interacción afuera) disparaba `onOpenChange(false)` del popover.

**Fix** (`src/components/habitos/HabitoCard.tsx`): abrir el popover con 150 ms de retraso, `onCloseAutoFocus` con `preventDefault` en el menú y `onOpenAutoFocus` con `preventDefault` en el popover.
