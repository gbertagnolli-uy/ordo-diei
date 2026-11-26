import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Delete } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface NumpadProps {
  onComplete: (pin: string) => void;
  title?: string;
}

export function Numpad({ onComplete, title = "Ingresa tu PIN" }: NumpadProps) {
  const [pin, setPin] = useState("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handlePress = useCallback((num: string) => {
    setPin(prev => {
      if (prev.length >= 4) return prev;
      const newPin = prev + num;
      if (newPin.length === 4) {
        setTimeout(() => onCompleteRef.current(newPin), 300);
      }
      return newPin;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePress, handleBackspace]);

  const key = "h-14 rounded-full text-xl font-medium";

  return (
    <div className="flex w-72 flex-col items-center">
      <p className="mb-4 text-sm font-medium text-muted-foreground">{title}</p>

      {/* El PIN se escribe con el teclado (pantalla o físico); el campo solo lo muestra */}
      <InputOTP maxLength={4} value={"•".repeat(pin.length)} readOnly tabIndex={-1} containerClassName="pointer-events-none mb-8" aria-label="PIN">
        <InputOTPGroup className="gap-3">
          {[0, 1, 2, 3].map((i) => (
            <InputOTPSlot key={i} index={i} className="size-12 rounded-xl border text-2xl first:rounded-xl last:rounded-xl [&>div]:hidden" />
          ))}
        </InputOTPGroup>
      </InputOTP>

      <div className="grid w-full grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <Button key={num} variant="outline" className={key} onClick={() => handlePress(num)}>
            {num}
          </Button>
        ))}
        <div />
        <Button variant="outline" className={key} onClick={() => handlePress('0')}>
          0
        </Button>
        <Button variant="ghost" className={key} onClick={handleBackspace} aria-label="Borrar">
          <Delete className="size-6" />
        </Button>
      </div>
    </div>
  );
}
