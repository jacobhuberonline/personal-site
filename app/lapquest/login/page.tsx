"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
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
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lapquest_login_intent", "1");
    }
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "");
    const origin = siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const redirectTo = origin ? `${origin}/lapquest` : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) {
      toast({
        variant: "destructive",
        title: "Couldn’t send login link",
        description: error.message,
      });
      return;
    }
    toast({
      title: "Check your email",
      description: "We sent a link. Open it to finish signing in (it may open in a new tab).",
    });
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
        <div className="mx-auto mt-10 grid min-h-[60vh] w-full max-w-5xl items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_480px]">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
            <img
              src="/lapquest/login.png"
              alt="LapQuest preview"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex h-full flex-col justify-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">
                Login
              </div>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Sign in to LapQuest
              </h1>
              <p className="mt-3 text-zinc-400">
                Send a link to your email to continue.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                type="email"
              />
            </div>
            <Button
              onClick={sendLink}
              className="mt-4 w-full bg-white text-black hover:bg-zinc-200"
            >
              Send login link
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
