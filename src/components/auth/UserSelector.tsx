import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface User {
  id: number;
  nombre: string;
  rolFamiliar: string;
  fotoUrl: string | null;
  puestoRanking?: number | null;
  emojiPodio?: string | null;
  aceleradorPct?: number;
}

interface Props {
  users: User[];
  onSelect: (user: User) => void;
}

export function UserSelector({ users, onSelect }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-8">
      {users.map(user => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className="group flex w-28 flex-col items-center gap-3 rounded-2xl p-2 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
        >
          <div className="relative">
            <Avatar className="size-24 ring-2 ring-white/10 ring-offset-4 ring-offset-transparent transition-all duration-300 group-hover:ring-primary group-hover:shadow-[0_0_32px_-4px] group-hover:shadow-primary/60">
              <AvatarImage src={user.fotoUrl ?? undefined} alt={user.nombre} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-[#C4956A] to-[#703607] text-3xl font-semibold text-white">
                {user.nombre.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {user.emojiPodio && (
              <span
                title={`Puesto #${user.puestoRanking} en el ranking${user.aceleradorPct ? ` (+${user.aceleradorPct}% puntos)` : ""}`}
                aria-label={`Puesto ${user.puestoRanking}`}
                className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border border-white/20 bg-card text-lg leading-none shadow-md"
              >
                {user.emojiPodio}
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">{user.nombre}</span>
        </button>
      ))}
    </div>
  );
}
