import {
  Sun,
  Bell,
  Sparkles,
  BookOpen,
  Moon,
  Bed,
  Smile,
  Droplets,
  Shirt,
  Sprout,
  Heart,
  CheckCircle2,
  Flame,
  Award,
  type LucideIcon,
} from "lucide-react";

export const ICONOS_HABITOS: Record<string, LucideIcon> = {
  Sun,
  Bell,
  Sparkles,
  BookOpen,
  Moon,
  Bed,
  Smile,
  Droplets,
  Shirt,
  Sprout,
  Heart,
  CheckCircle2,
  Flame,
  Award,
};

export function HabitoIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONOS_HABITOS[name] ?? Sparkles;
  return <Icon className={className} />;
}
