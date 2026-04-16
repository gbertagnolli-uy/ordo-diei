"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import Link from "next/link";

export default function ClientRulesPage({
  isAdmin,
  initialRules
}: {
  isAdmin: boolean;
  initialRules: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState(initialRules);

  const handleSave = async () => {
    if (!isAdmin) return;
    setLoading(true);

    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textoEstricto: rules }),
      });

      if (res.ok) {
        alert("¡Reglas del Hogar actualizadas con éxito!");
        router.push("/dashboard");
      } else {
        alert("Hubo un problema actualizando las reglas.");
      }
    } catch {
      alert("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] p-4 sm:p-8 flex flex-col items-center transition-colors">
      <div className="w-full max-w-3xl bg-[var(--surface-container-lowest)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] overflow-hidden mt-10 elevation-ambient ghost-border">
        <div className="bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] p-8 flex items-center justify-between border-b border-[color-mix(in-srgb,var(--primary)_15%,transparent)]">
          <h2 className="text-3xl font-display font-bold text-[var(--primary)] flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            Reglas del Hogar
          </h2>
          <Link href="/dashboard" className="text-[var(--primary)] hover:bg-[color-mix(in-srgb,var(--primary)_20%,transparent)] p-2 rounded-md transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </div>

        <div className="p-6 sm:p-10 flex flex-col gap-6">
          <p className="text-[var(--on-surface-variant)] text-lg font-body">
            Las reglas son para vivir juntos y felices.
          </p>

          <div className="bg-[var(--surface-container-low)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] p-6 elevation-ambient relative">
            {isAdmin ? (
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="w-full h-80 bg-transparent border-none outline-none text-[var(--on-surface)] font-body text-lg leading-loose resize-none custom-scrollbar"
                placeholder="Ingresa las reglas del hogar..."
              />
            ) : (
              <div className="w-full h-80 overflow-y-auto text-[var(--on-surface)] font-body text-lg leading-loose whitespace-pre-wrap">
                {rules}
              </div>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="mt-4 btn-primary self-end py-4 px-8 text-lg flex items-center justify-center gap-2"
            >
              <Save className="w-6 h-6" />
              {loading ? "Guardando..." : "Guardar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
