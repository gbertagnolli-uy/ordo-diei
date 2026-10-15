import React from "react";
import {
  Sun,
  BedDouble,
  Church,
  Utensils,
  BookOpen,
  Coffee,
  PauseCircle,
  Smile,
  Sparkles,
  GraduationCap,
  Bell,
  Activity,
  Palette,
  BookMarked,
  Home,
  Bath,
  Moon,
  Clock,
  Heart,
  Droplets,
  Trees,
  Music,
  Flame,
  Star,
  CheckCircle2,
  LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Sun,
  BedDouble,
  Church,
  Utensils,
  BookOpen,
  Coffee,
  PauseCircle,
  Smile,
  Sparkles,
  GraduationCap,
  Bell,
  Activity,
  Palette,
  BookMarked,
  Home,
  Bath,
  Moon,
  Clock,
  Heart,
  Droplets,
  Trees,
  Music,
  Flame,
  Star,
  CheckCircle2,
};

export function IconoRutina({
  nombre,
  className = "size-5",
}: {
  nombre: string;
  className?: string;
}) {
  const IconComponent = ICON_MAP[nombre] || Clock;
  return <IconComponent className={className} />;
}
