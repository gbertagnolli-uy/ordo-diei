"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { subirImagen } from "@/lib/subirImagen";

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
        fotoUrl = (await subirImagen(file)).url;
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
    <Card className="w-full max-w-md border-white/10 bg-card/70 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Crear Administrador</CardTitle>
        <CardDescription>Parece que no hay perfiles. Crea el primer Padre/Madre.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="setup-nombre">Nombre</FieldLabel>
              <Input id="setup-nombre" required name="nombre" type="text" placeholder="Ej: Carlos" />
            </Field>
            <Field>
              <FieldLabel htmlFor="setup-rol">Rol Familiar</FieldLabel>
              <NativeSelect id="setup-rol" required name="rol" className="w-full">
                <NativeSelectOption value="Padre">Padre</NativeSelectOption>
                <NativeSelectOption value="Madre">Madre</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="setup-fecha">Fecha de Nacimiento</FieldLabel>
              <Input id="setup-fecha" required name="fecha" type="date" />
            </Field>
            <Field>
              <FieldLabel htmlFor="setup-pin">PIN Secreto (Ej: 1234)</FieldLabel>
              <Input id="setup-pin" required name="pin" type="text" maxLength={4} pattern="[0-9]{4}" placeholder="----" />
            </Field>
            <Field>
              <FieldLabel htmlFor="setup-foto">Sube una Foto (Opcional)</FieldLabel>
              <Input id="setup-foto" name="foto" type="file" accept="image/*" />
            </Field>
            <Button disabled={loading} type="submit" size="lg" className="w-full">
              {loading ? "Creando..." : "Crear Perfil"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
