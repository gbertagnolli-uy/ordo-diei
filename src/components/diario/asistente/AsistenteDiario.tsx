"use client";
// Asistente del diario (lane 298): pantalla del chat con el asistente de IA del diario personal. Portado de vendor/moodiary/packages/feature/moodiary_assistant
// (ZhuJHua/moodiary@2c552dd): `assistant_page.dart` (el chat, el aviso de privacidad, el estado vacío, el compositor), `assistant_setting_page.dart`, la lista de sesiones
// y los proveedores. El motor (bucle del agente, herramientas, permisos) está en src/lib/diario/asistente; acá solo se muestra.
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, History, Plus, Send, Settings, ShieldCheck, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { MARCA_CONTINUAR } from "@/lib/diario/asistente/herramientas";
import { tituloVisible } from "@/lib/diario/asistente/sesiones";
import { toast } from "@/lib/toast";
import { AjustesAsistente } from "./AjustesAsistente";
import { BurbujaAsistente, BurbujaUsuario } from "./BurbujaChat";
import { ListaSesiones } from "./ListaSesiones";
import { Panel, ProveedoresAsistente } from "./ProveedoresAsistente";
import { TarjetaAprobacion } from "./TarjetaAprobacion";
import { useAsistente } from "./useAsistente";

type Pantalla = "chat" | "sesiones" | "ajustes" | "proveedores";

const SUGERENCIAS = ["¿Cómo estuve de ánimo este mes?", "Resumime lo que escribí esta semana", "Buscá mis entradas sobre la familia", "Escribí una entrada de hoy: "];

function saludo(): string {
  const h = new Date().getHours();
  return h < 6 ? "Buenas noches" : h < 13 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
}

function AvisoDePrivacidad({ onAceptar, onVolver }: { onAceptar: () => void; onVolver: () => void }) {
  return (
    <Panel titulo="Antes de empezar" onVolver={onVolver}>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-start gap-3 rounded-xl border p-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="flex flex-col gap-2">
            <p>
              El asistente puede leer y escribir en <strong>tu diario personal</strong> (nunca en el familiar). Para responder, el texto de las entradas que lee viaja al proveedor de modelos que vos elijas (Anthropic, OpenAI, etc.) con tu propia
              clave, y se rige por las políticas de ese proveedor.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Ordo Diei no guarda tus conversaciones ni tu clave: quedan solo en este navegador.</li>
              <li>Cada pregunta pasa por el servidor de Ordo Diei para llegar al proveedor, y ahí no se registra.</li>
              <li>Podés elegir que el asistente te pida permiso antes de crear, editar o borrar. Borrar una entrada no se puede deshacer.</li>
              <li>Un asistente de IA puede equivocarse: revisá lo que escribe o cambia en tu diario.</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onVolver}>
            No, volver
          </Button>
          <Button type="button" onClick={onAceptar}>
            Entiendo y acepto
          </Button>
        </div>
      </div>
    </Panel>
  );
}

export function AsistenteDiario({ usuarioId, onVolver }: { usuarioId: number; onVolver: () => void }) {
  const a = useAsistente(usuarioId);
  const [pantalla, setPantalla] = useState<Pantalla>("chat");
  const [texto, setTexto] = useState("");
  const lista = useRef<HTMLDivElement>(null);
  const alFinal = useRef(true);

  const turnos = (a.activa?.turnos ?? []).filter((t) => !(t.deUsuario && t.texto === MARCA_CONTINUAR));
  const enVivo = a.vivo && a.vivo.sesionId === a.activaId ? a.vivo.turno : null;
  const ultimo = turnos.at(-1);
  const esperando = new Set(a.aprobaciones.map((x) => x.id));
  const sinConfigurar = !a.proveedor || !a.claves[a.proveedor.id];

  useEffect(() => {
    const el = lista.current;
    if (el && alFinal.current) el.scrollTop = el.scrollHeight;
  }, [turnos.length, enVivo, a.aprobaciones.length, pantalla]);

  function enviar(t: string) {
    const aviso = a.enviar(t);
    if (aviso) toast.error(aviso);
    else {
      setTexto("");
      alFinal.current = true;
    }
  }

  function aviso(m: string | null) {
    if (m) toast.error(m);
  }

  if (!a.ajustes.acepto) return <AvisoDePrivacidad onVolver={onVolver} onAceptar={() => a.guardarAjustes({ acepto: true })} />;

  if (pantalla === "proveedores")
    return (
      <ProveedoresAsistente
        proveedores={a.proveedores}
        claves={a.claves}
        activoId={a.proveedor?.id ?? null}
        onVolver={() => setPantalla(a.proveedores.length ? "ajustes" : "chat")}
        onGuardar={a.guardarProveedor}
        onBorrar={a.borrarProveedor}
        onActivar={(id) => a.guardarAjustes({ proveedorActivo: id })}
      />
    );

  if (pantalla === "ajustes")
    return <AjustesAsistente ajustes={a.ajustes} cantidadDeSesiones={a.sesiones.length} onVolver={() => setPantalla("chat")} onGuardar={a.guardarAjustes} onProveedores={() => setPantalla("proveedores")} onBorrarTodo={a.borrarTodo} />;

  if (pantalla === "sesiones")
    return (
      <ListaSesiones
        sesiones={a.sesiones}
        activaId={a.activaId}
        onVolver={() => setPantalla("chat")}
        onAbrir={(id) => {
          a.abrirSesion(id);
          setPantalla("chat");
        }}
        onNueva={() => {
          a.nuevaSesion();
          setPantalla("chat");
        }}
        onBorrar={a.borrarSesion}
      />
    );

  return (
    <div className="flex h-[calc(100dvh-9rem)] min-h-[28rem] flex-col gap-3 sm:h-[calc(100dvh-8rem)]">
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="Volver al diario" onClick={onVolver}>
          <ArrowLeft />
        </Button>
        <h2 className="flex min-w-0 flex-1 items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5 shrink-0" aria-hidden />
          <span className="truncate">{a.activa ? tituloVisible(a.activa) : "Asistente"}</span>
        </h2>
        <Button type="button" variant="ghost" size="icon" aria-label="Conversación nueva" disabled={a.ocupado} onClick={a.nuevaSesion}>
          <Plus />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Conversaciones" onClick={() => setPantalla("sesiones")}>
          <History />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Ajustes del asistente" onClick={() => setPantalla("ajustes")}>
          <Settings />
        </Button>
      </div>

      {sinConfigurar ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center">
          <Sparkles className="size-8 text-muted-foreground" aria-hidden />
          <p className="max-w-sm text-sm text-muted-foreground">
            {a.proveedor ? `Falta la clave de ${a.proveedor.nombre}.` : "Para usar el asistente, conectá un proveedor de modelos con tu propia clave."}
          </p>
          <Button type="button" onClick={() => setPantalla("proveedores")}>
            {a.proveedor ? "Poner la clave" : "Conectar un proveedor"}
          </Button>
        </div>
      ) : (
        <>
          <div
            ref={lista}
            className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-xl border p-3"
            aria-live="polite"
            onScroll={(e) => {
              const el = e.currentTarget;
              alFinal.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
          >
            {!turnos.length && !enVivo ? (
              <div className="m-auto flex max-w-md flex-col items-center gap-3 py-8 text-center">
                <Sparkles className="size-8 text-primary" aria-hidden />
                <h3 className="text-xl font-semibold">{saludo()}</h3>
                <p className="text-sm text-muted-foreground">Preguntame por lo que escribiste, pedime que escriba una entrada o que ordene tus categorías.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGERENCIAS.map((s) => (
                    <button key={s} type="button" className="rounded-full border px-3 py-1.5 text-xs hover:bg-muted" onClick={() => (s.endsWith(": ") ? setTexto(s) : enviar(s))}>
                      {s.trim()}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {turnos.map((t) =>
                  t.deUsuario ? (
                    <BurbujaUsuario key={t.id} turno={t} />
                  ) : (
                    <BurbujaAsistente
                      key={t.id}
                      turno={t}
                      enCurso={false}
                      esperandoPermiso={esperando}
                      puedeRegenerar={t === ultimo && !a.ocupado}
                      onRegenerar={() => aviso(a.regenerar())}
                      onContinuar={() => aviso(a.continuar())}
                    />
                  ),
                )}
                {enVivo && <BurbujaAsistente turno={enVivo} enCurso esperandoPermiso={esperando} puedeRegenerar={false} onRegenerar={() => {}} onContinuar={() => {}} />}
              </>
            )}
            {a.aprobaciones.map((p) => (
              <TarjetaAprobacion key={p.id} nombre={p.nombre} args={p.args} nivel={p.nivel} onResolver={(ok) => a.resolverAprobacion(p.id, ok)} />
            ))}
          </div>

          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!a.ocupado) enviar(texto);
            }}
          >
            {a.proveedor && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="shrink-0">{a.proveedor.nombre}</span>
                <NativeSelect
                  aria-label="Modelo"
                  className="h-7 max-w-64 text-xs"
                  value={a.activa?.modelo || a.proveedor.modelo}
                  disabled={a.ocupado}
                  onChange={(e) => a.proveedor && a.elegirModelo(a.proveedor.id, e.target.value)}
                >
                  {[...new Set([a.activa?.modelo || a.proveedor.modelo, ...a.modelosDisponibles])].filter(Boolean).map((m) => (
                    <NativeSelectOption key={m} value={m}>
                      {m}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                value={texto}
                rows={1}
                maxLength={20_000}
                placeholder="Escribile al asistente…"
                aria-label="Mensaje para el asistente"
                className="max-h-40 min-h-10 flex-1 resize-none"
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    if (!a.ocupado) enviar(texto);
                  }
                }}
              />
              {a.ocupado ? (
                <Button type="button" size="icon-lg" variant="outline" aria-label="Detener" onClick={a.detener}>
                  <Square />
                </Button>
              ) : (
                <Button type="submit" size="icon-lg" aria-label="Enviar" disabled={!texto.trim()}>
                  <Send />
                </Button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}
