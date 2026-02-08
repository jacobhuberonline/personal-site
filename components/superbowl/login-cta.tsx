"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { setLoginRedirect } from "@/lib/auth";

export function SuperbowlLoginCta({
  redirectPath,
  label = "Log in",
}: {
  redirectPath: string;
  label?: string;
}) {
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && typeof window !== "undefined") {
        if (window.location.pathname !== redirectPath) {
          window.location.replace(redirectPath);
        }
      }
    });
    return () => {
      data?.subscription.unsubscribe();
    };
  }, [redirectPath]);

  return (
    <Button asChild>
      <Link
        href="/superbowl/login"
        onClick={() => {
          setLoginRedirect(redirectPath);
        }}
      >
        {label}
      </Link>
    </Button>
  );
}
