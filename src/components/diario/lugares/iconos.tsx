// Diario (lane 296): íconos de lugar y de clima. moodiary usa la fuente `qweather-icons` y íconos propios (`place_icon.dart`, `qweather_icon.dart`);
// acá se dibujan con lucide, agrupados por familia (ver lib/diario/clima.ts `grupoDeClima`).
import type { ComponentType } from "react";
import {
  Building2, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Coffee, Dumbbell, Hospital, House, type LucideProps, MapPin,
  Moon, Plane, School, Sun, ThermometerSnowflake, ThermometerSun, Trees,
} from "lucide-react";
import { grupoDeClima, type GrupoClima } from "@/lib/diario/clima";
import { colorDeIcono, colorSobre, esIconoLugar, type IconoLugar } from "@/lib/diario/lugares";
import { cn } from "@/lib/utils";

const ICONOS_DE_LUGAR: Record<IconoLugar, ComponentType<LucideProps>> = {
  house: House,
  "building-2": Building2,
  school: School,
  coffee: Coffee,
  dumbbell: Dumbbell,
  trees: Trees,
  hospital: Hospital,
  plane: Plane,
};

const ICONOS_DE_CLIMA: Record<GrupoClima, ComponentType<LucideProps>> = {
  sol: Sun,
  parcial: CloudSun,
  nublado: Cloud,
  luna: Moon,
  lunaNube: CloudMoon,
  llovizna: CloudDrizzle,
  lluvia: CloudRain,
  tormenta: CloudLightning,
  nieve: CloudSnow,
  niebla: CloudFog,
  calor: ThermometerSun,
  frio: ThermometerSnowflake,
  desconocido: Cloud,
};

/** El ícono del clima según su código (QWeather). */
export function IconoClima({ codigo, tamano = 16, className }: { codigo: string; tamano?: number; className?: string }) {
  const Cmp = ICONOS_DE_CLIMA[grupoDeClima(codigo)];
  return <Cmp aria-hidden size={tamano} className={cn("shrink-0", className)} />;
}

/** El ícono de un lugar, solo (sin fondo); sin ícono, el pin. */
export function IconoDeLugar({ icono, tamano = 16, className }: { icono: string | null; tamano?: number; className?: string }) {
  const Cmp = esIconoLugar(icono) ? ICONOS_DE_LUGAR[icono] : MapPin;
  return <Cmp aria-hidden size={tamano} className={cn("shrink-0", className)} />;
}

/** moodiary `PlaceIcon`: el ícono sobre un círculo del color que le toca (el neutro del tema si no tiene). */
export function InsigniaDeLugar({ icono, tamano = 36 }: { icono: string | null; tamano?: number }) {
  const color = colorDeIcono(icono);
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full", !color && "bg-muted text-muted-foreground")}
      style={{ width: tamano, height: tamano, ...(color ? { backgroundColor: color, color: colorSobre(color) } : {}) }}
    >
      <IconoDeLugar icono={icono} tamano={Math.round(tamano * 0.5)} />
    </span>
  );
}
