"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError(res.error || "Invalid email or password.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-stitch-border p-8 shadow-sm rounded-lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-tight text-black">
          Welcome Back
        </h2>
        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
          Sign in to access your orders, wishlist & addresses
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 rounded">
          <MaterialIcon name="error" size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold uppercase tracking-wider text-black mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stitch-surface border border-stitch-border py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-black rounded"
            />
            <MaterialIcon name="mail" size={16} className="absolute left-3 top-3 text-neutral-400" />
          </div>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-black mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stitch-surface border border-stitch-border py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-black rounded"
            />
            <MaterialIcon name="lock" size={16} className="absolute left-3 top-3 text-neutral-400" />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full mt-2"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-stitch-border text-center text-xs text-neutral-600">
        Don't have an account yet?{" "}
        <Link
          href={`/register${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="font-bold text-black uppercase tracking-wider underline hover:text-neutral-700"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;

