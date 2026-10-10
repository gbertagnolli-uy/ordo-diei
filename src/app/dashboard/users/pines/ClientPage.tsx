"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useState } from "react";

type Props = { users: { id: number; nombre: string; rolFamiliar: string }[] };

export default function ResetPinPage({ users }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const userId = Number(formData.get("usuario"));
    const nuevoPin = formData.get("pin") as string;

    setLoading(true);
    try {
      const res = await fetch("/api/users/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, nuevoPin }),
      });
      if (res.ok) {
        alert("PIN restablecido exitosamente");
        form.reset();
      } else {
        const { error } = await res.json().catch(() => ({ error: null }));
        alert(error || "No se pudo restablecer el PIN.");
      }
    } catch {
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
                <FieldLabel htmlFor="reset-usuario">Usuario</FieldLabel>
                <NativeSelect id="reset-usuario" required name="usuario" defaultValue="" className="w-full">
                  <NativeSelectOption value="" disabled>Selecciona un usuario...</NativeSelectOption>
                  {users.map((u) => (
                    <NativeSelectOption key={u.id} value={u.id}>
                      {u.nombre} ({u.rolFamiliar})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="reset-pin">Nuevo PIN</FieldLabel>
                <Input id="reset-pin" required name="pin" type="password" inputMode="numeric" pattern="\d{4,8}" placeholder="4 a 8 dígitos" />
              </Field>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Restablecer PIN"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
