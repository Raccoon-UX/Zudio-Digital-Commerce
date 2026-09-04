"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "Failed to create account.");
        setIsLoading(false);
        return;
      }

      // Automatically sign in upon registration
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
      });

      if (loginRes?.error) {
        router.push("/login");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-stitch-border p-8 shadow-sm rounded-lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-tight text-black">
          Create Account
        </h2>
        <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
          Sign up to enjoy fast checkout & store availability tracking
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
            Full Name *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="Sujal Verma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stitch-surface border border-stitch-border py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-black rounded"
            />
            <MaterialIcon name="person" size={16} className="absolute left-3 top-3 text-neutral-400" />
          </div>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-black mb-1.5">
            Email Address *
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
            Phone Number (Optional)
          </label>
          <div className="relative">
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-stitch-surface border border-stitch-border py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-black rounded"
            />
            <MaterialIcon name="call" size={16} className="absolute left-3 top-3 text-neutral-400" />
          </div>
        </div>

        <div>
          <label className="block font-bold uppercase tracking-wider text-black mb-1.5">
            Password (Min. 8 characters) *
          </label>
          <div className="relative">
            <input
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stitch-surface border border-stitch-border py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-black rounded"
            />
            <MaterialIcon name="lock" size={16} className="absolute left-3 top-3 text-neutral-400" />
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Must contain 8 or more characters</p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full mt-2"
        >
          Create Account
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-stitch-border text-center text-xs text-neutral-600">
        Already have an account?{" "}
        <Link
          href={`/login${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="font-bold text-black uppercase tracking-wider underline hover:text-neutral-700"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;

