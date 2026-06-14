"use client";

// Root route — redirect to dashboard if onboarded, else onboarding
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function RootPage() {
  const { isOnboarded } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (isOnboarded) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [isOnboarded, router]);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      aria-label="Loading EcoPulse"
      role="status"
    >
      <div className="text-center">
        <div className="text-4xl mb-3" aria-hidden="true">
          🌿
        </div>
        <p className="text-muted-foreground text-sm">Loading EcoPulse…</p>
      </div>
    </div>
  );
}
