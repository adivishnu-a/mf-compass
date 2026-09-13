"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

interface ToastMessage {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{
        message: string;
        type?: ToastMessage["type"];
      }>;
      const { message, type = "info" } = customEvent.detail;
      const id = Math.random().toString(36).substring(2, 9);

      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener("mfc-toast", handleToast);
    return () => window.removeEventListener("mfc-toast", handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-bottom flex items-start gap-3 rounded border border-border bg-card p-3 shadow-lg duration-200"
        >
          {toast.type === "success" && (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          )}
          {toast.type === "warning" && (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-gilt" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          )}
          {toast.type === "info" && (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          )}

          <div className="flex-1 font-sans text-xs text-foreground">
            {toast.message}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss toast"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
export default ToastProvider;
