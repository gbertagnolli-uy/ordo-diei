"use client";

import { useState } from "react";

const MOODS = [
  { key: "feliz", emoji: "😁", label: "Feliz" },
  { key: "inspirado", emoji: "😍", label: "Inspirado" },
  { key: "contento", emoji: "😊", label: "Contento" },
  { key: "neutral", emoji: "😐", label: "Neutral" },
  { key: "cansado", emoji: "🥱", label: "Cansado" },
  { key: "triste", emoji: "😔", label: "Triste" },
  { key: "preocupado", emoji: "😟", label: "Preocupado" },
  { key: "enojado", emoji: "🤬", label: "Enojado" },
  { key: "enfermo", emoji: "🤢", label: "Enfermo" },
  { key: "fiestero", emoji: "🥳", label: "Fiestero" },
  { key: "asustado", emoji: "😨", label: "Asustado" },
  { key: "aburrido", emoji: "😑", label: "Aburrido" },
  { key: "agradecido", emoji: "🥹", label: "Agradecido" },
  { key: "serio", emoji: "🧐", label: "Serio" },
  { key: "tranquilo", emoji: "😌", label: "Tranquilo" },
  { key: "ofendido", emoji: "😒", label: "Ofendido" },
  { key: "enamorado", emoji: "🥰", label: "Enamorado" },
];

interface MoodSelectorProps {
  currentMood?: string | null;
  isOwnProfile?: boolean;
}

export function MoodSelector({ currentMood, isOwnProfile = false }: MoodSelectorProps) {
  const [selected, setSelected] = useState<string | null>(
    currentMood ? (MOODS.find(m => m.emoji === currentMood)?.key || null) : null
  );
  const [loading, setLoading] = useState(false);

  const selectMood = async (key: string) => {
    if (!isOwnProfile || loading) return;
    
    const newMood = selected === key ? null : key;
    setSelected(newMood);
    setLoading(true);

    try {
      await fetch("/api/users/mood", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: newMood })
      });
    } catch {
      // Revert on error
      setSelected(selected);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwnProfile) {
    // Just show current mood (read-only)
    if (!currentMood) return null;
    return <span className="text-2xl">{currentMood}</span>;
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-headline font-bold text-[var(--on-surface)]">¿Cómo te sentís hoy?</h3>
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
        {MOODS.map(mood => (
          <button
            key={mood.key}
            onClick={() => selectMood(mood.key)}
            disabled={loading}
            title={mood.label}
            className={`flex flex-col items-center gap-1 p-2 rounded-md border text-center transition-all ${
              selected === mood.key 
                ? 'border-[var(--primary)] bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] elevation-ambient scale-110' 
                : 'border-transparent hover:border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] hover:bg-[var(--surface-container-low)]'
            }`}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-[10px] font-title font-bold text-[var(--on-surface-variant)] truncate w-full uppercase tracking-wider">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { MOODS };
