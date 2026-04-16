"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Modal({ isOpen, onClose, title, children, width = "md" }: ModalProps) {
  const widthClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
    full: "max-w-7xl"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[color-mix(in-srgb,var(--tertiary)_40%,transparent)] backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto"
          />
          <div className="fixed inset-0 z-50 pointer-events-none flex justify-center items-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`bg-[var(--surface-container-lowest)] rounded-md elevation-ambient w-full ${widthClasses[width]} overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]`}
            >
              <div className="flex justify-between items-center p-6 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] sticky top-0 vellum-glass z-10">
                {title && <h2 className="font-display text-2xl text-[var(--on-surface)]">{title}</h2>}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[color-mix(in-srgb,var(--primary)_5%,transparent)] text-[var(--on-surface-variant)] transition-colors ml-auto"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
