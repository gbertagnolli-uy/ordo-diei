// Diario (lane 284): catálogo de íconos para etiquetas y categorías de etiquetas.
// Reemplaza al `tag_icon_registry` de Daily You (íconos Material, otra familia) por íconos lucide, que ya usa la app (decisión E7).
// Cada clave se guarda en la base; `src/components/diario/etiquetas/iconos.tsx` la convierte en el componente.

export const GRUPOS_ICONOS = [
  {
    id: "emociones",
    nombre: "Emociones",
    claves: ["smile", "laugh", "frown", "meh", "angry", "circle", "heart", "heart-handshake", "hand-heart", "party-popper", "sparkles", "thumbs-up", "thumbs-down"],
  },
  {
    id: "actividades",
    nombre: "Actividades",
    claves: ["dumbbell", "bike", "footprints", "waves", "trophy", "gamepad-2", "tv", "music", "mic", "camera", "palette", "book-open", "pen-line", "graduation-cap", "laptop", "briefcase"],
  },
  {
    id: "hogar",
    nombre: "Hogar y comida",
    claves: ["house", "utensils", "coffee", "chef-hat", "shopping-cart", "bed", "bath", "sprout", "car", "plane", "scissors"],
  },
  {
    id: "salud",
    nombre: "Salud y energía",
    claves: ["battery-charging", "brain", "moon", "pill", "stethoscope", "thermometer", "activity", "flame", "zap", "droplets"],
  },
  {
    id: "naturaleza",
    nombre: "Clima y naturaleza",
    claves: ["sun", "cloud", "cloud-rain", "cloud-lightning", "snowflake", "rainbow", "wind", "leaf", "flower-2", "tree-pine", "mountain"],
  },
  {
    id: "familia",
    nombre: "Fe y familia",
    claves: ["church", "cross", "users", "baby", "gift", "cake", "star", "bell", "calendar", "flag", "map-pin", "tag", "bookmark", "clock"],
  },
] as const;

export type IconoClave = (typeof GRUPOS_ICONOS)[number]["claves"][number];

export const ICONO_CLAVES: readonly string[] = GRUPOS_ICONOS.flatMap((g) => g.claves);

export const esIconoClave = (v: unknown): v is IconoClave => typeof v === "string" && ICONO_CLAVES.includes(v);
