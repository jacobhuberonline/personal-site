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
    <main className="min-h-screen bg-white text-slate-900 dark:bg-black dark:text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <section
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/85 px-6 py-12 dark:border-zinc-900 dark:bg-black/80 sm:px-10 sm:py-16"
          style={{
            backgroundImage: "url('/lapquest/hero-two.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/45 to-white/85 dark:from-black/25 dark:via-black/20 dark:to-black/60" />
            <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />
          </div>
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500 dark:text-zinc-500">
                LapQuest
              </div>
              <h1 className="mt-4 text-4xl font-semibold text-slate-900 dark:text-white sm:text-5xl">
                Ready, set… GO!
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-zinc-400">
                LapQuest turns your hallway, backyard, or driveway into a mini race track. Run through the finish line to count laps, race the clock, and try to beat your best time.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {signedIn ? (
                  <>
                    <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                      <Link href="/lapquest/setup">Start racing</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                      <Link href="/lapquest/history">My runs</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                      <Link href="/lapquest/login">Log in to race</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                      <Link href="#how-it-works">How it works</Link>
                    </Button>
                  </>
                )}
              </div>
              {!signedIn && (
                <p className="mt-4 text-sm text-slate-500 dark:text-zinc-500">
                  Sign in to start races and save your scores.
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Race modes",
                  body: "Choose laps, a timer, or distance goals for every run.",
                },
                {
                  title: "Live tracking",
                  body: "Instant lap counts and a countdown that hypes up the start.",
                },
                {
                  title: "Fast feedback",
                  body: "See your best lap and finish time right after you sprint.",
                },
                {
                  title: "Kid friendly",
                  body: "Clear visuals, simple controls, and lots of replay energy.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">
                    {item.title}
                  </div>
                  <p className="mt-3 text-sm text-slate-700 dark:text-zinc-300">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="grid gap-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-zinc-500">
              How it works
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
              Build a race in minutes
            </h2>
            <p className="mt-4 max-w-2xl text-base text-slate-600 dark:text-zinc-400">
              Set the finish line, pick a challenge, and sprint. LapQuest keeps the excitement going while tracking every lap.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Make a finish line",
                body: "A grown-up sets up the beam gate. Run through it and LapQuest counts a lap.",
              },
              {
                title: "Choose a challenge",
                body: "Pick laps, a timer, or a distance goal. Then watch the countdown: 3…2…1…GO!",
              },
              {
                title: "Beat your best",
                body: "LapQuest saves your runs so you can see your fastest lap and try again next time.",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-950/70"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">
                  {`0${index + 1}`}
                </div>
                <div className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </div>
                <p className="mt-3 text-sm text-slate-700 dark:text-zinc-300">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-950/70 sm:grid-cols-[1.1fr,0.9fr] sm:items-center sm:p-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">
              What you need (grown-up help!)
            </div>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
              Simple hardware, big energy
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-zinc-400">
              LapQuest works best with a beam gate sensor and a Pico-powered finish line. Set it up once and keep the races coming.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-700 dark:text-zinc-300">
            <div className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-zinc-800/80 dark:bg-black/40">
              Raspberry Pi Pico (the tiny race brain) + USB cable
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-zinc-800/80 dark:bg-black/40">
              Beam gate sensor (the finish line)
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-zinc-800/80 dark:bg-black/40">
              A laptop/tablet + LapQuest in a browser
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-zinc-800/80 dark:bg-black/40">
              A clear line to sprint through
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/80 px-6 py-10 text-left dark:border-zinc-800 dark:from-zinc-950 dark:via-black dark:to-black sm:px-10 sm:py-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-zinc-500">
                Ready to race?
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
                Start a run in under a minute.
              </h3>
              <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-zinc-400">
                Launch LapQuest, set your challenge, and sprint through the finish line to hear the countdown.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {signedIn ? (
                <>
                  <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                    <Link href="/lapquest/setup">Start racing</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    <Link href="/lapquest/history">My runs</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                    <Link href="/lapquest/login">Log in to race</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    <Link href="#how-it-works">See the steps</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
