"use client";

// Avisos en el celular (vault/ENGAGEMENT_PLAN.md, lane 204). Dos usos del mismo componente:
// «invitacion» (franja chica en el inicio hasta que se activa o se descarta) y «perfil» (interruptor y prueba).
import { useCallback, useEffect, useState } from "react";
import { BellRing, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";

type Estado = "cargando" | "no-soportado" | "sin-configurar" | "bloqueado" | "inactivo" | "activo";

const CLAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const DESCARTADO = "ordo-avisos-descartado";

function aUint8(base64: string) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
}

const leer = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

export function AvisosPush({ modo }: { modo: "invitacion" | "perfil" }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [ocupado, setOcupado] = useState(false);
  const [descartado, setDescartado] = useState(false);
  const [ios, setIos] = useState(false);

  const revisar = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setEstado("no-soportado");
    if (!CLAVE_PUBLICA) return setEstado("sin-configurar");
    if (Notification.permission === "denied") return setEstado("bloqueado");
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    setEstado(sub && Notification.permission === "granted" ? "activo" : "inactivo");
  }, []);

  useEffect(() => {
    setDescartado(leer(DESCARTADO) === "1");
    // iPhone y iPad solo reciben avisos con la app agregada a la pantalla de inicio
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia("(display-mode: standalone)").matches);
    void revisar();
  }, [revisar]);

  async function activar() {
    setOcupado(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
        return;
      }
      const reg = (await navigator.serviceWorker.getRegistration("/")) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }));
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aUint8(CLAVE_PUBLICA!) }));
      const res = await fetch("/api/push/suscribir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON() }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo activar");
      setEstado("activo");
      toast.success("Avisos activados", "Te avisamos en este dispositivo, como máximo una vez por día.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron activar los avisos");
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/desuscribir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setEstado("inactivo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron desactivar los avisos");
    } finally {
      setOcupado(false);
    }
  }

  async function probar() {
    setOcupado(true);
    try {
      const res = await fetch("/api/push/probar", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo mandar la prueba");
      toast.success("Aviso de prueba enviado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo mandar la prueba");
    } finally {
      setOcupado(false);
    }
  }

  // Sin soporte o sin configurar no hay nada que ofrecer; la invitación tampoco insiste si ya se activó o se descartó
  if (estado === "cargando" || estado === "no-soportado" || estado === "sin-configurar") return null;

  if (modo === "invitacion") {
    if (estado !== "inactivo" || descartado) return null;
    return (
      <Card aria-label="Activar avisos" className="gap-0 py-3">
        <CardHeader className="items-center">
          <CardTitle className="flex items-center gap-2 font-heading text-base">
            <BellRing className="size-4 text-primary" /> Activá los avisos en este dispositivo
          </CardTitle>
          <CardDescription>
            {ios
              ? "En iPhone, primero agregá la app a la pantalla de inicio (Compartir → «Agregar a inicio»). Un aviso por día, nunca más."
              : "Te avisamos cuando llega el cofre o falta registrar el día. Un aviso por día, nunca más."}
          </CardDescription>
          <CardAction className="flex items-center gap-1">
            <Button size="sm" disabled={ocupado} onClick={activar}>
              {ocupado ? <Spinner /> : <BellRing className="size-4" />} Activar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                try {
                  localStorage.setItem(DESCARTADO, "1");
                } catch {}
                setDescartado(true);
              }}
            >
              Ahora no
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card aria-labelledby="avisos-push">
      <CardHeader>
        <CardTitle id="avisos-push" className="flex items-center gap-2 font-heading text-lg">
          <BellRing className="size-5 text-primary" /> Avisos en este dispositivo
        </CardTitle>
        <CardDescription>
          {estado === "bloqueado"
            ? "Los avisos están bloqueados en el navegador. Activalos desde los permisos del sitio y volvé acá."
            : ios && estado === "inactivo"
              ? "En iPhone, primero agregá la app a la pantalla de inicio (Compartir → «Agregar a inicio»)."
              : "Cuando llega el cofre o falta registrar el día de los chicos. Como máximo un aviso por día."}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          {estado === "activo" && (
            <Button size="sm" variant="outline" disabled={ocupado} onClick={probar}>
              <Send className="size-4" /> Probar
            </Button>
          )}
          <Switch
            checked={estado === "activo"}
            disabled={ocupado || estado === "bloqueado"}
            onCheckedChange={(v) => (v ? activar() : desactivar())}
            aria-label="Recibir avisos en este dispositivo"
          />
        </CardAction>
      </CardHeader>
    </Card>
  );
}
