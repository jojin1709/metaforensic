"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-void text-paper flex items-center justify-center p-6 font-mono">
      <div className="max-w-md w-full rounded-2xl bg-panel border border-panelBorder p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-safelight/10 border border-safelight/30 text-safelight flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-bold text-paper">Something went wrong</h2>
        <p className="text-xs text-muted leading-relaxed">
          {error?.message || "An unexpected client-side error occurred."}
        </p>
        <button
          onClick={reset}
          className="inline-block bg-safelight text-void font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-safelight/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
