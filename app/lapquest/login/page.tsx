"use client";

import { useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const { toast } = useToast();

  async function sendLink() {
    if (!isSupabaseConfigured || !supabase) {
      toast({
        variant: "destructive",
        title: "Supabase isn’t configured",
        description:
          "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.",
      });
      return;
    }
    setMsg("Sending…");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/lapquest/history` : undefined,
      },
    });
    if (error) {
      setMsg("");
      toast({
        variant: "destructive",
        title: "Couldn’t send login link",
        description: error.message,
      });
      return;
    }
    setMsg("");
    toast({
      title: "Check your email",
      description: "We sent a magic link. Open it to finish signing in.",
    });
  }

  return (
    <main style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 36, fontWeight: 900 }}>LapQuest Login</h1>
      <p style={{ color: "#666" }}>Email magic link login via Supabase.</p>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        style={{ padding: 10, width: "100%", marginTop: 10 }}
      />
      <button onClick={sendLink} style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10 }}>
        Send login link
      </button>
      {msg && <p style={{ color: "#666", marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
