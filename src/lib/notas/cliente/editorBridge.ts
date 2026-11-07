// Portado de vendor/dovli/apps/web/src/lib/editorBridge.ts (MayankJha0333/dovli@eb453e0)
// Adaptado a Ordo (lane 271): las imágenes van por /api/upload (D4) para que viajen entre dispositivos;
// sin Excalidraw, IA, selector de páginas ni vista de etiquetas (fuera de la v1).
// Plugs the web store into the shared editor package, so the editor never imports app code.
import { connectEditor } from "@/components/notas/editor/bridge";
import { toast } from "@/components/notas/ui";
import { store, useStore } from "./store";

async function subirImagen(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch("/api/upload", { method: "POST", body: form });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || typeof d.url !== "string") throw new Error(d.error ?? "No se pudo subir el archivo");
  return d.url;
}

connectEditor({
  usePages: (select) => useStore((s) => select(s.pages)),
  getPages: () => store.get().pages,
  openPage: (id) => store.navigate({ name: "page", id }),
  createPage: (input) => store.createPage(input),
  saveBlocks: (pageId, blocks) => store.updatePage(pageId, { blocks }),
  uploadFile: async (file) => {
    try {
      return await subirImagen(file);
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo agregar ese archivo.", { tone: "danger" });
      throw err;
    }
  },
  notify: (message) => toast(message),
});
