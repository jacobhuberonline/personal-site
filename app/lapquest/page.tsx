"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export default function LapQuestLanding() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setSignedIn(false);
      return;
    }
    let isActive = true;
    const client = supabase;
    client.auth.getSession().then(({ data }) => {
      if (!isActive) return;
      setSignedIn(Boolean(data.session));
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;
      setSignedIn(Boolean(session));
    });
    return () => {
      isActive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
        <section
          className="relative mt-8 overflow-hidden rounded-3xl border border-zinc-900 bg-black/80 px-6 py-12 text-center sm:px-10"
          style={{
            backgroundImage: "url('/lapquest/hero.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/55" />
          </div>
          <div className="relative">
          <div className="text-sm font-medium uppercase tracking-[0.4em] text-zinc-500">
            LapQuest
          </div>
          <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
            Ready, set… GO!
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            LapQuest turns your hallway, backyard, or driveway into a mini race track. Run through the finish line to count laps, race the clock, and try to beat your best time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {signedIn ? (
              <>
                <Button asChild className="bg-white text-black hover:bg-zinc-200">
                  <Link href="/lapquest/setup">Start racing</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                >
                  <Link href="/lapquest/history">My runs</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="bg-white text-black hover:bg-zinc-200">
                  <Link href="/lapquest/login">Log in to race</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                >
                  <Link href="#how-it-works">How it works</Link>
                </Button>
              </>
            )}
          </div>
          {!signedIn && (
            <p className="mt-4 text-sm text-zinc-500">
              Sign in to start races and save your scores.
            </p>
          )}
          </div>
        </section>

        <section id="how-it-works" className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Make a finish line",
              body: "A grown-up sets up the gate. When you run through it, LapQuest counts a lap.",
            },
            {
              title: "Choose a challenge",
              body: "Pick laps, a timer, or a distance goal. Then watch the countdown: 3…2…1…GO!",
            },
            {
              title: "Beat your best",
              body: "LapQuest saves your runs so you can see your fastest lap and try again next time.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {item.title}
              </div>
              <p className="mt-3 text-sm text-zinc-300">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 text-left">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            What you need (grown-up help!)
          </div>
          <div className="mt-3 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
            <div>Raspberry Pi Pico (the tiny race brain) + USB cable</div>
            <div>Beam gate sensor (the finish line)</div>
            <div>A laptop/tablet + LapQuest in a browser</div>
            <div>A clear line to sprint through</div>
          </div>
        </section>
      </div>
    </main>
  );
}
