"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime application error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-neutral-50">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-sm text-neutral-600">
            An unexpected error occurred while processing your request. Our engineering team has been notified.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full bg-black text-white hover:bg-neutral-800 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>

          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Return to Homepage
            </Button>
          </Link>
        </div>

        {error.digest && (
          <p className="text-[10px] text-neutral-400 font-mono pt-2">
            Error Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
