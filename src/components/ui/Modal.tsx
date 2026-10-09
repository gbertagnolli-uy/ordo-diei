"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "full";
}

const widthClasses = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-3xl",
  xl: "sm:max-w-5xl",
  full: "sm:max-w-7xl",
};

// API histórica de la app sobre el Dialog de shadcn/ui
export function Modal({ isOpen, onClose, title, children, width = "md" }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={cn("max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden", widthClasses[width])}>
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className={cn("font-headline text-xl pr-8", !title && "sr-only")}>{title ?? "Diálogo"}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
