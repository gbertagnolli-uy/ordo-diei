"use client";
// Lista de entradas que aparece debajo del cursor al escribir «[[». Portado de vendor/moodiary/editor/src/ui/DiaryLinkSuggestion.tsx
// (ZhuJHua/moodiary@2c552dd). La posición se calcula con el rectángulo del cursor (sin `@floating-ui`): debajo, o arriba si no entra.
import { useStore } from "zustand";
import { linkSuggestionStore, selectCandidate } from "../core/nodes/diary-link";

const ALTO_MAXIMO = 280;
const ANCHO = 320;

export function SugerenciaEnlace() {
  const s = useStore(linkSuggestionStore);
  const rect = s.open && s.reference ? s.reference.getBoundingClientRect() : null;
  if (!rect) return null;

  const abajo = window.innerHeight - rect.bottom;
  const arriba = rect.top;
  const haciaArriba = abajo < 160 && arriba > abajo;
  const estilo = {
    left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.min(ANCHO, window.innerWidth - 16) - 8)),
    ...(haciaArriba ? { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.min(ALTO_MAXIMO, arriba - 12) } : { top: rect.bottom + 4, maxHeight: Math.min(ALTO_MAXIMO, abajo - 12) }),
  };

  let cuerpo;
  if (s.loading && !s.items.length) cuerpo = <div className="md-suggest__hint">Buscando…</div>;
  else if (!s.items.length) cuerpo = <div className="md-suggest__hint">{s.query.trim() ? "No hay entradas con ese texto." : "Escribí para buscar una entrada."}</div>;
  else
    cuerpo = s.items.map((it, i) => (
      <button
        key={it.id}
        type="button"
        role="option"
        aria-selected={i === s.index}
        className={`md-suggest__item${i === s.index ? " is-active" : ""}`}
        // Evita que el clic le saque el foco al editor
        onMouseDown={(e) => {
          e.preventDefault();
          selectCandidate(it);
        }}
      >
        <span>{it.label}</span>
        <small>{it.detalle}</small>
      </button>
    ));

  return (
    <div className="md-suggest" style={estilo} role="listbox" aria-label="Entradas para enlazar">
      {cuerpo}
    </div>
  );
}
