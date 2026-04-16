import React, { useState } from 'react';
import { Delete } from 'lucide-react';

interface NumpadProps {
  onComplete: (pin: string) => void;
  title?: string;
}

export function Numpad({ onComplete, title = "Ingresa tu PIN" }: NumpadProps) {
  const [pin, setPin] = useState("");
  
  const handlePress = (num: string) => {
    setPin(prev => {
      if (prev.length >= 4) return prev;
      const newPin = prev + num;
      if (newPin.length === 4) {
        setTimeout(() => onComplete(newPin), 300);
      }
      return newPin;
    });
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl w-80">
      <h2 className="font-bold text-2xl mb-6 text-white">{title}</h2>
      
      {/* PIN Dots */}
      <div className="flex gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 'bg-white/20 border border-white/30'}`}
          />
        ))}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-4 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num)}
            className="h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-2xl font-medium text-white transition-all transform hover:scale-105 active:scale-95 border border-white/5"
          >
            {num}
          </button>
        ))}
        <div className="h-16"></div> {/* Empty space */}
        <button
          onClick={() => handlePress('0')}
          className="h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-2xl font-medium text-white transition-all transform hover:scale-105 active:scale-95 border border-white/5"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 border border-white/5"
        >
          <Delete size={28} />
        </button>
      </div>
    </div>
  );
}
