"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOODS } from "@/lib/animo";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";


interface MoodSelectorProps {
  currentMood?: string | null;
  isOwnProfile?: boolean;
}

export function MoodSelector({ currentMood, isOwnProfile = false }: MoodSelectorProps) {
  const [selected, setSelected] = useState<string | null>(
    currentMood ? (MOODS.find(m => m.emoji === currentMood)?.key || null) : null
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const selectMood = async (key: string) => {
    if (!isOwnProfile || loading) return;
    
    const newMood = selected === key ? null : key;
    setSelected(newMood);
    setLoading(true);

    try {
      const res = await fetch("/api/users/mood", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: newMood })
      });
      if (!res.ok) throw new Error("mood");
      router.refresh();
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
    <ToggleGroup type="single" value={selected ?? ""} className="grid w-full grid-cols-4 gap-2 sm:grid-cols-6" aria-label="Estado de ánimo">
      {MOODS.map(mood => (
        <ToggleGroupItem
          key={mood.key}
          value={mood.key}
          onClick={() => selectMood(mood.key)}
          disabled={loading}
          title={mood.label}
          variant="outline"
          className="h-auto flex-col gap-1 rounded-lg! border-transparent px-1 py-2 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
        >
          <span className="text-2xl leading-none">{mood.emoji}</span>
          <span className="w-full truncate text-[10px] font-medium text-muted-foreground">{mood.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

