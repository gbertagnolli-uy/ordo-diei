"use client";
// Diario (lane 290): quién sabe abrir una entrada enlazada. Lo provee la pantalla del diario (salta al día de la entrada)
// y lo usan las entradas que se muestran en solo lectura. Portado de la idea de `link-intercept.ts` (`linkTap`) de vendor/moodiary/editor (ZhuJHua/moodiary@2c552dd).
import { createContext, useContext } from "react";

export type AbrirEntrada = (id: number) => void;

const Contexto = createContext<AbrirEntrada | null>(null);
export const ProveedorEnlaces = Contexto.Provider;
/** `null` si no hay pantalla que sepa abrir entradas (el enlace se ve, pero no navega). */
export const useAbrirEntrada = () => useContext(Contexto);

// Lane 295: quién sabe abrir el grafo local de una entrada (moodiary `DiaryGraphRoute`). Lo provee la pantalla del diario.
const ContextoGrafo = createContext<AbrirEntrada | null>(null);
export const ProveedorGrafo = ContextoGrafo.Provider;
/** `null` si no hay pantalla que sepa mostrar el grafo (el botón no aparece). */
export const useAbrirGrafo = () => useContext(ContextoGrafo);
