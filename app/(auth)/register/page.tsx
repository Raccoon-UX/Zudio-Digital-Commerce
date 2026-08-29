import React, { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Skeleton } from "@/components/ui/Skeleton";

export default function RegisterPage() {
  return (
    <div className="py-16 bg-neutral-50 min-h-[80vh] flex items-center justify-center">
      <Container size="sm" className="flex justify-center">
        <Suspense
          fallback={
            <div className="w-full max-w-md bg-white p-8 border border-neutral-200 space-y-4">
              <Skeleton className="h-8 w-1/2 mx-auto" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </Container>
    </div>
  );
}
