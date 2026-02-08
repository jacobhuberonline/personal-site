"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuperbowlHeader } from "@/components/superbowl/header";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { getLoginRedirect, setLoginRedirect } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function SuperbowlLoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  async function sendOtp() {
    if (!isSupabaseConfigured || !supabase) {
      toast({
        variant: "destructive",
        title: "Supabase isn’t configured",
        description:
          "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.",
      });
      return;
    }
    const client = supabase;
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Enter your email",
        description: "We need a valid email address to send your login code.",
      });
      return;
    }
    if (typeof window !== "undefined") {
      if (!getLoginRedirect()) {
        setLoginRedirect("/superbowl");
      }
    }
    setSending(true);
    const { error } = await client.auth.signInWithOtp({ email });
    setSending(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Couldn’t send login code",
        description: error.message,
      });
      return;
    }
    setStep("verify");
    toast({
      title: "Check your email",
      description: "We sent a code. Enter it below to finish signing in.",
    });
  }

  async function verifyOtp() {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;
    if (!otp.trim()) {
      toast({
        variant: "destructive",
        title: "Enter your code",
        description: "Paste the code from your email.",
      });
      return;
    }
    setVerifying(true);
    const { error } = await client.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "email",
    });
    setVerifying(false);
    if (error) {
      toast({
        variant: "destructive",
        title: "Code didn’t work",
        description: error.message,
      });
      return;
    }
    toast({
      title: "Signed in",
      description: "Taking you back to your picks…",
    });
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-black dark:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10">
        <SuperbowlHeader
          title="Sign in to make picks"
          description="We’ll email you a one-time code. No password needed."
        />
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                type="email"
                disabled={step === "verify"}
              />
            </div>

            {step === "verify" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">One-time code</label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
                <Button
                  onClick={verifyOtp}
                  className="mt-2 w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  disabled={verifying}
                >
                  {verifying ? "Verifying…" : "Verify code"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={sendOtp}
                  className="w-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  disabled={sending}
                >
                  {sending ? "Sending…" : "Resend code"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep("request");
                    setOtp("");
                  }}
                  className="w-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Use a different email
                </Button>
              </>
            ) : (
              <Button
                onClick={sendOtp}
                className="mt-2 w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                disabled={sending}
              >
                {sending ? "Sending…" : "Send code"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
