"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

type RunRow = {
  id: string;
  started_at: string;
  total_laps: number;
  duration_ms: number;
  mode: string;
  target: number | null;
  target_unit: "m" | "mi" | null;
};

function formatDistanceTarget(targetMeters: number, unit: "m" | "mi" | null) {
  if (!Number.isFinite(targetMeters)) return "—";
  if (unit === "mi") {
    const miles = targetMeters / 1609.344;
    const digits = miles >= 10 ? 1 : miles >= 1 ? 2 : 3;
    return `${miles.toFixed(digits)} mi`;
  }
  const metersText =
    targetMeters >= 100 ? targetMeters.toFixed(0) : targetMeters >= 10 ? targetMeters.toFixed(1) : targetMeters.toFixed(2);
  return `${metersText} m`;
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [status, setStatus] = useState<string>(() =>
    isSupabaseConfigured ? "Loading…" : "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmRun, setConfirmRun] = useState<RunRow | null>(null);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let isActive = true;
    const client = supabase;

    client.auth
      .getSession()
      .then(({ data: session }) => {
        if (!isActive) return null;
        if (!session.session) {
          setStatus("");
          toast({
            variant: "destructive",
            title: "Sign in required",
            description: "Log in to view your run history.",
            action: (
              <ToastAction
                altText="Open login page"
                onClick={() => {
                  window.location.href = "/lapquest/login";
                }}
              >
                Open login
              </ToastAction>
            ),
          });
          return null;
        }
        return client
          .from("runs")
          .select("id, started_at, total_laps, duration_ms, mode, target, target_unit")
          .order("started_at", { ascending: false })
          .limit(100);
      })
      .then((result) => {
        if (!isActive || !result) return;
        if (result.error) {
          setStatus("");
          toast({
            variant: "destructive",
            title: "Couldn’t load runs",
            description: result.error.message,
          });
          return;
        }
        setRuns((result.data as RunRow[]) ?? []);
        setStatus("");
      })
      .catch((error) => {
        if (!isActive) return;
        const message = error instanceof Error ? error.message : "Failed to load runs.";
        setStatus("");
        toast({
          variant: "destructive",
          title: "Couldn’t load runs",
          description: message,
        });
      });

    return () => {
      isActive = false;
    };
  }, [toast]);

  const handleDeleteConfirmed = async () => {
    const client = supabase;
    if (!client || !confirmRun) return;
    const runId = confirmRun.id;
    setDeletingId(runId);
    try {
      const result = await client.from("runs").delete().eq("id", runId);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: result.error.message,
        });
        return;
      }
      setRuns((prev) => prev.filter((run) => run.id !== runId));
      setConfirmRun(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete run.";
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: message,
      });
    } finally {
      setDeletingId((prev) => (prev === runId ? null : prev));
    }
  };

  const chartData = useMemo(() => {
    return runs
      .slice()
      .reverse()
      .map((r) => ({
        date: new Date(r.started_at).toLocaleDateString(),
        laps: r.total_laps,
        seconds: Math.round(r.duration_ms / 1000),
      }));
  }, [runs]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
        <header className="flex flex-col items-center justify-between gap-3 md:flex-row md:items-end">
          <div className="text-center md:text-left">
            <Link href="/lapquest" className="text-4xl font-black tracking-tight text-white md:text-5xl">
              LapQuest
            </Link>
          </div>
        </header>

        <div className="mt-4 text-center text-zinc-300">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            History
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Review your runs
          </h1>
          <p className="mt-2 text-zinc-400">
            Track your lap totals, run durations, and see how your sessions stack up.
          </p>
          {status && <p className="mt-3 text-sm text-zinc-500">{status}</p>}
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <div className="h-[300px]">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={300}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    stroke="#3f3f46"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    tickLine={{ stroke: "#3f3f46" }}
                  />
                  <YAxis
                    stroke="#3f3f46"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    tickLine={{ stroke: "#3f3f46" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f0f10",
                      border: "1px solid #27272a",
                      borderRadius: 12,
                      color: "#e4e4e7",
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                  />
                  <Line type="monotone" dataKey="laps" stroke="#e4e4e7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-semibold text-white">Runs</h2>
        <div className="mt-4 grid gap-4">
          {runs.map((r) => (
            <div key={r.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-lg font-semibold text-zinc-100">
                  {new Date(r.started_at).toLocaleString()} — {r.total_laps} laps
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRun(r)}
                  className="rounded-md border border-rose-500/40 px-3 py-1 text-sm font-semibold text-rose-200 transition hover:border-rose-500/70 hover:text-rose-100"
                  disabled={deletingId === r.id}
                >
                  {deletingId === r.id ? "Deleting..." : "Delete"}
                </button>
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                Mode:{" "}
                {r.mode === "distance"
                  ? `distance (target ${r.target != null ? formatDistanceTarget(r.target, r.target_unit) : "—"})`
                  : r.mode}{" "}
                {r.mode !== "distance" && r.target != null ? `(target ${r.target})` : ""} · Duration:{" "}
                {(r.duration_ms / 1000).toFixed(1)}s
              </div>
            </div>
          ))}
        </div>

        <Dialog open={Boolean(confirmRun)} onOpenChange={(open) => (!open ? setConfirmRun(null) : null)}>
          <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
            <DialogHeader>
              <DialogTitle>Delete this run?</DialogTitle>
              <DialogDescription className="text-zinc-400">
                This will permanently remove the run and its laps.
              </DialogDescription>
            </DialogHeader>
            {confirmRun && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-sm text-zinc-300">
                {new Date(confirmRun.started_at).toLocaleString()} · {confirmRun.total_laps} laps ·{" "}
                {(confirmRun.duration_ms / 1000).toFixed(1)}s
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                  disabled={deletingId === confirmRun?.id}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleDeleteConfirmed}
                className="bg-rose-600 text-white hover:bg-rose-500"
                disabled={deletingId === confirmRun?.id}
              >
                {deletingId === confirmRun?.id ? "Deleting..." : "Delete run"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
