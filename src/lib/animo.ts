// Estados de ánimo y su puntaje de felicidad (0 = nada feliz, 100 = muy feliz), usado por el gráfico del perfil.
export const MOODS = [
  { key: "feliz", emoji: "😁", label: "Feliz", puntaje: 95 },
  { key: "fiestero", emoji: "🥳", label: "Fiestero", puntaje: 95 },
  { key: "inspirado", emoji: "😍", label: "Inspirado", puntaje: 90 },
  { key: "enamorado", emoji: "🥰", label: "Enamorado", puntaje: 90 },
  { key: "contento", emoji: "😊", label: "Contento", puntaje: 85 },
  { key: "agradecido", emoji: "🥹", label: "Agradecido", puntaje: 85 },
  { key: "tranquilo", emoji: "😌", label: "Tranquilo", puntaje: 70 },
  { key: "serio", emoji: "🧐", label: "Serio", puntaje: 55 },
  { key: "neutral", emoji: "😐", label: "Neutral", puntaje: 50 },
  { key: "aburrido", emoji: "😑", label: "Aburrido", puntaje: 40 },
  { key: "cansado", emoji: "🥱", label: "Cansado", puntaje: 35 },
  { key: "ofendido", emoji: "😒", label: "Ofendido", puntaje: 30 },
  { key: "preocupado", emoji: "😟", label: "Preocupado", puntaje: 25 },
  { key: "asustado", emoji: "😨", label: "Asustado", puntaje: 20 },
  { key: "estresado", emoji: "😫", label: "Estresado", puntaje: 15 },
  { key: "triste", emoji: "😔", label: "Triste", puntaje: 15 },
  { key: "enfermo", emoji: "🤢", label: "Enfermo", puntaje: 15 },
  { key: "frustrado", emoji: "😤", label: "Frustrado", puntaje: 10 },
  { key: "enojado", emoji: "🤬", label: "Enojado", puntaje: 10 },
] as const;

export const MOOD_POR_KEY = Object.fromEntries(MOODS.map((m) => [m.key, m])) as Record<string, (typeof MOODS)[number]>;
