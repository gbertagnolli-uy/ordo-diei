"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex justify-center p-4 sm:p-6">
      <Card className="w-full max-w-xl">
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="member-nombre">Nombre</FieldLabel>
                <Input id="member-nombre" required name="nombre" type="text" placeholder="Ej: Sofía" />
              </Field>

              <Field>
                <FieldLabel htmlFor="member-rol">Rol Familiar</FieldLabel>
                <NativeSelect id="member-rol" required name="rol" defaultValue="" className="w-full">
                  <NativeSelectOption value="" disabled>Selecciona el rol...</NativeSelectOption>
                  <NativeSelectOptGroup label="Administradores">
                    <NativeSelectOption value="Padre">Padre</NativeSelectOption>
                    <NativeSelectOption value="Madre">Madre</NativeSelectOption>
                  </NativeSelectOptGroup>
                  <NativeSelectOptGroup label="Hijos (Se ordenarán solos por edad)">
                    <NativeSelectOption value="Hijo">Hijo</NativeSelectOption>
                    <NativeSelectOption value="Hija">Hija</NativeSelectOption>
                  </NativeSelectOptGroup>
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel htmlFor="member-fecha">Fecha de Nacimiento</FieldLabel>
                <Input id="member-fecha" required name="fecha" type="date" />
              </Field>

              <Field>
                <FieldLabel htmlFor="member-pin">PIN Secreto (4 dígitos)</FieldLabel>
                <Input id="member-pin" required name="pin" type="text" maxLength={4} pattern="[0-9]{4}" placeholder="----" />
              </Field>

              <Field>
                <FieldLabel htmlFor="member-foto">Foto de Perfil</FieldLabel>
                <Input id="member-foto" name="foto" type="file" accept="image/*" />
              </Field>

              <Button disabled={loading} type="submit" size="lg" className="w-full">
                {loading ? "Guardando..." : "Registrar Miembro"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
