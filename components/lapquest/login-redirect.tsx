"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { LOGIN_REDIRECT_KEY, LEGACY_LAPQUEST_LOGIN_KEY } from "@/lib/auth";

const DEFAULT_TARGET_PATH = "/lapquest";

export function LapquestLoginRedirect() {
  useEffect(() => {
    if (!supabase || typeof window === "undefined") return;

    const getTargetPath = () => {
      const explicitTarget = window.localStorage.getItem(LOGIN_REDIRECT_KEY);
      if (explicitTarget) return explicitTarget;
      const legacyIntent = window.localStorage.getItem(LEGACY_LAPQUEST_LOGIN_KEY);
      return legacyIntent === "1" ? DEFAULT_TARGET_PATH : null;
    };

    const clearTarget = () => {
      window.localStorage.removeItem(LOGIN_REDIRECT_KEY);
      window.localStorage.removeItem(LEGACY_LAPQUEST_LOGIN_KEY);
    };

    const redirect = () => {
      const target = getTargetPath();
      if (!target) return;
      clearTarget();
      if (window.location.pathname !== target) {
        window.location.replace(target);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) redirect();
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        redirect();
      }
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }, []);

  return null;
}
