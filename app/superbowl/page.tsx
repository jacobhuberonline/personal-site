"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SuperbowlHeader } from "@/components/superbowl/header";
import { SuperbowlLoginCta } from "@/components/superbowl/login-cta";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { SuperbowlEntry, SuperbowlEvent } from "@/lib/superbowl";
import { formatEventTime } from "@/lib/superbowl";

export default function SuperbowlHomePage() {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<SuperbowlEvent | null>(null);
  const [entry, setEntry] = useState<SuperbowlEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const hasStarted = useMemo(() => {
    if (!event) return false;
    return Date.now() >= new Date(event.starts_at).getTime();
  }, [event]);

  const statusLabel = useMemo(() => {
    if (!entry) return hasStarted ? "Locked by kickoff" : "Not started";
    if (entry.status === "submitted") return "Submitted";
    if (hasStarted) return "Locked by kickoff";
    return "Draft saved";
  }, [entry, hasStarted]);

  const nextStep = useMemo(() => {
    if (!session || !event) return null;
    if (hasStarted) {
      return entry?.status === "submitted"
        ? "Kickoff has passed. View the leaderboard."
        : "Kickoff has passed. Picks are locked; you can still submit.";
    }
    if (!entry) {
      return "Start your picks to save a draft.";
    }
    if (entry.status === "submitted") {
      return "You’re all set. View the leaderboard after kickoff.";
    }
    return "Finish your picks and submit before kickoff.";
  }, [entry, event, hasStarted, session]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;
    let isActive = true;

    const loadSession = async () => {
      const { data } = await client.auth.getSession();
      if (!isActive) return;
      setSession(data.session ?? null);
    };

    void loadSession();

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!isActive) return;
      setSession(nextSession ?? null);
    });

    return () => {
      isActive = false;
      data?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      setEvent(null);
      setEntry(null);
      setLoading(false);
      return;
    }

    const client = supabase;
    let isActive = true;

    const loadEventAndEntry = async () => {
      setLoading(true);
      const { data: events, error: eventError } = await client
        .from("superbowl_events")
        .select("id,name,starts_at,is_active")
        .eq("is_active", true)
        .order("starts_at", { ascending: false })
        .limit(1);

      if (!isActive) return;
      if (eventError) {
        toast({
          variant: "destructive",
          title: "Couldn’t load Super Bowl event",
          description: eventError.message,
        });
        setEvent(null);
        setEntry(null);
        setLoading(false);
        return;
      }

      const activeEvent = events?.[0] ?? null;
      setEvent(activeEvent);

      if (!activeEvent) {
        setEntry(null);
        setLoading(false);
        return;
      }

      const { data: entryData, error: entryError } = await client
        .from("superbowl_entries")
        .select("*")
        .eq("event_id", activeEvent.id)
        .maybeSingle();

      if (!isActive) return;
      if (entryError) {
        toast({
          variant: "destructive",
          title: "Couldn’t load your picks",
          description: entryError.message,
        });
        setEntry(null);
      } else {
        setEntry(entryData ?? null);
      }

      setLoading(false);
    };

    void loadEventAndEntry();

    return () => {
      isActive = false;
    };
  }, [session, toast]);

  const handleSubmit = async () => {
    if (!session || !event) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/superbowl/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ eventId: event.id }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Unable to submit picks.");
      }
      toast({
        title: "Picks submitted",
        description: "Your picks are locked in.",
      });
      setEntry(payload.entry ?? entry);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error?.message ?? "Try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <h1 className="text-3xl font-semibold">Super Bowl Props</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Supabase isn’t configured yet. Add NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev
          server.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <SuperbowlHeader
        title="Super Bowl LX Picks"
        description="Pick Super Bowl props, submit any time, and see the leaderboard after the game starts."
      />

      <Card>
        <CardHeader>
          <CardTitle>Your status</CardTitle>
          <CardDescription>
            {event
              ? `${event.name} · Kickoff ${formatEventTime(event.starts_at)}`
              : session
                ? "No active event"
                : "Sign in to view event details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-neutral-500">Loading your status…</div>
          ) : !session ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                Sign in to start your picks
              </div>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                We’ll email you a one-time code. No password needed.
              </p>
              <div className="mt-5">
                <SuperbowlLoginCta redirectPath="/superbowl" label="Sign in to start picks" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-neutral-600 dark:text-neutral-300">
                Status: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{statusLabel}</span>
              </div>
              {nextStep ? (
                <div className="text-sm text-neutral-600 dark:text-neutral-300">Next: {nextStep}</div>
              ) : null}
              {hasStarted ? (
                <div className="text-sm text-amber-600 dark:text-amber-400">
                  {entry?.status === "submitted"
                    ? "Kickoff has passed. Picks are locked."
                    : "Kickoff has passed. Picks are locked, but you can still submit."}
                </div>
              ) : (
                <div className="text-sm text-neutral-500">
                  Picks lock at kickoff: {event ? formatEventTime(event.starts_at) : "—"}.
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          {session ? (
            <>
              <Button asChild disabled={hasStarted || !event}>
                <Link href="/superbowl/picks">{entry ? "Edit picks" : "Start picks"}</Link>
              </Button>
              <Button
                variant="secondary"
                onClick={handleSubmit}
                disabled={!entry || submitting || entry?.status === "submitted"}
              >
                {submitting ? "Submitting…" : "Submit picks"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/superbowl/leaderboard">View leaderboard</Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="outline">
              <Link href="/superbowl/leaderboard">View leaderboard</Link>
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick steps</CardTitle>
          <CardDescription>Classic picks flow, start to finish.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600 dark:text-neutral-300">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Log in with your email.</li>
            <li>Make your picks (autosaves drafts).</li>
            <li>Submit to lock (picks lock automatically at kickoff).</li>
            <li>After kickoff, the leaderboard reveals answers and scores.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
