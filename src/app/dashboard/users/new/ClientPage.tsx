"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const nombre = formData.get("nombre") as string;
    const pinSecreto = formData.get("pin") as string;
    const fechaNacimiento = formData.get("fecha") as string;
    const rolFamiliar = formData.get("rol") as string;
    const file = formData.get("foto") as File;

    let fotoUrl = null;
    
    try {
      if (file && file.size > 0) {
        const uploadData = new FormData();
        uploadData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });
        if (uploadRes.ok) {
           const { url } = await uploadRes.json();
           fotoUrl = url;
        }
      }

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, pinSecreto, fechaNacimiento, rolFamiliar, fotoUrl })
      });

      if (res.ok) {
        alert("Miembro familiar añadido exitosamente");
        router.push("/dashboard");
      } else {
        alert("Error creando la cuenta.");
      }
    } catch (err) {
      alert("Error en la conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-xl bg-[var(--surface-container-lowest)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] overflow-hidden mt-10 elevation-ambient ghost-border">
        <div className="bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] p-6 flex items-center justify-between border-b border-[color-mix(in-srgb,var(--primary)_15%,transparent)]">
          <h2 className="text-2xl font-headline font-bold text-[var(--primary)] flex items-center gap-2">
            <UserPlus className="w-6 h-6" /> Añadir Miembro
          </h2>
          <Link href="/dashboard" className="text-[var(--primary)] hover:bg-[color-mix(in-srgb,var(--primary)_20%,transparent)] p-2 rounded-md transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 flex flex-col gap-5">
          <div>
            <label className="text-[var(--on-surface)] font-title font-bold mb-1 block">Nombre</label>
            <input required name="nombre" type="text" className="inkpot" placeholder="Ej: Sofía" />
          </div>

          <div>
            <label className="text-[var(--on-surface)] font-title font-bold mb-1 block">Rol Familiar</label>
            <select required name="rol" defaultValue="" className="inkpot cursor-pointer">
              <option value="" disabled>Selecciona el rol...</option>
              <optgroup label="Administradores">
                <option value="Padre">Padre</option>
                <option value="Madre">Madre</option>
              </optgroup>
              <optgroup label="Hijos (Se ordenarán solos por edad)">
                <option value="Hijo">Hijo</option>
                <option value="Hija">Hija</option>
              </optgroup>
            </select>
          </div>

          <div>
             <label className="text-[var(--on-surface)] font-title font-bold mb-1 block">Fecha de Nacimiento</label>
             <input required name="fecha" type="date" className="inkpot" />
          </div>

          <div>
             <label className="text-[var(--on-surface)] font-title font-bold mb-1 block">PIN Secreto (4 dígitos)</label>
             <input required name="pin" type="text" maxLength={4} pattern="[0-9]{4}" className="inkpot" placeholder="----" />
          </div>

          <div>
             <label className="text-[var(--on-surface)] font-title font-bold mb-1 block">Foto de Perfil</label>
             <input name="foto" type="file" accept="image/*" className="inkpot p-0 file:mr-4 file:py-3 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-title file:font-bold file:bg-[var(--surface-container)] file:text-[var(--on-surface)] hover:file:bg-[var(--surface-container-high)] cursor-pointer" />
          </div>

          <button disabled={loading} type="submit" className="btn-primary w-full mt-4 flex justify-center items-center py-4 text-lg">
            {loading ? "Guardando..." : "Registrar Miembro"}
          </button>
        </form>
      </div>
    </div>
  );
}
