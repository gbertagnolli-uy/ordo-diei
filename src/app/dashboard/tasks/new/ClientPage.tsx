"use client";

import TaskForm from "@/components/dashboard/TaskForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewTaskPage({
  users
}: {
  users: { id: number; nombre: string; rolFamiliar: string; fotoUrl?: string | null }[]
}) {
  return (
    <div className="min-h-screen bg-[var(--surface)] p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-[var(--surface-container-lowest)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] overflow-hidden mt-10 elevation-ambient ghost-border">
        <div className="bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] p-6 flex items-center justify-between border-b border-[color-mix(in-srgb,var(--primary)_15%,transparent)]">
          <h2 className="text-2xl font-headline font-bold text-[var(--primary)]">Asignar Nueva Tarea</h2>
          <Link href="/dashboard" className="text-[var(--primary)] hover:bg-[color-mix(in-srgb,var(--primary)_20%,transparent)] p-2 rounded-md transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </div>

        <div className="p-6 sm:p-10">
          <TaskForm users={users} />
        </div>
      </div>
    </div>
  );
}
