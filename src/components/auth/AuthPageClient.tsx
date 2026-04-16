"use client";

import { useState, useEffect } from "react";
import { UserSelector, User } from "@/components/auth/UserSelector";
import { Numpad } from "@/components/auth/Numpad";
import { FirstSetupForm } from "@/components/auth/FirstSetupForm";
import { useAuthStore } from "@/store/authStore";
import { useModalStore } from "@/store/modalStore";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export function AuthPageClient({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [errorPin, setErrorPin] = useState(false);
  const login = useAuthStore((s) => s.login);
  const { openModal } = useModalStore();

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setErrorPin(false);
  };

  const handlePinComplete = async (pin: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser?.id, pinSecreto: pin })
      });

      if (res.ok) {
        const data = await res.json();
        login(data.user);
        
        if (data.hasPremioPendiente && data.premioPendiente) {
          router.push('/dashboard');
          setTimeout(() => {
            openModal("SURPRISE_AWARD", {
              entregaId: data.premioPendiente.id,
              titulo: data.premioPendiente.titulo,
              cantidad: data.premioPendiente.cantidad,
            });
          }, 500);
        } else {
          router.push('/dashboard');
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

  return (
    <div className="z-10 w-full max-w-4xl px-4 flex flex-col items-center">
      <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#C4956A] to-[#C9A84C] mb-2 text-center">
        Ordo Diei
      </h1>
      <p className="text-[#E8D8C8]/80 text-center max-w-2xl text-lg mb-12 italic font-serif leading-relaxed px-4">
        Sancta rutina diei ad animam fovendam et Deum laudandum. Omnis dies incipit cum oratione et finitur cum examine conscientiae.
      </p>

      <AnimatePresence mode="wait">
        {!selectedUser ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center gap-6"
          >
            {initialUsers.length === 0 ? (
              <FirstSetupForm />
            ) : (
              <UserSelector users={initialUsers} onSelect={handleSelectUser} />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="numpad"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-4 bg-black/40 p-3 pr-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
               <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C4956A] shadow-[0_0_15px_rgba(196,149,106,0.5)] bg-gradient-to-br from-[#C4956A] to-[#703607] flex items-center justify-center text-xl text-white font-bold">
                {selectedUser.fotoUrl ? (
                   <img src={selectedUser.fotoUrl} alt={selectedUser.nombre} className="w-full h-full object-cover" />
                ) : (
                  selectedUser.nombre.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-white text-xl font-medium">Hola, {selectedUser.nombre}</span>
            </div>
            
            <div className={errorPin ? "animate-shake" : ""}>
               <Numpad onComplete={handlePinComplete} />
            </div>

            {errorPin && (
              <p className="text-red-400 font-medium bg-red-500/10 px-4 py-1 rounded-md">PIN incorrecto.</p>
            )}

            <button
              onClick={() => setSelectedUser(null)}
              className="mt-4 px-6 py-2 rounded-md text-[#E8D8C8]/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cambiar de usuario
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
