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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 rounded border border-border bg-card p-3 shadow-lg animate-in slide-in-from-bottom duration-200"
        >
          {toast.type === "success" && (
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          )}
          {toast.type === "warning" && (
            <AlertCircle className="h-4 w-4 text-brand-gilt shrink-0 mt-0.5" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          )}
          {toast.type === "info" && (
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs font-sans text-foreground">
            {toast.message}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
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
