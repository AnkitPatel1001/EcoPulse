"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { PageShell } from "@/components/shared/PageShell";
import { ActivityLogger } from "@/components/log/ActivityLogger";

export default function LogPage() {
  const { isOnboarded } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isOnboarded, router]);

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Log Activity</h1>
        <p className="text-muted-foreground text-sm mt-1">
          What did you do today? Log anything — your first log is the most important.
        </p>
      </div>
      <ActivityLogger />
    </PageShell>
  );
}
