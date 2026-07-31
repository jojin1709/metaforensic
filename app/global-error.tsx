"use client";

import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b0c0e] text-[#e7e7e5] flex items-center justify-center p-6 font-mono">
        <div className="max-w-md w-full rounded-2xl bg-[#131518] border border-[#22262b] p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#ff4d3d]/10 border border-[#ff4d3d]/30 text-[#ff4d3d] flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-bold text-[#F1EAD9]">Global Application Error</h2>
          <p className="text-xs text-[#7C8288] leading-relaxed">
            {error?.message || "A global runtime error occurred."}
          </p>
          <button
            onClick={reset}
            className="inline-block bg-[#ff4d3d] text-[#0b0c0e] font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
