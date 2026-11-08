// Diario (lane 284): ícono de una etiqueta o categoría de etiquetas. Portado de vendor/Daily_You/lib/widgets/tag_icon_glyph.dart (Demizo/Daily_You@7cc237d).
// Un ícono es un emoji tipeado o una clave del catálogo (src/lib/diario/iconos.ts); sin ícono se muestra el de reemplazo.
import type { ComponentType } from "react";
import {
  Activity, Angry, Baby, Bath, BatteryCharging, Bed, Bell, Bike, BookOpen, Bookmark, Brain, Briefcase, Cake, Calendar, Camera, Car, ChefHat, Church, Circle, Clock, Cloud,
  CloudLightning, CloudRain, Coffee, Cross, Droplets, Dumbbell, Flag, Flame, Flower2, Footprints, Frown, Gamepad2, Gift, GraduationCap, HandHeart, Heart,
  HeartHandshake, House, Laptop, Laugh, Leaf, type LucideProps, MapPin, Meh, Mic, Moon, Mountain, Music, PartyPopper, Palette, PenLine, Pill, Plane,
  Rainbow, Scissors, ShoppingCart, Smile, Snowflake, Sparkles, Sprout, Star, Stethoscope, Sun, Tag, Thermometer, ThumbsDown, ThumbsUp, TreePine, Trophy, Tv,
  Users, Utensils, Waves, Wind, Zap,
} from "lucide-react";
import type { IconoClave } from "@/lib/diario/iconos";
import type { TipoIcono } from "@/lib/diario/etiquetas";

export const ICONOS: Record<IconoClave, ComponentType<LucideProps>> = {
  smile: Smile, laugh: Laugh, frown: Frown, meh: Meh, angry: Angry, circle: Circle, heart: Heart, "heart-handshake": HeartHandshake, "hand-heart": HandHeart,
  "party-popper": PartyPopper, sparkles: Sparkles, "thumbs-up": ThumbsUp, "thumbs-down": ThumbsDown,
  dumbbell: Dumbbell, bike: Bike, footprints: Footprints, waves: Waves, trophy: Trophy, "gamepad-2": Gamepad2, tv: Tv, music: Music, mic: Mic, camera: Camera,
  palette: Palette, "book-open": BookOpen, "pen-line": PenLine, "graduation-cap": GraduationCap, laptop: Laptop, briefcase: Briefcase,
  house: House, utensils: Utensils, coffee: Coffee, "chef-hat": ChefHat, "shopping-cart": ShoppingCart, bed: Bed, bath: Bath, sprout: Sprout, car: Car,
  plane: Plane, scissors: Scissors,
  "battery-charging": BatteryCharging, brain: Brain, moon: Moon, pill: Pill, stethoscope: Stethoscope, thermometer: Thermometer, activity: Activity, flame: Flame,
  zap: Zap, droplets: Droplets,
  sun: Sun, cloud: Cloud, "cloud-rain": CloudRain, "cloud-lightning": CloudLightning, snowflake: Snowflake, rainbow: Rainbow, wind: Wind, leaf: Leaf,
  "flower-2": Flower2, "tree-pine": TreePine, mountain: Mountain,
  church: Church, cross: Cross, users: Users, baby: Baby, gift: Gift, cake: Cake, star: Star, bell: Bell, calendar: Calendar, flag: Flag, "map-pin": MapPin,
  tag: Tag, bookmark: Bookmark, clock: Clock,
};

export function IconoEtiqueta({
  icono,
  tipoIcono,
  reemplazo: Reemplazo = Tag,
  color,
  tamano = 16,
}: {
  icono: string | null;
  tipoIcono: TipoIcono;
  reemplazo?: ComponentType<LucideProps>;
  color?: string | null;
  tamano?: number;
}) {
  const estilo = color ? { color } : undefined;
  if (icono && tipoIcono === "icono") {
    const Cmp = ICONOS[icono as IconoClave];
    if (Cmp) return <Cmp aria-hidden size={tamano} style={estilo} className="shrink-0" />;
  }
  if (icono && tipoIcono === "emoji") {
    return (
      <span aria-hidden className="shrink-0 leading-none" style={{ fontSize: tamano }}>
        {icono}
      </span>
    );
  }
  return <Reemplazo aria-hidden size={tamano} style={estilo} className="shrink-0" />;
}
