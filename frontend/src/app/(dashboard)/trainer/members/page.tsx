"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TrainerMembersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/trainer");
  }, [router]);

  return (
    <div className="h-[70vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/40 text-xs font-semibold">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
