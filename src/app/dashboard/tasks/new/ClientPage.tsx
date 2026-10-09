"use client";

import TaskForm from "@/components/dashboard/TaskForm";

export default function NewTaskPage({
  users
}: {
  users: { id: number; nombre: string; rolFamiliar: string; fotoUrl?: string | null }[]
}) {
  return (
    <div className="p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-[var(--surface-container-lowest)] rounded-md border border-[color-mix(in_srgb,var(--outline-variant)_15%,transparent)] overflow-hidden mt-2 elevation-ambient ghost-border">

        <div className="p-6 sm:p-10">
          <TaskForm users={users} />
        </div>
      </div>
    </div>
  );
}
