"use client";

import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type LapRow = {
  n: number;
  elapsed_ms: number;
  lap_time_ms: number;
};

function formatModeLabel(mode: string) {
  switch (mode) {
    case "first_to_n":
      return "Target laps";
    case "time_trial":
      return "Time trial";
    case "distance":
      return "Distance run";
    case "free":
      return "Free run";
    default:
      return mode;
  }
}

function formatDurationMs(durationMs: number) {
  if (!Number.isFinite(durationMs)) return "—";
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  if (totalSeconds < 60) return `${(durationMs / 1000).toFixed(1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatSecondsTarget(targetSeconds: number) {
  if (!Number.isFinite(targetSeconds)) return "—";
  const totalSeconds = Math.max(0, Math.round(targetSeconds));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function formatLapMs(ms: number) {
  if (!Number.isFinite(ms)) return "—";
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatElapsedMs(ms: number) {
  if (!Number.isFinite(ms)) return "—";
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatRunDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmRun, setConfirmRun] = useState<RunRow | null>(null);
  const [lapsOpenRun, setLapsOpenRun] = useState<RunRow | null>(null);
  const [lapsByRun, setLapsByRun] = useState<Record<string, LapRow[]>>({});
  const [lapsLoading, setLapsLoading] = useState(false);
  const [lapsError, setLapsError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const hasRuns = runs.length > 0;

  const summary = useMemo(() => {
    const totalLaps = runs.reduce((sum, run) => sum + run.total_laps, 0);
    const totalTimeMs = runs.reduce((sum, run) => sum + run.duration_ms, 0);
    return {
      runs: runs.length,
      totalLaps,
      totalTimeMs,
    };
  }, [runs]);

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
          window.location.href = "/lapquest/login";
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
          toast({
            variant: "destructive",
            title: "Couldn’t load runs",
            description: result.error.message,
          });
          return;
        }
        setRuns((result.data as RunRow[]) ?? []);
      })
      .catch((error) => {
        if (!isActive) return;
        const message = error instanceof Error ? error.message : "Failed to load runs.";
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

  useEffect(() => {
    if (!lapsOpenRun || !isSupabaseConfigured || !supabase) return;
    const runId = lapsOpenRun.id;
    if (lapsByRun[runId]) return;
    let isActive = true;
    const client = supabase;
    setLapsLoading(true);
    setLapsError(null);
    client
      .from("laps")
      .select("n, elapsed_ms, lap_time_ms")
      .eq("run_id", runId)
      .order("n", { ascending: true })
      .then((result) => {
        if (!isActive) return;
        if (result.error) {
          setLapsError(result.error.message);
          return;
        }
        setLapsByRun((prev) => ({
          ...prev,
          [runId]: (result.data as LapRow[]) ?? [],
        }));
      })
      .catch((error) => {
        if (!isActive) return;
        const message = error instanceof Error ? error.message : "Failed to load laps.";
        setLapsError(message);
      })
      .finally(() => {
        if (!isActive) return;
        setLapsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [lapsByRun, lapsOpenRun]);

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
      .map((r) => {
        const avgLapSec = r.total_laps > 0 ? r.duration_ms / 1000 / r.total_laps : null;
        return {
          date: new Date(r.started_at).toLocaleDateString(),
          avgLapSec: avgLapSec != null ? Number(avgLapSec.toFixed(2)) : null,
          laps: r.total_laps,
          durationSec: Math.round(r.duration_ms / 1000),
        };
      })
      .filter((r) => r.avgLapSec != null);
  }, [runs]);

  const trendTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
        <div className="mt-1 text-zinc-100">
          Avg lap: {data.avgLapSec}s
        </div>
        <div className="text-xs text-zinc-400">
          Laps: {data.laps} · Duration: {formatDurationMs(data.durationSec * 1000)}
        </div>
      </div>
    );
  };

  const lapsForRun = lapsOpenRun ? lapsByRun[lapsOpenRun.id] : null;
  const lapSummary = useMemo(() => {
    if (!lapsForRun || lapsForRun.length === 0) return null;
    const total = lapsForRun.reduce((sum, lap) => sum + lap.lap_time_ms, 0);
    const best = Math.min(...lapsForRun.map((lap) => lap.lap_time_ms));
    const avg = total / lapsForRun.length;
    return { best, avg };
  }, [lapsForRun]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
        <div className="mt-4 text-center text-zinc-300">
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">My runs</h1>
          <p className="mt-2 text-zinc-400">
            See your past sessions at a glance. Each run shows the goal, total time, and laps.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Runs</div>
            <div className="mt-2 text-3xl font-bold text-white">{summary.runs}</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total time</div>
            <div className="mt-2 text-3xl font-bold text-white">{formatDurationMs(summary.totalTimeMs)}</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total laps</div>
            <div className="mt-2 text-3xl font-bold text-white">{summary.totalLaps}</div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-zinc-100">Recent trend</div>
              <div className="text-xs text-zinc-500">Average lap time per run. Lower is faster.</div>
            </div>
          </div>
          <div className="mt-4 h-[280px]">
            {mounted && hasRuns && (
              <ResponsiveContainer width="100%" height="100%" minHeight={260} minWidth={260}>
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
                    tickFormatter={(value) => `${value}s`}
                  />
                  <Tooltip
                    content={trendTooltip}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgLapSec"
                    stroke="#e4e4e7"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            {mounted && !hasRuns && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-zinc-400">
                <div className="text-sm">No runs yet.</div>
                <Button asChild className="h-10 px-4 text-sm font-semibold">
                  <a href="/lapquest/setup">Start a run</a>
                </Button>
              </div>
            )}
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-semibold text-white">All runs</h2>
        <div className="mt-4 grid gap-4">
          {runs.map((r) => {
            const avgLapMs = r.total_laps > 0 ? r.duration_ms / r.total_laps : null;
            const goalLabel =
              r.mode === "free"
                ? "No goal"
                : r.mode === "first_to_n"
                  ? r.target != null
                    ? `${r.target} laps`
                    : "—"
                  : r.mode === "time_trial"
                    ? r.target != null
                      ? formatSecondsTarget(r.target)
                      : "—"
                    : r.mode === "distance" && r.target != null
                      ? formatDistanceTarget(r.target, r.target_unit)
                      : "—";
            return (
              <div key={r.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-zinc-100">
                      {formatRunDateTime(r.started_at)}
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">Mode: {formatModeLabel(r.mode)}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                      onClick={() => {
                        setLapsError(null);
                        setLapsOpenRun(r);
                      }}
                    >
                      View laps
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-9 border-rose-500/40 p-0 text-rose-200 hover:border-rose-500/70 hover:bg-rose-500/10 hover:text-rose-100"
                      onClick={() => setConfirmRun(r)}
                      disabled={deletingId === r.id}
                      aria-label="Delete run"
                      title="Delete run"
                    >
                      {deletingId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Goal</div>
                    <div className="mt-1 text-base font-semibold text-zinc-100">{goalLabel}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total time</div>
                    <div className="mt-1 text-base font-semibold text-zinc-100">{formatDurationMs(r.duration_ms)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total laps</div>
                    <div className="mt-1 text-base font-semibold text-zinc-100">{r.total_laps}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Avg lap</div>
                    <div className="mt-1 text-base font-semibold text-zinc-100">
                      {avgLapMs != null ? `${(avgLapMs / 1000).toFixed(1)}s` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
                {formatRunDateTime(confirmRun.started_at)} · {confirmRun.total_laps} laps ·{" "}
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

        <Dialog open={Boolean(lapsOpenRun)} onOpenChange={(open) => (!open ? setLapsOpenRun(null) : null)}>
          <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
            <DialogHeader>
              <DialogTitle>Lap details</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {lapsOpenRun
                  ? `${formatRunDateTime(lapsOpenRun.started_at)} · ${lapsOpenRun.total_laps} laps · ${formatDurationMs(lapsOpenRun.duration_ms)}`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            {lapsLoading && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
                Loading laps…
              </div>
            )}
            {!lapsLoading && lapsError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                {lapsError}
              </div>
            )}
            {!lapsLoading && !lapsError && lapsForRun && lapsForRun.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
                No laps recorded for this run.
              </div>
            )}
            {!lapsLoading && !lapsError && lapsForRun && lapsForRun.length > 0 && (
              <div className="space-y-4">
                {lapSummary && (
                  <div className="grid gap-3 text-sm text-zinc-200 sm:grid-cols-2">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Best lap</div>
                      <div className="mt-1 text-lg font-semibold text-zinc-100">
                        {formatLapMs(lapSummary.best)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Average lap</div>
                      <div className="mt-1 text-lg font-semibold text-zinc-100">
                        {formatLapMs(lapSummary.avg)}
                      </div>
                    </div>
                  </div>
                )}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-xs uppercase tracking-[0.2em] text-zinc-500">Lap</TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.2em] text-zinc-500">Lap time</TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.2em] text-zinc-500">Elapsed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lapsForRun.map((lap) => (
                        <TableRow key={lap.n} className="border-zinc-800">
                          <TableCell className="font-semibold text-zinc-100">{lap.n}</TableCell>
                          <TableCell className="text-zinc-200">{formatLapMs(lap.lap_time_ms)}</TableCell>
                          <TableCell className="text-zinc-400">{formatElapsedMs(lap.elapsed_ms)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="border-zinc-700 text-zinc-200 hover:bg-zinc-900">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
