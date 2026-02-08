"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SuperbowlHeader } from "@/components/superbowl/header";
import { SuperbowlLoginCta } from "@/components/superbowl/login-cta";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { SuperbowlEvent, SuperbowlQuestion } from "@/lib/superbowl";
import { formatAnswerValue, formatEventTime } from "@/lib/superbowl";

type LeaderboardRow = {
  entry_id: string;
  user_id: string;
  total_points: number | null;
  submitted_at: string | null;
  question_id: string | null;
  answer_value: unknown;
};

type LeaderboardEntry = {
  entryId: string;
  userId: string;
  totalPoints: number | null;
  submittedAt: string | null;
  answers: Record<string, unknown>;
};

export default function SuperbowlLeaderboardPage() {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [event, setEvent] = useState<SuperbowlEvent | null>(null);
  const [questions, setQuestions] = useState<SuperbowlQuestion[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [summary, setSummary] = useState<{ total_entries: number; submitted_entries: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const hasStarted = useMemo(() => {
    if (!event) return false;
    return Date.now() >= new Date(event.starts_at).getTime();
  }, [event]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isActive) return;
      setSession(data.session ?? null);
    };

    void loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
      setEntries([]);
      setQuestions([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    let isActive = true;

    const loadData = async () => {
      setLoading(true);
      const { data: events, error: eventError } = await supabase
        .from("superbowl_events")
        .select("id,name,starts_at,is_active")
        .eq("is_active", true)
        .order("starts_at", { ascending: false })
        .limit(1);

      if (!isActive) return;
      if (eventError) {
        toast({
          variant: "destructive",
          title: "Couldn’t load event",
          description: eventError.message,
        });
        setLoading(false);
        return;
      }

      const activeEvent = events?.[0] ?? null;
      setEvent(activeEvent);

      if (!activeEvent) {
        setLoading(false);
        return;
      }

      const kickoffPassed = Date.now() >= new Date(activeEvent.starts_at).getTime();

      if (!kickoffPassed) {
        const { data: summaryRows, error: summaryError } = await supabase.rpc(
          "superbowl_participant_summary",
          { target_event: activeEvent.id }
        );
        if (!isActive) return;
        if (summaryError) {
          toast({
            variant: "destructive",
            title: "Couldn’t load summary",
            description: summaryError.message,
          });
        } else {
          setSummary(summaryRows?.[0] ?? null);
        }
        setLoading(false);
        return;
      }

      const { data: questionRows, error: questionError } = await supabase
        .from("superbowl_questions")
        .select("*")
        .eq("event_id", activeEvent.id)
        .order("order_index", { ascending: true });

      if (!isActive) return;
      if (questionError) {
        toast({
          variant: "destructive",
          title: "Couldn’t load questions",
          description: questionError.message,
        });
        setLoading(false);
        return;
      }

      setQuestions(questionRows ?? []);

      const { data: leaderboardRows, error: leaderboardError } = await supabase.rpc(
        "get_superbowl_leaderboard",
        { target_event: activeEvent.id }
      );

      if (!isActive) return;
      if (leaderboardError) {
        toast({
          variant: "destructive",
          title: "Couldn’t load leaderboard",
          description: leaderboardError.message,
        });
        setLoading(false);
        return;
      }

      const map = new Map<string, LeaderboardEntry>();
      (leaderboardRows as LeaderboardRow[] | null)?.forEach((row) => {
        if (!row.entry_id) return;
        if (!map.has(row.entry_id)) {
          map.set(row.entry_id, {
            entryId: row.entry_id,
            userId: row.user_id,
            totalPoints: row.total_points,
            submittedAt: row.submitted_at,
            answers: {},
          });
        }
        const entry = map.get(row.entry_id);
        if (entry && row.question_id) {
          entry.answers[row.question_id] = row.answer_value;
        }
      });

      setEntries(Array.from(map.values()));
      setLoading(false);
    };

    void loadData();

    return () => {
      isActive = false;
    };
  }, [session, toast]);

  const rankedEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const pointsA = a.totalPoints ?? 0;
      const pointsB = b.totalPoints ?? 0;
      if (pointsA !== pointsB) return pointsB - pointsA;
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (timeA !== timeB) return timeA - timeB;
      return a.userId.localeCompare(b.userId);
    });

    let lastPoints: number | null = null;
    let rank = 0;

    return sorted.map((entry, index) => {
      const points = entry.totalPoints ?? 0;
      if (lastPoints === null || points !== lastPoints) {
        rank = index + 1;
        lastPoints = points;
      }
      return { ...entry, rank };
    });
  }, [entries]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <h1 className="text-3xl font-semibold">Leaderboard</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Supabase isn’t configured yet. Add NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev
          server.
        </p>
      </div>
    );
  }

  if (!session && !loading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Leaderboard</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Log in with your email to view leaderboard details.
          </p>
        </div>
        <SuperbowlLoginCta redirectPath="/superbowl/leaderboard" label="Log in to view leaderboard" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <SuperbowlHeader
        title="Leaderboard"
        description={event ? `${event.name} · ${formatEventTime(event.starts_at)}` : "Loading event"}
      />

      {loading ? (
        <Card>
          <CardContent className="py-10 text-sm text-neutral-500">Loading leaderboard…</CardContent>
        </Card>
      ) : !event ? (
        <Card>
          <CardContent className="py-10 text-sm text-neutral-500">No active event.</CardContent>
        </Card>
      ) : !hasStarted ? (
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard is hidden until kickoff</CardTitle>
            <CardDescription>We’ll reveal answers once the game starts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <div>Participants: {summary?.total_entries ?? 0}</div>
            <div>Submitted: {summary?.submitted_entries ?? 0}</div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Rankings</CardTitle>
              <CardDescription>Ranks break ties by earliest submission.</CardDescription>
            </CardHeader>
            <CardContent>
              {rankedEntries.length === 0 ? (
                <div className="text-sm text-neutral-500">No submitted entries yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedEntries.map((entry) => (
                      <TableRow key={entry.entryId}>
                        <TableCell className="font-semibold">#{entry.rank}</TableCell>
                        <TableCell>Participant {entry.userId.slice(0, 8)}</TableCell>
                        <TableCell>{entry.totalPoints ?? "—"}</TableCell>
                        <TableCell>
                          {entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Picks (revealed)</CardTitle>
              <CardDescription>All submitted picks are visible after kickoff.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rankedEntries.length === 0 ? (
                <div className="text-sm text-neutral-500">No picks submitted yet.</div>
              ) : (
                rankedEntries.map((entry) => (
                  <details key={entry.entryId} className="rounded-lg border border-neutral-200 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Participant {entry.userId.slice(0, 8)} · {entry.totalPoints ?? "—"} pts
                    </summary>
                    <div className="mt-4 space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                      {questions.map((question) => (
                        <div key={question.id} className="flex flex-wrap items-start justify-between gap-3">
                          <div className="font-medium text-neutral-800 dark:text-neutral-100">
                            {question.label}
                          </div>
                          <div>{formatAnswerValue(question, entry.answers[question.id])}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div>
        <Button asChild variant="outline">
          <Link href="/superbowl">Back to overview</Link>
        </Button>
      </div>
    </div>
  );
}
