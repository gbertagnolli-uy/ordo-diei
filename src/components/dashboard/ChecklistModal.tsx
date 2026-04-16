"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

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
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[var(--surface-container-high)] h-3 rounded-sm overflow-hidden ghost-border">
            <div 
              className={`h-full transition-all duration-500 ${percentage >= 100 ? 'bg-[var(--success)]' : 'bg-[var(--primary)]'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={`text-sm font-title font-bold ${percentage >= 100 ? 'text-[var(--success)]' : 'text-[var(--on-surface-variant)]'}`}>
            {completedCount}/{totalCount} ({percentage}%)
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-[var(--on-surface-variant)] font-body">
            No hay items en este checklist.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id, item.completado)}
                disabled={toggling === item.id}
                className={`flex items-center gap-3 p-3 rounded-md border-2 text-left transition-all ${
                  item.completado 
                    ? 'border-[color-mix(in-srgb,var(--success)_20%,transparent)] bg-[color-mix(in-srgb,var(--success)_5%,transparent)]' 
                    : 'border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] bg-[var(--surface-container-low)] hover:border-[color-mix(in-srgb,var(--primary)_30%,transparent)]'
                }`}
              >
                {toggling === item.id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)] shrink-0" />
                ) : item.completado ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[var(--outline)] shrink-0" />
                )}
                <span className={`flex-1 text-sm font-body font-medium ${item.completado ? 'line-through text-[var(--on-surface-variant)]' : 'text-[var(--on-surface)]'}`}>
                  {item.texto}
                </span>
              </button>
            ))}
          </div>
        )}

        {percentage >= 100 && (
          <div className="bg-[color-mix(in-srgb,var(--success)_5%,transparent)] border border-[color-mix(in-srgb,var(--success)_15%,transparent)] rounded-md p-4 text-center">
            <span className="text-2xl">🎉</span>
            <p className="text-[var(--success)] font-headline font-bold mt-1">¡Checklist completado! Ya podés finalizar la tarea.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
