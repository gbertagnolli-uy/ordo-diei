"use client";

import React, { useMemo, useState } from "react";
import { Sparkles, Lock, CheckCircle2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CartaVista } from "@/components/cartas/CartaVista";
import {
  contenidoVisible,
  type CartaCompletaEntrada,
  type ContenidoCartaVisible,
} from "@/lib/cartas/revelado";
import { CONFIG_RAREZAS, type RarezaCarta, type CategoriaCarta } from "@/lib/cartas/economia";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";

interface AdminVistaPreviaEnVivoProps {
  cartaBorrador: {
    clave: string;
    nombre: string;
    subtitulo?: string | null;
    categoria: CategoriaCarta;
    rareza: RarezaCarta;
    celebracion?: string | null;
    historia: string;
    oracion: string;
    frase: string;
    fraseAutor?: string | null;
    datasheet: Array<{ etiqueta: string; valor: string }>;
    imagenUrl: string;
    imagenGrado2Url?: string | null;
    imagenGrado3Url?: string | null;
    imagenGrado4Url?: string | null;
    creditoImagen?: string | null;
    fragmentosRequeridos?: number;
  };
}

export function AdminVistaPreviaEnVivo({ cartaBorrador }: AdminVistaPreviaEnVivoProps) {
  const [porcentaje, setPorcentaje] = useState<number>(100);

  const req =
    cartaBorrador.fragmentosRequeridos ||
    CONFIG_RAREZAS[cartaBorrador.rareza]?.fragmentosRequeridos ||
    20;

  const fragmentosSimulados = Math.round((porcentaje / 100) * req);

  // Adaptar para contenidoVisible
  const cartaEntrada: CartaCompletaEntrada = useMemo(() => {
    return {
      clave: cartaBorrador.clave || "borrador",
      nombre: cartaBorrador.nombre || "Nombre de la carta",
      subtitulo: cartaBorrador.subtitulo,
      categoria: cartaBorrador.categoria,
      rareza: cartaBorrador.rareza,
      celebracion: cartaBorrador.celebracion,
      historia: cartaBorrador.historia || "Historia sagrada de la devoción.",
      oracion: cartaBorrador.oracion || "Oración devocional.",
      frase: cartaBorrador.frase || "Frase inspiradora.",
      fraseAutor: cartaBorrador.fraseAutor,
      datasheet:
        cartaBorrador.datasheet.length >= 4
          ? cartaBorrador.datasheet
          : [
              { etiqueta: "Dato 1", valor: "Valor 1" },
              { etiqueta: "Dato 2", valor: "Valor 2" },
              { etiqueta: "Dato 3", valor: "Valor 3" },
              { etiqueta: "Dato 4", valor: "Valor 4" },
            ],
      fragmentosRequeridos: req,
      imagenUrl: cartaBorrador.imagenUrl || "/cartas/santo-rosario/1.webp",
      imagenGrado2Url: cartaBorrador.imagenGrado2Url,
      imagenGrado3Url: cartaBorrador.imagenGrado3Url,
      imagenGrado4Url: cartaBorrador.imagenGrado4Url,
      creditoImagen: cartaBorrador.creditoImagen,
      activa: true,
    };
  }, [cartaBorrador, req]);

  const visible: ContenidoCartaVisible = useMemo(() => {
    return contenidoVisible(cartaEntrada, fragmentosSimulados);
  }, [cartaEntrada, fragmentosSimulados]);

  // Texto del grado
  const rotuloGrado = TEXTOS_CARTAS.grados[visible.grado] || `Grado ${visible.grado}`;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="font-serif font-bold text-lg text-foreground">
              Vista previa interactiva
            </h3>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {porcentaje}% · {fragmentosSimulados} / {req} frag.
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Deslizá entre 0 % y 300 % para verificar cómo cambia la imagen al cruzar 100, 150, 200 y 300 %, y qué textos se revelan.
        </p>
      </div>

      {/* Control deslizador de 0 a 300 % */}
      <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 border border-border/50">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">0 % (Bloqueada)</span>
          <span className="text-primary font-bold text-sm">{porcentaje} %</span>
          <span className="text-muted-foreground">300 % (Gloriosa)</span>
        </div>

        <input
          type="range"
          min={0}
          max={300}
          step={5}
          value={porcentaje}
          onChange={(e) => setPorcentaje(Number(e.target.value))}
          className="w-full h-2 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-primary"
        />

        {/* Botones de salto rápido por hito litúrgico */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { p: 0, label: "0% Bloqueada" },
            { p: 25, label: "25% 1° dato" },
            { p: 50, label: "50% Medio" },
            { p: 100, label: "100% Grado I" },
            { p: 150, label: "150% Grado II" },
            { p: 200, label: "200% Grado III" },
            { p: 300, label: "300% Grado IV" },
          ].map((h) => (
            <Button
              key={h.p}
              type="button"
              variant={porcentaje === h.p ? "default" : "outline"}
              size="sm"
              onClick={() => setPorcentaje(h.p)}
              className="text-[10px] h-6 px-2 py-0"
            >
              {h.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tarjeta HoloCard en vivo */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative flex justify-center w-full max-w-[280px]">
          <CartaVista
            carta={visible}
            modo={porcentaje === 0 ? "bloqueada" : "holo"}
            grado={visible.grado}
            fragmentos={fragmentosSimulados}
            ancho={260}
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Badge
            variant={visible.desbloqueada ? "default" : "secondary"}
            className="text-xs uppercase font-bold tracking-wider"
          >
            {visible.desbloqueada ? rotuloGrado : "Bloqueada (Álbum B/N)"}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            Img: {visible.imagenUrl.split("/").slice(-2).join("/")}
          </span>
        </div>
      </div>

      {/* Pantalla de detalle resumida (D13) */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/50 p-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Contenido visible para el usuario al {porcentaje}%
          </span>
          <span className="text-xs font-medium">
            {visible.desbloqueada ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Desbloqueada
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" /> Bloqueada
              </span>
            )}
          </span>
        </div>

        {/* Datasheet revelado */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">
            Datasheet ({visible.datasheet.filter((d) => d.visible).length} / {visible.datasheet.length} revelados):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {visible.datasheet.map((d, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between rounded-md p-1.5 text-[11px] border ${
                  d.visible
                    ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                    : "border-border/40 bg-muted/30 text-muted-foreground/60"
                }`}
              >
                <span className="font-medium truncate mr-1">{d.etiqueta}:</span>
                <span className="font-mono truncate">
                  {d.visible ? d.valor : `??? (${d.porcentajeRequerido}%)`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Textos sagrados */}
        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Historia sagrada:</span>
            <span className={visible.historia.visible ? "text-emerald-600 font-medium" : "text-muted-foreground/60 font-mono"}>
              {visible.historia.visible ? "Revelada (≥ 100%)" : "Oculta (Requiere 100%)"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Oración devocional:</span>
            <span className={visible.oracion.visible ? "text-emerald-600 font-medium" : "text-muted-foreground/60 font-mono"}>
              {visible.oracion.visible ? "Revelada (≥ 100%)" : "Oculta (Requiere 100%)"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Frase y autor:</span>
            <span className={visible.frase.visible ? "text-emerald-600 font-medium" : "text-muted-foreground/60 font-mono"}>
              {visible.frase.visible ? "Revelada (≥ 100%)" : "Oculta (Requiere 100%)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
