// Portado de vendor/dovli/packages/editor/src/index.ts (MayankJha0333/dovli@eb453e0)
// Light entry: safe to import anywhere. The heavy editor lives at "@/components/notas/editor/PageEditor"
// so apps can load it lazily (it pulls in BlockNote and Mantine).
export { connectEditor, getBridge, type EditorBridge, type AISelection } from "./bridge";
export { useIsDark } from "./useIsDark";
export type { DovliEditor } from "./schema";
export * from "./format";
export type { FontId } from "./blocks/textStyles";
export * from "./findReplace";
