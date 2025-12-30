"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const LOGIN_INTENT_KEY = "lapquest_login_intent";
const TARGET_PATH = "/lapquest";

export function LapquestLoginRedirect() {
  useEffect(() => {
    if (!supabase || typeof window === "undefined") return;

    const shouldRedirect = () => window.localStorage.getItem(LOGIN_INTENT_KEY) === "1";
    const redirect = () => {
      window.localStorage.removeItem(LOGIN_INTENT_KEY);
      if (window.location.pathname !== TARGET_PATH) {
        window.location.replace(TARGET_PATH);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && shouldRedirect()) redirect();
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && shouldRedirect()) {
        redirect();
      }
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }, []);

  return null;
}
