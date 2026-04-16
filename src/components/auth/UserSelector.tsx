import React from 'react';

export interface User {
  id: number;
  nombre: string;
  rolFamiliar: string;
  fotoUrl: string | null;
}

interface Props {
  users: User[];
  onSelect: (user: User) => void;
}

export function UserSelector({ users, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-8 justify-center items-center">
      {users.map(user => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className="group flex flex-col items-center gap-3 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
        >
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/20 group-hover:border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 relative bg-[#352216]">
            {user.fotoUrl ? (
               <img src={user.fotoUrl} alt={user.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#C4956A] to-[#703607] flex items-center justify-center text-4xl text-white font-bold">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-white text-lg font-medium bg-black/40 backdrop-blur-md px-5 py-1.5 rounded-full border border-white/10 group-hover:bg-black/60 transition-colors shadow-lg drop-shadow-md">
            {user.nombre}
          </div>
        </button>
      ))}
    </div>
  );
}
