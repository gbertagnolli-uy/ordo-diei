"use client";

import { useState, useEffect } from "react";
import { UserSelector, User } from "@/components/auth/UserSelector";
import { Numpad } from "@/components/auth/Numpad";
import { FirstSetupForm } from "@/components/auth/FirstSetupForm";
import { ReposoPantalla } from "@/components/reposo/ReposoPantalla";
import { useAuthStore } from "@/store/authStore";
import { useModalStore } from "@/store/modalStore";
import { useInactividad } from "@/hooks/useInactividad";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ModoAuth = "REPOSO" | "SELECTOR" | "PIN";

export function AuthPageClient({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [modo, setModo] = useState<ModoAuth>(initialUsers.length === 0 ? "SELECTOR" : "REPOSO");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [errorPin, setErrorPin] = useState(false);
  const [segundosLogin, setSegundosLogin] = useState(15);

  const login = useAuthStore((s) => s.login);
  const { openModal } = useModalStore();

  // Obtener tiempo configurado para el login (SPEC §3, §5.4: por defecto 15 s)
  useEffect(() => {
    fetch("/api/reposo/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cfg && typeof cfg.segundosLogin === "number") {
          setSegundosLogin(cfg.segundosLogin);
        }
      })
      .catch(() => {});
  }, []);

  // Monitor de inactividad: 15 s sin actividad en SELECTOR o PIN regresa al REPOSO (SPEC §3)
  const { reiniciar } = useInactividad({
    umbralMs: segundosLogin * 1000,
    habilitado: modo === "SELECTOR" || modo === "PIN",
    alVencer: () => {
      setSelectedUser(null);
      setModo("REPOSO");
    },
  });

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setModo("PIN");
    setErrorPin(false);
    reiniciar();
  };

  const handlePinComplete = async (pin: string) => {
    reiniciar();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser?.id, pinSecreto: pin }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.user);

        if (data.hasPremioPendiente && data.premioPendiente) {
          router.push("/dashboard");
          setTimeout(() => {
            openModal("SURPRISE_AWARD", {
              entregaId: data.premioPendiente.id,
              titulo: data.premioPendiente.titulo,
              cantidad: data.premioPendiente.cantidad,
            });
          }, 500);
        } else {
          router.push("/dashboard");
        }
      } else {
        setErrorPin(true);
        setTimeout(() => setErrorPin(false), 1000);
      }
    } catch {
      setErrorPin(true);
      setTimeout(() => setErrorPin(false), 1000);
    }
  };

  // 1. Estado REPOSO (salvapantallas contemplativo con Unsplash y frases)
  if (modo === "REPOSO" && initialUsers.length > 0) {
    return (
      <ReposoPantalla
        onEntrar={() => {
          setModo("SELECTOR");
          reiniciar();
        }}
      />
    );
  }

  // 2. Estado SELECTOR o PIN (Auth clásico)
  return (
    <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-4 py-12">
      {modo === "SELECTOR" && (
        <>
          <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary font-heading text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20">
            OD
          </span>
          <h1 className="bg-gradient-to-b from-[#F3E3CC] to-[#C4956A] bg-clip-text text-center font-heading text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            Ordo Diei
          </h1>
          <p className="mt-3 mb-12 max-w-xl px-4 text-center font-heading text-base leading-relaxed text-muted-foreground italic">
            Sancta rutina diei ad animam fovendam et Deum laudandum. Omnis dies incipit cum oratione et finitur cum examine conscientiae.
          </p>
        </>
      )}

      <AnimatePresence mode="wait">
        {modo === "SELECTOR" ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex w-full flex-col items-center gap-6"
          >
            {initialUsers.length === 0 ? (
              <FirstSetupForm />
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">¿Quién eres?</p>
                <UserSelector users={initialUsers} onSelect={handleSelectUser} />
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="numpad"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-[22rem] max-w-full items-center gap-6 border-white/10 bg-card/70 py-8 backdrop-blur-xl">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="size-16 ring-2 ring-primary ring-offset-4 ring-offset-card">
                  <AvatarImage src={selectedUser?.fotoUrl ?? undefined} alt={selectedUser?.nombre} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-[#C4956A] to-[#703607] text-xl font-semibold text-white">
                    {selectedUser?.nombre?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-lg font-semibold">Hola, {selectedUser?.nombre}</span>
              </div>

              <div className={errorPin ? "animate-shake" : ""}>
                <Numpad onComplete={handlePinComplete} />
              </div>

              <p role="alert" className={cn("h-5 text-sm font-medium text-destructive", !errorPin && "invisible")}>
                PIN incorrecto.
              </p>

              <Button
                variant="link"
                className="text-muted-foreground"
                onClick={() => {
                  setSelectedUser(null);
                  setModo("SELECTOR");
                  reiniciar();
                }}
              >
                Cambiar de usuario
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
