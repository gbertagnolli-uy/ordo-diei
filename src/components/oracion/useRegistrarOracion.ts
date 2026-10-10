"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/store/modalStore";
import { HABITOS, type HabitoId, type Marca } from "@/lib/oracion/catalogo";
import type { EstadoOracion } from "@/lib/oracion/server";

// Registra una oración con un toque y celebra los eventos que devuelve el motor.
export function useRegistrarOracion(inicial: EstadoOracion) {
  const router = useRouter();
  const openModal = useModalStore((s) => s.openModal);
  const [estado, setEstado] = useState(inicial);
  const [pendiente, setPendiente] = useState<HabitoId | "plan" | null>(null);

  const enviar = async (url: string, method: string, body: object, clave: HabitoId | "plan") => {
    setPendiente(clave);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al guardar");
      const nuevo: EstadoOracion = json.estados[0];
      setEstado(nuevo);
      router.refresh(); // contador de la barra lateral
      return nuevo;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error de conexión");
      return null;
    } finally {
      setPendiente(null);
    }
  };

  const registrar = async (habito: HabitoId, marca: Marca | null, motivo?: string) => {
    const nuevo = await enviar("/api/oracion/registro", "PUT", { habito, marca, motivo }, habito);
    const h = nuevo?.plan?.habitos.find((x) => x.habito === habito);
    const evento = h?.eventos.find((e) => e !== "recaida");
    if (h && evento) {
      openModal("ORACION", {
        tipo: evento,
        habito: HABITOS[habito].nombre,
        paso: evento === "ascenso" ? h.pasoActual.titulo : null,
      });
    }
  };

  const comenzar = () => enviar("/api/oracion", "POST", {}, "plan");

  return { estado, pendiente, registrar, comenzar };
}
