// Propio de Ordo: íconos Lucide de las historias sociales por nombre (los nombres válidos están en lib/homeschooling/neuro.ts).
import { Bed, BookOpen, Bus, Car, Check, Clock, Hand, Heart, Home, School, ShoppingBag, Smile, Stethoscope, Sun, Users, Utensils, type LucideIcon } from "lucide-react";

const ICONOS: Record<string, LucideIcon> = { Sun, Bed, Utensils, School, Car, Home, Users, Heart, Smile, ShoppingBag, Stethoscope, BookOpen, Clock, Check, Bus, Hand };

export const iconoHistoria = (nombre: string): LucideIcon => ICONOS[nombre] ?? Check;
