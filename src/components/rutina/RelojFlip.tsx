"use client";

import { useEffect, useState } from "react";

// Portado de Open Fliqlo (CogitoForge-AI/Open-Fliqlo, MIT): proporciones del dígito, bisagra y
// giro de solapa. La fuente de los dígitos es Gluqlo (ISC). Ver THIRD_PARTY_NOTICES.md.

const ALTO_DIGITO = "1em";

function MitadDigito({ valor, parte }: { valor: number; parte: "superior" | "inferior" }) {
  return (
    <span
      className="absolute inset-x-0 overflow-hidden"
      style={{
        height: "50%",
        top: parte === "superior" ? 0 : "50%",
        backgroundColor: "var(--flip-bg)",
        backfaceVisibility: "hidden",
      }}
    >
      <span
        className="absolute inset-x-0 flex items-center justify-center"
        style={{
          height: "200%",
          top: parte === "superior" ? 0 : "-100%",
          fontFamily: "Gluqlo, var(--font-geist-mono), monospace",
          fontSize: "0.7em",
          lineHeight: 1,
          color: "var(--flip-fg)",
        }}
      >
        {valor}
      </span>
    </span>
  );
}

function DigitoFlip({ valor }: { valor: number }) {
  // Se guarda el dígito anterior comparando en el render: así la solapa gira de `previo` a `actual`
  const [estado, setEstado] = useState({ actual: valor, previo: valor, giros: 0 });
  if (valor !== estado.actual) {
    setEstado({ actual: valor, previo: estado.actual, giros: estado.giros + 1 });
  }
  const { actual, previo, giros } = estado;

  return (
    <span
      className="relative inline-block overflow-visible"
      style={{
        width: "0.72em",
        height: ALTO_DIGITO,
        borderRadius: "0.072em",
        boxShadow: "0 0.02em 0.06em var(--flip-sombra)",
      }}
    >
      <span className="absolute inset-0 overflow-hidden" style={{ borderRadius: "0.072em" }}>
        <MitadDigito valor={actual} parte="superior" />
        <MitadDigito valor={giros > 0 ? previo : actual} parte="inferior" />
        {giros > 0 && (
          <span key={giros}>
            <span className="flip-solapa-superior absolute inset-x-0 top-0 block h-1/2">
              <MitadDigito valor={previo} parte="superior" />
            </span>
            <span className="flip-solapa-inferior absolute inset-x-0 bottom-0 block h-1/2">
              <MitadDigito valor={actual} parte="inferior" />
            </span>
          </span>
        )}
        {/* Bisagra */}
        <span
          className="absolute inset-x-0 z-10"
          style={{
            top: "50%",
            height: "0.012em",
            minHeight: 1.5,
            transform: "translateY(-50%)",
            backgroundColor: "var(--flip-bisagra)",
          }}
        />
      </span>
    </span>
  );
}

function Separador() {
  return (
    <span
      aria-hidden
      className="inline-flex flex-col items-center justify-center"
      style={{ width: "0.26em", height: ALTO_DIGITO, gap: "0.14em" }}
    >
      <span className="rounded-full" style={{ width: "0.07em", height: "0.07em", backgroundColor: "var(--flip-fg)" }} />
      <span className="rounded-full" style={{ width: "0.07em", height: "0.07em", backgroundColor: "var(--flip-fg)" }} />
    </span>
  );
}

interface RelojFlipProps {
  className?: string;
  /** Alto del dígito (cualquier longitud CSS), p. ej. "min(26vh, 18vw)". */
  alto?: string;
}

/** Reloj de hora real (HH:MM, 24 h) con dígitos de solapa. Toma colores del tema (claro/oscuro). */
export function RelojFlip({ className = "", alto = "min(26vh, 18vw)" }: RelojFlipProps) {
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setAhora(new Date());
    tick();
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  // Sin hora (render del servidor / primer pintado) no se dibujan dígitos: evita un giro falso al montar
  const horas = ahora?.getHours() ?? 0;
  const minutos = ahora?.getMinutes() ?? 0;
  const etiqueta = ahora
    ? `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`
    : undefined;

  return (
    <div
      role="timer"
      aria-label={etiqueta ? `Hora actual ${etiqueta}` : "Hora actual"}
      className={`inline-flex items-center select-none ${className}`}
      style={{ fontSize: alto, height: ALTO_DIGITO, gap: "0.04em" }}
    >
      {ahora && (
        <>
          <DigitoFlip valor={Math.floor(horas / 10)} />
          <DigitoFlip valor={horas % 10} />
          <Separador />
          <DigitoFlip valor={Math.floor(minutos / 10)} />
          <DigitoFlip valor={minutos % 10} />
        </>
      )}
    </div>
  );
}
