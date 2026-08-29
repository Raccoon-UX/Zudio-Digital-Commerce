"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ShieldAlert, LogIn, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="space-y-4 max-w-sm w-full bg-white p-8 border border-neutral-200 shadow-sm text-center">
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  const isAdmin = session?.user && (session.user as any).role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-black border border-neutral-800 p-8 text-center space-y-6 shadow-2xl">
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 inline-block rounded-full">
            <Lock className="h-8 w-8 text-rose-500" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Access Restricted
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Administrator Privileges Required
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This console is restricted strictly to authorized platform administrators. Please sign in with an administrator account to continue.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login?callbackUrl=/admin">
              <Button variant="primary" size="md" className="w-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-200">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In as Administrator
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="w-full text-xs text-neutral-400 border-neutral-800 hover:text-white">
                Return to Storefront
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
