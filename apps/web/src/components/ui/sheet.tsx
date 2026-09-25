"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minimal slide-over sheet (no Radix dependency).
 * Controlled: parent owns `open` state. Escape closes; background scroll locks.
 */
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  className?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, title, side = "right", className, children }: SheetProps) {
  const reduceMotion = useReducedMotion();
  const x = side === "right" ? "100%" : "-100%";

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 z-50 bg-ink/40"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "fixed top-0 z-50 flex h-full w-full max-w-sm flex-col bg-surface shadow-card",
              side === "right" ? "right-0" : "left-0",
              className,
            )}
            initial={reduceMotion ? undefined : { x }}
            animate={{ x: 0 }}
            exit={reduceMotion ? undefined : { x }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-display font-semibold">{title}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="flex h-9 w-9 items-center justify-center rounded-card border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
