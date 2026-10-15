"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "@/lib/toast";

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
        toast.success("¡Reglas del Hogar actualizadas con éxito!");
        router.push("/dashboard");
      } else {
        toast.error("Hubo un problema actualizando las reglas.");
      }
    } catch {
      toast.error("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center p-4 sm:p-6">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardDescription>Las reglas son para vivir juntos y felices.</CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <Textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="h-80 resize-none text-base leading-relaxed"
              placeholder="Ingresa las reglas del hogar..."
            />
          ) : (
            <div className="h-80 overflow-y-auto rounded-lg border bg-muted/40 p-4 text-base leading-relaxed whitespace-pre-wrap">
              {rules}
            </div>
          )}
        </CardContent>
        {isAdmin && (
          <CardFooter className="justify-end">
            <Button onClick={handleSave} disabled={loading} size="lg">
              <Save />
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
