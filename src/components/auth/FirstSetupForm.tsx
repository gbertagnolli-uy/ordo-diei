"use client";

import { useState } from "react";

export function FirstSetupForm() {
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
        alert("¡Administrador creado con éxito! Refrescando...");
        window.location.reload();
      } else {
        alert("Error creando el administrador.");
      }
    } catch (err) {
      alert("Error en la conexión.");
    }
    setLoading(false);
  }

  return (
    <div className="bg-[var(--surface-container-highest)] p-8 rounded-md backdrop-blur-md border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] w-full max-w-md elevation-ambient">
      <h2 className="text-2xl font-headline font-bold text-[var(--on-surface)] mb-2">Crear Administrador</h2>
      <p className="text-[var(--on-surface-variant)] mb-6 text-sm font-body">Parece que no hay perfiles. Crea el primer Padre/Madre.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[var(--on-surface)] text-sm mb-1 block font-title font-bold">Nombre</label>
          <input required name="nombre" type="text" className="inkpot" placeholder="Ej: Carlos" />
        </div>

        <div>
          <label className="text-[var(--on-surface)] text-sm mb-1 block font-title font-bold">Rol Familiar</label>
          <select required name="rol" className="inkpot">
            <option value="Padre">Padre</option>
            <option value="Madre">Madre</option>
          </select>
        </div>

        <div>
           <label className="text-[var(--on-surface)] text-sm mb-1 block font-title font-bold">Fecha de Nacimiento</label>
           <input required name="fecha" type="date" className="inkpot" />
        </div>

        <div>
           <label className="text-[var(--on-surface)] text-sm mb-1 block font-title font-bold">PIN Secreto (Ej: 1234)</label>
           <input required name="pin" type="text" maxLength={4} pattern="[0-9]{4}" className="inkpot" placeholder="----" />
        </div>

        <div>
           <label className="text-[var(--on-surface)] text-sm mb-1 block font-title font-bold">Sube una Foto (Opcional)</label>
           <input name="foto" type="file" accept="image/*" className="inkpot p-0 file:mr-4 file:py-3 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-title file:font-bold file:bg-[var(--surface-container)] file:text-[var(--on-surface)] hover:file:bg-[var(--surface-container-high)] cursor-pointer" />
        </div>

        <button disabled={loading} type="submit" className="btn-primary mt-4 w-full py-4 shadow-lg text-lg">
          {loading ? "Creando..." : "Crear Perfil"}
        </button>
      </form>
    </div>
  );
}
