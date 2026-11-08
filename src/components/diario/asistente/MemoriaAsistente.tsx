"use client";
// Asistente del diario (lane 299): pantalla de la memoria a largo plazo. Lo que el asistente guardó sobre la persona.
// Portado de vendor/moodiary/packages/feature/moodiary_assistant/lib/src/presentation/memory_list_page.dart (ZhuJHua/moodiary@2c552dd).
import { useState } from "react";
import { Brain, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIAS_HECHO,
  MAX_TEXTO_HECHO,
  ROTULO_CATEGORIA,
  ROTULO_FUENTE,
  UMBRAL_BUSQUEDA,
  filtrarHechos,
  ordenarHechos,
  type CategoriaHecho,
  type Hecho,
} from "@/lib/diario/asistente/memoria";
import { Panel } from "./ProveedoresAsistente";

export function MemoriaAsistente({
  hechos,
  onVolver,
  onEditar,
  onOlvidar,
  onOlvidarTodo,
}: {
  hechos: Hecho[];
  onVolver: () => void;
  onEditar: (id: string, cambios: { texto: string; categoria: CategoriaHecho }) => void;
  onOlvidar: (id: string) => void;
  onOlvidarTodo: () => void;
}) {
  const [consulta, setConsulta] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaHecho>("fact");

  const filtrados = hechos.length > UMBRAL_BUSQUEDA ? filtrarHechos(hechos, consulta) : hechos;
  const ordenados = ordenarHechos(filtrados);

  function empezarEdicion(h: Hecho) {
    setEditandoId(h.id);
    setTexto(h.texto);
    setCategoria(h.categoria);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setTexto("");
  }

  function guardarEdicion(id: string) {
    const limpio = texto.trim();
    if (!limpio) return;
    onEditar(id, { texto: limpio, categoria });
    setEditandoId(null);
    setTexto("");
  }

  return (
    <Panel titulo="Lo que recuerda el asistente" onVolver={onVolver}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          Lo que el asistente guardó sobre vos. Vive solo en este navegador. Cuando el asistente lo usa en una conversación, viaja al proveedor de modelos que elegiste, como el resto de lo que hablan.
        </p>

        {hechos.length > 0 && (
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (window.confirm("Se borra todo lo que el asistente guardó. No se puede deshacer.")) onOlvidarTodo();
              }}
            >
              <Trash2 /> Borrar todo
            </Button>
          </div>
        )}

        {hechos.length === 0 ? (
          <div className="m-auto flex max-w-sm flex-col items-center gap-3 py-12 text-center">
            <Brain className="size-8 text-muted-foreground" aria-hidden />
            <h4 className="text-base font-semibold">Todavía no guardó nada</h4>
            <p className="text-xs text-muted-foreground">Decile «acordate de que…» al asistente en un chat, o contale un hábito, y lo guarda.</p>
          </div>
        ) : (
          <>
            {hechos.length > UMBRAL_BUSQUEDA && (
              <Input
                type="search"
                placeholder="Buscar recuerdos"
                aria-label="Buscar recuerdos"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
              />
            )}

            {ordenados.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Ningún recuerdo coincide.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {ordenados.map((h) => (
                  <div key={h.id} className="rounded-xl border p-3">
                    {editandoId === h.id ? (
                      <div className="flex flex-col gap-3">
                        <Textarea
                          rows={3}
                          maxLength={MAX_TEXTO_HECHO}
                          value={texto}
                          onChange={(e) => setTexto(e.target.value)}
                        />
                        <NativeSelect
                          value={categoria}
                          onChange={(e) => setCategoria(e.target.value as CategoriaHecho)}
                        >
                          {CATEGORIAS_HECHO.map((c) => (
                            <NativeSelectOption key={c} value={c}>
                              {ROTULO_CATEGORIA[c]}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={cancelarEdicion}>
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!texto.trim()}
                            onClick={() => guardarEdicion(h.id)}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <p className="text-sm whitespace-pre-wrap">{h.texto}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                              {ROTULO_CATEGORIA[h.categoria]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(h.actualizadoEn).toLocaleDateString("es-UY", { day: "numeric", month: "short" })}
                              {h.fuente ? ` · ${ROTULO_FUENTE[h.fuente]}` : ""}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Editar recuerdo"
                            onClick={() => empezarEdicion(h)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Olvidar recuerdo"
                            onClick={() => {
                              if (window.confirm(`«${h.texto}» se borra para siempre y el asistente no la va a recordar más.`)) {
                                onOlvidar(h.id);
                              }
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
