"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Global Application Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-neutral-900 text-white font-sans p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-neutral-800 p-8 rounded-2xl border border-neutral-700 shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-950/80 text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Application Error
            </h1>
            <p className="text-sm text-neutral-400">
              A critical system error occurred. Please refresh or reload the application.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
