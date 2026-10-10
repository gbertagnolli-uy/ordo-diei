import {
  Award,
  Flame,
  Target,
  Trophy,
  Star,
  Shield,
  Crown,
  Zap,
  Sparkles,
  TrendingUp,
  CalendarCheck,
  ShieldCheck,
  Mountain,
  Heart,
  Moon,
  Sun,
  Home,
  RefreshCw,
  Layers,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame,
  Target,
  Award,
  Trophy,
  Star,
  Shield,
  Crown,
  Zap,
  Sparkles,
  TrendingUp,
  CalendarCheck,
  ShieldCheck,
  Mountain,
  Heart,
  Moon,
  Sun,
  Home,
  RefreshCw,
  Layers,
};

export function LogroIcon({ name, className = "size-4" }: { name: string; className?: string }) {
  const IconComponent = ICONS[name] ?? Trophy;
  return <IconComponent className={className} />;
}
