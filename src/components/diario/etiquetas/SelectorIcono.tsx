"use client";
// Diario (lane 284): elegir el ícono de una etiqueta. Portado de vendor/Daily_You/lib/widgets/icon_picker_dialog.dart (Demizo/Daily_You@7cc237d):
// pestaña de íconos del catálogo (con búsqueda y «sin ícono») y pestaña para tipear un carácter o emoji.
import { useState } from "react";
import { Ban, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { esEmojiUnico, type TipoIcono } from "@/lib/diario/etiquetas";
import { GRUPOS_ICONOS, type IconoClave } from "@/lib/diario/iconos";
import { ICONOS, IconoEtiqueta } from "./iconos";

export type ValorIcono = { icono: string | null; tipoIcono: TipoIcono };

export function SelectorIcono({ valor, color, onElegir, onCerrar }: { valor: ValorIcono; color: string | null; onElegir: (v: ValorIcono) => void; onCerrar: () => void }) {
  const [busqueda, setBusqueda] = useState("");
  const [propio, setPropio] = useState(valor.tipoIcono === "emoji" ? (valor.icono ?? "") : "");
  const q = busqueda.trim().toLowerCase();
  const grupos = GRUPOS_ICONOS.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    claves: (g.claves as readonly string[]).filter((c) => !q || c.includes(q) || g.nombre.toLowerCase().includes(q)),
  })).filter((g) => g.claves.length);
  const propioValido = esEmojiUnico(propio);
  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ícono</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={valor.tipoIcono === "emoji" && valor.icono ? "propio" : "iconos"}>
          <TabsList>
            <TabsTrigger value="iconos">Íconos</TabsTrigger>
            <TabsTrigger value="propio">Emoji o carácter</TabsTrigger>
          </TabsList>
          <TabsContent value="iconos" className="flex flex-col gap-3">
            <Button type="button" variant="outline" onClick={() => onElegir({ icono: null, tipoIcono: "emoji" })}>
              {valor.icono ? <Ban /> : <Check />} Sin ícono
            </Button>
            <Input placeholder="Buscar ícono…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar ícono" />
            {grupos.length === 0 && <p className="py-4 text-center text-muted-foreground">Sin resultados</p>}
            {grupos.map((g) => (
              <section key={g.id}>
                <h3 className="mb-1 text-xs font-medium text-muted-foreground">{g.nombre}</h3>
                <div className="grid grid-cols-6 gap-1">
                  {g.claves.map((c) => {
                    const Cmp = ICONOS[c as IconoClave];
                    const elegido = valor.tipoIcono === "icono" && valor.icono === c;
                    return (
                      <Button key={c} type="button" variant={elegido ? "secondary" : "ghost"} size="icon-lg" aria-label={c} title={c} aria-pressed={elegido} onClick={() => onElegir({ icono: c, tipoIcono: "icono" })}>
                        <Cmp size={22} style={color ? { color } : undefined} />
                      </Button>
                    );
                  })}
                </div>
              </section>
            ))}
          </TabsContent>
          <TabsContent value="propio" className="flex flex-col items-center gap-3 py-2">
            <p className="text-center text-muted-foreground">Escribí o pegá un emoji o un carácter</p>
            <Input
              value={propio}
              onChange={(e) => setPropio(e.target.value)}
              maxLength={16}
              aria-label="Emoji o carácter"
              className="h-20 w-24 text-center text-4xl"
              placeholder="?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && propioValido) onElegir({ icono: propio.trim(), tipoIcono: "emoji" });
              }}
            />
            <IconoEtiqueta icono={propioValido ? propio.trim() : null} tipoIcono="emoji" tamano={28} />
            <Button type="button" disabled={!propioValido} onClick={() => onElegir({ icono: propio.trim(), tipoIcono: "emoji" })}>
              Usar este
            </Button>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
