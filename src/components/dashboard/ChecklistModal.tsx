"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";

interface ChecklistItem {
  id: number;
  texto: string;
  completado: boolean;
  orden: number;
}

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  taskTitle: string;
  onComplete?: () => void; // Called when checklist reaches 100%
}

export function ChecklistModal({ isOpen, onClose, taskId, taskTitle, onComplete }: ChecklistModalProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/tasks/${taskId}/checklist`)
        .then(res => res.json())
        .then(data => {
          if (data.items) {
            setItems(data.items.sort((a: ChecklistItem, b: ChecklistItem) => a.orden - b.orden));
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, taskId]);

  const toggleItem = async (itemId: number, currentState: boolean) => {
    setToggling(itemId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", itemId, completado: !currentState })
      });
      if (res.ok) {
        const data = await res.json();
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, completado: !currentState } : i));
        if (data.allCompleted && onComplete) {
          onComplete();
        }
      }
    } catch {} finally {
      setToggling(null);
    }
  };

  const completedCount = items.filter(i => i.completado).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Checklist: ${taskTitle}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Progress value={percentage} className={`h-2 flex-1 ${percentage >= 100 ? "[&>[data-slot=progress-indicator]]:bg-[var(--success)]" : ""}`} />
          <span className={`text-sm font-medium tabular-nums ${percentage >= 100 ? 'text-[var(--success)]' : 'text-muted-foreground'}`}>
            {completedCount}/{totalCount} ({percentage}%)
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyDescription>No hay items en este checklist.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="max-h-[50vh] gap-2 overflow-y-auto">
            {items.map(item => (
              <Item
                key={item.id}
                asChild
                variant="outline"
                size="sm"
                className={item.completado ? "border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_6%,transparent)]" : "hover:border-primary/40"}
              >
                <button onClick={() => toggleItem(item.id, item.completado)} disabled={toggling === item.id} className="text-left">
                  <ItemMedia>
                    {toggling === item.id ? (
                      <Spinner className="size-4 text-primary" />
                    ) : (
                      <Checkbox checked={item.completado} tabIndex={-1} className="pointer-events-none data-[state=checked]:border-[var(--success)] data-[state=checked]:bg-[var(--success)]" />
                    )}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className={item.completado ? "text-muted-foreground line-through" : ""}>{item.texto}</ItemTitle>
                  </ItemContent>
                </button>
              </Item>
            ))}
          </ItemGroup>
        )}

        {percentage >= 100 && (
          <div className="rounded-lg border border-[color-mix(in_srgb,var(--success)_25%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] p-4 text-center">
            <span className="text-2xl">🎉</span>
            <p className="mt-1 font-medium text-[var(--success)]">¡Checklist completado! Ya podés finalizar la tarea.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
