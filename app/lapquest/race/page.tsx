"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLapquestSerial } from "@/components/lapquest/serial-provider";
import { initialRaceState, reduceRace, type Mode, type RaceConfig, type RaceState } from "@/lib/raceEngine";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

type Course = {
  id: string;
  name: string;
  lap_distance_in: number | null;
};

function formatLapDistance(inches: number | null | undefined) {
  if (!inches || !Number.isFinite(inches)) return null;
  const meters = inches * 0.0254;
  if (meters >= 1000) {
    const miles = meters / 1609.344;
    const digits = miles >= 10 ? 1 : 2;
    return `${miles.toFixed(digits)} mi/lap`;
  }
  const metersText = meters >= 100 ? meters.toFixed(0) : meters >= 10 ? meters.toFixed(1) : meters.toFixed(2);
  return `${metersText} m/lap`;
}

function formatTotalDistance(inches: number | null | undefined) {
  if (!inches || !Number.isFinite(inches)) return null;
  const meters = inches * 0.0254;
  if (meters >= 1000) {
    const miles = meters / 1609.344;
    const digits = miles >= 10 ? 1 : 2;
    return `${miles.toFixed(digits)} mi`;
  }
  const metersText = meters >= 100 ? meters.toFixed(0) : meters >= 10 ? meters.toFixed(1) : meters.toFixed(2);
  return `${metersText} m`;
}

function formatImperialTooltip(inches: number | null | undefined) {
  if (!inches || !Number.isFinite(inches)) return null;
  const feet = inches / 12;
  const miles = feet / 5280;
  const milesText = miles >= 10 ? miles.toFixed(1) : miles >= 1 ? miles.toFixed(2) : miles.toFixed(3);
  const feetText = `${Math.round(feet)} ft`;
  return `${milesText} mi · ${feetText}`;
}

function formatDistanceForDisplay(meters: number, unit: "m" | "mi") {
  const value = unit === "mi" ? meters / 1609.344 : meters;
  const rounded = value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
  return { value: rounded, unit };
}

function msToSec(ms: number) {
  return (ms / 1000).toFixed(2);
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function RacePageContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const targetParam = searchParams.get("target");
  const courseParam = searchParams.get("course");
  const distanceParam = searchParams.get("distance");
  const distanceUnitParam = searchParams.get("distanceUnit");
  const selectedCourseId = courseParam ?? null;
  const mode: Mode =
    modeParam === "free" || modeParam === "first_to_n" || modeParam === "time_trial" || modeParam === "distance"
      ? modeParam
      : "first_to_n";
  const parsedTarget = targetParam ? Number(targetParam) : undefined;
  const target = Number.isFinite(parsedTarget) ? parsedTarget : undefined;
  const distanceUnit = distanceUnitParam === "mi" ? "mi" : "m";
  const parsedDistance = distanceParam ? Number(distanceParam) : undefined;
  const distanceMeters =
    Number.isFinite(parsedDistance) && parsedDistance != null
      ? distanceUnit === "mi"
        ? parsedDistance * 1609.344
        : parsedDistance
      : null;

  const serial = useLapquestSerial();
  const [state, setState] = useState<RaceState>(initialRaceState());
  const [nowPerf, setNowPerf] = useState(0);
  const [beamStatus, setBeamStatus] = useState<0 | 1 | null>(null);
  const [lastStatusPerf, setLastStatusPerf] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [bestLapDbMs, setBestLapDbMs] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const lapDistanceMeters = selectedCourse?.lap_distance_in
    ? selectedCourse.lap_distance_in * 0.0254
    : null;
  const distanceTargetLaps =
    mode === "distance" && lapDistanceMeters != null && distanceMeters != null && distanceMeters > 0
      ? Math.ceil(distanceMeters / lapDistanceMeters)
      : null;

  const cfg: RaceConfig = useMemo(
    () => ({
      mode,
      target: mode === "free" ? undefined : mode === "distance" ? distanceTargetLaps ?? undefined : target,
      countdownSec: 3,
      lapLockoutMs: 2000,
      startBeamDelayMs: 5000,
    }),
    [distanceTargetLaps, mode, target]
  );
  const { toast } = useToast();
  const statusWindowMs = 1500;
  const beamMisalignBufferMs = 600;
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<{
    three: HTMLAudioElement | null;
    two: HTMLAudioElement | null;
    one: HTMLAudioElement | null;
    go: HTMLAudioElement | null;
    finish: HTMLAudioElement | null;
    lastLap: HTMLAudioElement | null;
  }>({
    three: null,
    two: null,
    one: null,
    go: null,
    finish: null,
    lastLap: null,
  });
  const lastSavedEndedAtRef = useRef<number | null>(null);
  const lastAutoSaveAttemptRef = useRef<number | null>(null);
  const gateReadyRef = useRef(false);
  const lastBeamStatusRef = useRef<0 | 1 | null>(null);
  const beamBlockStartPerfRef = useRef<number | null>(null);
  const lastCountdownRef = useRef<number | null>(null);
  const lastLapCueRef = useRef(false);

  const [goFlashUntilPerf, setGoFlashUntilPerf] = useState<number | null>(null);
  const [lastLapCueUntilPerf, setLastLapCueUntilPerf] = useState<number | null>(null);
  const prevPhaseRef = useRef<RaceState["phase"]>("idle");

  // Serial line handler
  useEffect(() => {
    serial.setOnLine((line) => {
      const msg = line.trim().toUpperCase();
      const perfNow = performance.now();
      if (msg.startsWith("STATUS")) {
        const parts = msg.split(/\s+/);
        const value = Number(parts[1]);
        if (value === 0 || value === 1) {
          if (value === 0 && lastBeamStatusRef.current !== 0) {
            beamBlockStartPerfRef.current = perfNow;
          }
          if (value === 1) {
            beamBlockStartPerfRef.current = null;
          }
          lastBeamStatusRef.current = value;
          setBeamStatus(value);
          setLastStatusPerf(perfNow);
        }
      }
      if (msg === "BTN") {
        setState((s) => reduceRace(cfg, s, { type: "BTN", allowStart: gateReadyRef.current }));
      }
      if (msg === "BEAM") setState((s) => reduceRace(cfg, s, { type: "BEAM" }));
    });
    return () => {
      serial.setOnLine(() => {});
    };
  }, [cfg, serial]);

  // Tick loop (countdown + time_trial finish)
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const perfNow = performance.now();
      setNowPerf(perfNow);
      setState((s) => reduceRace(cfg, s, { type: "TICK", nowPerf: perfNow }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cfg]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const three = new Audio("/lapquest/audio/countdown-3.mp3");
    const two = new Audio("/lapquest/audio/countdown-2.mp3");
    const one = new Audio("/lapquest/audio/countdown-1.mp3");
    const go = new Audio("/lapquest/audio/go.mp3");
    const lastLap = new Audio("/lapquest/audio/last-lap.mp3");
    const finish = new Audio("/lapquest/audio/finish.mp3");
    [three, two, one, go, finish, lastLap].forEach((audio) => {
      audio.preload = "auto";
      audio.volume = 0.9;
    });
    audioRef.current = { three, two, one, go, finish, lastLap };
    return () => {
      audioRef.current = { three: null, two: null, one: null, go: null, finish: null, lastLap: null };
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!selectedCourseId || !isSupabaseConfigured || !client) {
      setSelectedCourse(null);
      return;
    }

    let isActive = true;
    const loadCourse = async () => {
      try {
        const session = await client.auth.getSession();
        if (!isActive) return;
        if (!session.data.session) {
          setSelectedCourse(null);
          return;
        }

        const result = await client
          .from("courses")
          .select("id, name, lap_distance_in")
          .eq("id", selectedCourseId)
          .single();
        if (!isActive) return;
        if (result.error) {
          setSelectedCourse(null);
          return;
        }

        setSelectedCourse((result.data as Course) ?? null);
      } catch {
        if (!isActive) return;
        setSelectedCourse(null);
      }
    };

    void loadCourse();

    return () => {
      isActive = false;
    };
  }, [selectedCourseId]);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((frequency: number, durationMs: number, type: OscillatorType = "sine") => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  }, []);

  const playAudio = useCallback((key: "three" | "two" | "one" | "go" | "finish" | "lastLap") => {
    const audio = audioRef.current[key];
    if (!audio) return false;
    try {
      audio.currentTime = 0;
      const res = audio.play();
      if (res && typeof res.catch === "function") {
        res.catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const triggerLastLapCue = useCallback(() => {
    lastLapCueRef.current = true;
    setLastLapCueUntilPerf(performance.now() + 2200);
    if (!playAudio("lastLap")) {
      playTone(659, 260, "triangle");
    }
  }, [playAudio, playTone]);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    if (prev === "countdown" && state.phase === "running") {
      setGoFlashUntilPerf(performance.now() + 700);
      if (!playAudio("go")) {
        playTone(784, 220, "triangle");
      }
    }
    if (prev !== "finished" && state.phase === "finished") {
      if (!playAudio("finish")) {
        playTone(392, 240, "triangle");
      }
    }
    if (state.phase === "idle" || state.phase === "finished") {
      setGoFlashUntilPerf(null);
    }
    prevPhaseRef.current = state.phase;
  }, [playAudio, playTone, state.phase]);

  const laps = state.phase === "running" || state.phase === "finished" ? state.laps : 0;
  const lastLapMs =
    state.phase === "running" || state.phase === "finished" ? (state.lapTimesMs.at(-1) ?? null) : null;
  const bestLapMs =
    state.phase === "running" || state.phase === "finished"
      ? Math.min(...(state.lapTimesMs.length ? state.lapTimesMs : [Infinity]))
      : null;
  const bestLapDisplayMs = bestLapDbMs ?? bestLapMs;
  const raceDurationMs =
    state.phase === "finished" ? Math.round(state.endedAtPerf - state.startedAtPerf) : null;
  const avgLapMs =
    state.phase === "finished" && state.laps > 0 && raceDurationMs != null ? raceDurationMs / state.laps : null;
  const runningElapsedMs = state.phase === "running" ? Math.max(0, nowPerf - state.startedAtPerf) : null;
  const distanceRemainingMeters =
    mode === "distance" && lapDistanceMeters != null && distanceMeters != null
      ? Math.max(0, distanceMeters - laps * lapDistanceMeters)
      : null;
  const distanceRemainingDisplay =
    distanceRemainingMeters != null ? formatDistanceForDisplay(distanceRemainingMeters, distanceUnit) : null;
  const distanceTargetDisplay =
    distanceMeters != null ? formatDistanceForDisplay(distanceMeters, distanceUnit) : null;
  const totalDistanceLabel =
    selectedCourse?.lap_distance_in && laps > 0
      ? formatTotalDistance(selectedCourse.lap_distance_in * laps)
      : null;
  const lapDistanceTooltip = selectedCourse?.lap_distance_in
    ? formatImperialTooltip(selectedCourse.lap_distance_in)
    : null;
  const totalDistanceTooltip =
    selectedCourse?.lap_distance_in && laps > 0
      ? formatImperialTooltip(selectedCourse.lap_distance_in * laps)
      : null;

  const countdownLeft =
    state.phase === "countdown" ? Math.max(0, Math.ceil((state.endsAtPerf - nowPerf) / 1000)) : null;
  const statusAgeMs = lastStatusPerf != null ? nowPerf - lastStatusPerf : null;
  const statusFresh = statusAgeMs != null && statusAgeMs <= statusWindowMs;
  const beamBlockedLong =
    beamStatus === 0 &&
    beamBlockStartPerfRef.current != null &&
    nowPerf - beamBlockStartPerfRef.current > beamMisalignBufferMs;
  const beamAligned = beamStatus === 1 || (beamStatus === 0 && !beamBlockedLong);

  const countdownText =
    state.phase === "countdown"
      ? countdownLeft === 0
        ? "GO!"
        : String(countdownLeft)
      : null;

  useEffect(() => {
    if (state.phase !== "countdown" || countdownLeft == null) {
      lastCountdownRef.current = null;
      return;
    }
    if (lastCountdownRef.current === countdownLeft) return;
    lastCountdownRef.current = countdownLeft;
    if (countdownLeft > 0) {
      const freq = countdownLeft === 3 ? 440 : countdownLeft === 2 ? 494 : 523;
      const key = countdownLeft === 3 ? "three" : countdownLeft === 2 ? "two" : "one";
      if (!playAudio(key)) {
        playTone(freq, 140, "triangle");
      }
    }
  }, [countdownLeft, playAudio, playTone, state.phase]);

  const showGoOverlay = goFlashUntilPerf != null && nowPerf < goFlashUntilPerf;
  const showLastLapCue = lastLapCueUntilPerf != null && nowPerf < lastLapCueUntilPerf;

  const instruction = cfg.mode === "free" ? "Run through the beam to count laps." : null;
  const targetLabel =
    cfg.mode === "free"
      ? null
      : cfg.mode === "first_to_n"
        ? `Target: ${cfg.target} laps`
        : cfg.mode === "time_trial"
          ? `Target: ${cfg.target} seconds`
          : distanceTargetDisplay
            ? `Target: ${distanceTargetDisplay.value} ${distanceTargetDisplay.unit} (${distanceTargetLaps ?? "—"} laps)`
            : "Target: distance";

  const gateLabel = !serial.connected
    ? "Waiting…"
    : !statusFresh
      ? "Checking…"
      : state.phase === "running" && beamStatus === 0
        ? "Triggered"
        : beamAligned
          ? "Clear"
          : "Align";

  const gatePillClass = !serial.connected
    ? "border-zinc-800/60 bg-zinc-950/40 text-zinc-500"
    : !statusFresh
      ? "border-zinc-800/60 bg-zinc-950/50 text-zinc-400"
      : state.phase === "running" && beamStatus === 0
        ? "border-rose-500/20 bg-rose-500/5 text-rose-200/80"
        : beamAligned
          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200/80"
          : "border-rose-500/20 bg-rose-500/5 text-rose-200/80";

  const timerPillClass = serial.connected
    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200/80"
    : "border-amber-500/20 bg-amber-500/5 text-amber-200/80";

  const gateReady = serial.connected && statusFresh && beamAligned;
  useEffect(() => {
    gateReadyRef.current = gateReady;
  }, [gateReady]);

  const preStartTitle = !serial.connected
    ? "Connect the lap counter"
    : !statusFresh
      ? "Checking sensors…"
      : beamAligned
        ? "Ready"
        : "Line up the sensors";

  const preStartSubtitle = !serial.connected
    ? "Press Connect to get started."
    : !statusFresh
      ? "Hold still for a moment."
      : beamAligned
        ? "Stand behind the beam. Press the button to start."
        : "Line them up until the beam says CLEAR.";

  const timeTrialLeftSec =
    cfg.mode === "time_trial" && cfg.target && state.phase === "running"
      ? Math.max(0, Math.ceil((state.startedAtPerf + cfg.target * 1000 - nowPerf) / 1000))
      : null;

  useEffect(() => {
    if (state.phase !== "running") {
      lastLapCueRef.current = false;
      if (lastLapCueUntilPerf != null) setLastLapCueUntilPerf(null);
      return;
    }
    if (lastLapCueRef.current) return;

    if ((cfg.mode === "first_to_n" || cfg.mode === "distance") && cfg.target != null) {
      if (laps === Math.max(0, cfg.target - 1)) {
        triggerLastLapCue();
      }
      return;
    }

    if (cfg.mode === "time_trial" && timeTrialLeftSec != null && cfg.target) {
      const thresholdSec = Math.max(1, Math.ceil(cfg.target * 0.1));
      if (timeTrialLeftSec <= thresholdSec) {
        triggerLastLapCue();
      }
    }
  }, [
    cfg.mode,
    cfg.target,
    laps,
    lastLapCueUntilPerf,
    state.phase,
    timeTrialLeftSec,
    triggerLastLapCue,
  ]);

  const primaryLabel =
    state.phase === "idle"
      ? serial.connected
        ? "Start"
        : "Connect"
      : state.phase === "countdown"
        ? "Get ready…"
        : state.phase === "running"
          ? "Stop"
          : "Run again";

  const primaryDisabled =
    state.phase === "countdown" ||
    (state.phase === "idle" && ((serial.connected && !gateReady) || (!serial.connected && !serial.supported)));

  const onPrimary = () => {
    if (state.phase === "idle" && !serial.connected) {
      ensureAudioContext();
      void serial.connect();
      return;
    }

    if (state.phase === "finished") {
      setState((s) => reduceRace(cfg, s, { type: "RESET" }));
      return;
    }

    if (state.phase === "idle" && !gateReady) {
      toast({
        title: "Not ready yet",
        description: "Wait until the beam says CLEAR.",
      });
      return;
    }

    ensureAudioContext();
    setState((s) => reduceRace(cfg, s, { type: "BTN", allowStart: gateReady }));
  };

  const goalPct =
    (cfg.mode === "first_to_n" || cfg.mode === "distance") && cfg.target
      ? Math.max(0, Math.min(100, (laps / cfg.target) * 100))
      : null;

  const saveRun = useCallback(async (snapshot: Extract<RaceState, { phase: "finished" }>) => {
    if (saveStatus === "saving") return;
    if (lastSavedEndedAtRef.current === snapshot.endedAtPerf) return;
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      toast({
        variant: "destructive",
        title: "Supabase isn’t configured",
        description:
          "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.",
      });
      return;
    }

    const session = await client.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      window.location.href = "/lapquest/login";
      return;
    }

    setSaveStatus("saving");

    // Build lap records (elapsed is cumulative sum of lapTimes)
    let elapsed = 0;
    const lapsPayload = snapshot.lapTimesMs.map((lapTimeMs, i) => {
      elapsed += lapTimeMs;
      return { n: i + 1, elapsedMs: elapsed, lapTimeMs };
    });

    const durationMs = Math.round(snapshot.endedAtPerf - snapshot.startedAtPerf);
    const saveTarget =
      cfg.mode === "distance" ? (distanceMeters != null ? Math.round(distanceMeters) : null) : cfg.target ?? null;
    const saveTargetUnit = cfg.mode === "distance" ? distanceUnit : null;

    // Convert perf timestamps to ISO approximations (good enough for your use)
    const nowEpoch = Date.now();
    const startedAtIso = new Date(nowEpoch - Math.round(performance.now() - snapshot.startedAtPerf)).toISOString();
    const endedAtIso = new Date(nowEpoch - Math.round(performance.now() - snapshot.endedAtPerf)).toISOString();

    try {
      const res = await fetch("/api/lapquest/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mode: cfg.mode,
          target: saveTarget,
          targetUnit: saveTargetUnit,
          courseId: selectedCourseId,
          startedAtIso,
          endedAtIso,
          durationMs,
          totalLaps: snapshot.laps,
          laps: lapsPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSaveStatus("idle");
        toast({
          variant: "destructive",
          title: "Save failed",
          description: json.error ?? "Something went wrong while saving your run.",
        });
        return;
      }

      lastSavedEndedAtRef.current = snapshot.endedAtPerf;
      setSaveStatus("saved");
      setBestLapDbMs((prev) => {
        const bestThisRun = snapshot.lapTimesMs.length
          ? Math.min(...snapshot.lapTimesMs)
          : null;
        if (bestThisRun == null || !Number.isFinite(bestThisRun)) return prev;
        if (prev == null) return bestThisRun;
        return Math.min(prev, bestThisRun);
      });
    } catch (error) {
      setSaveStatus("idle");
      const message = error instanceof Error ? error.message : "Something went wrong while saving your run.";
      toast({
        variant: "destructive",
        title: "Save failed",
        description: message,
      });
    }
  }, [cfg.mode, cfg.target, distanceMeters, distanceUnit, saveStatus, selectedCourseId, toast]);

  useEffect(() => {
    if (state.phase !== "finished") {
      if (saveStatus !== "idle") setSaveStatus("idle");
      return;
    }
    if (lastAutoSaveAttemptRef.current === state.endedAtPerf) return;
    lastAutoSaveAttemptRef.current = state.endedAtPerf;
    void saveRun(state);
  }, [saveRun, saveStatus, state]);

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const loadBestLap = async () => {
      const session = await client.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return;

      try {
        const res = await fetch("/api/lapquest/best-lap", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (typeof json.bestLapMs === "number") {
          setBestLapDbMs(json.bestLapMs);
        }
      } catch {
        // ignore best lap fetch failures
      }
    };

    void loadBestLap();
  }, [isSupabaseConfigured, supabase]);

  if (state.phase === "countdown") {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen w-full items-center justify-center">
          <div className="text-[clamp(96px,18vw,220px)] font-black leading-none">{countdownText}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {showGoOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
          <div className="text-[clamp(96px,18vw,240px)] font-black leading-none">GO!</div>
        </div>
      )}
      {showLastLapCue && (
        <div className="pointer-events-none fixed inset-0 z-40 last-lap-flash" />
      )}
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pt-2 pb-6">
        <header className="flex flex-col items-center justify-between gap-3 md:flex-row md:items-center">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-zinc-500">
            {targetLabel}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
            <div className={`rounded-full border px-3 py-1 text-xs ${timerPillClass}`}>
              Tracker: {serial.connected ? "Ready" : "Not ready"}
            </div>
            <div className={`rounded-full border px-3 py-1 text-xs ${gatePillClass}`}>Gate: {gateLabel}</div>
          </div>
        </header>

        {state.phase === "running" && goalPct != null && cfg.target != null && (
          <div className="mt-2 flex w-full items-center gap-1 text-xs text-zinc-400">
            <div className="min-w-[48px] text-left">
              {laps} / {cfg.target}
            </div>
            <div className="h-4 flex-1 rounded-full bg-zinc-800">
              <div className="h-4 rounded-full bg-white/80" style={{ width: `${goalPct}%` }} />
            </div>
          </div>
        )}

        {state.phase === "idle" && instruction && (
          <div className="mt-4 text-center text-zinc-300">
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              {instruction}
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          {state.phase === "running" ? (
            <div className="flex w-full flex-col items-center gap-8">
              {cfg.mode === "time_trial" || cfg.mode === "free" || cfg.mode === "distance" ? (
                <div className="grid w-full max-w-6xl items-center gap-12 text-center md:grid-cols-2 md:gap-24 lg:gap-32">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs uppercase tracking-[0.4em] text-zinc-500">
                      {cfg.mode === "time_trial"
                        ? "Time left"
                        : cfg.mode === "distance"
                          ? "Distance left"
                          : "Elapsed"}
                    </div>
                    <div className="text-[clamp(200px,20vw,360px)] font-black leading-none text-white">
                      {cfg.mode === "time_trial" ? (
                        <>
                          {timeTrialLeftSec ?? 0}
                          <span className="ml-2 text-[0.35em] font-semibold text-zinc-400">s</span>
                        </>
                      ) : cfg.mode === "distance" ? (
                        <>
                          {distanceRemainingDisplay?.value ?? "—"}
                          <span className="ml-2 text-[0.35em] font-semibold text-zinc-400">
                            {distanceRemainingDisplay?.unit ?? ""}
                          </span>
                        </>
                      ) : runningElapsedMs != null ? (
                        formatElapsed(runningElapsedMs)
                      ) : (
                        "0:00"
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-xs uppercase tracking-[0.4em] text-zinc-500">Laps</div>
                    <div className="text-[clamp(200px,20vw,360px)] font-black leading-none tracking-[0.02em] text-white">
                      {laps}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="text-5xl font-semibold text-zinc-300">Laps</div>
                  <div className="text-[clamp(240px,28vw,360px)] font-black leading-none tracking-[0.02em]">
                    {laps}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-8 text-2xl text-zinc-300">
                <div>Last lap: {lastLapMs != null ? `${msToSec(lastLapMs)}s` : "—"}</div>
                <div>
                  Best this run: {bestLapMs != null && bestLapMs !== Infinity ? `${msToSec(bestLapMs)}s` : "—"}
                </div>
                <div>
                  Best overall:{" "}
                  {bestLapDbMs != null && bestLapDbMs !== Infinity ? `${msToSec(bestLapDbMs)}s` : "—"}
                </div>
              </div>
            </div>
          ) : state.phase === "idle" ? (
            <div className="flex flex-col items-center gap-3">
              <div className="text-3xl font-black text-zinc-100 md:text-4xl">{preStartTitle}</div>
              <div className="text-base text-zinc-400 md:text-lg">{preStartSubtitle}</div>
              {!serial.connected && serial.status !== "Not connected" && (
                <div className="text-xs text-zinc-500">{serial.status}</div>
              )}
              {!serial.supported && (
                <div className="text-xs text-amber-200">Web Serial isn’t available here. Use Chrome or Edge on desktop.</div>
              )}
            </div>
          ) : (
            <TooltipProvider delayDuration={200}>
              <div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6 text-left">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Race summary</div>
              {selectedCourse && (
                <div className="mt-2 text-sm font-semibold text-zinc-400">
                  {selectedCourse.name}
                  {selectedCourse.lap_distance_in && lapDistanceTooltip ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {" "}
                            · {formatLapDistance(selectedCourse.lap_distance_in)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{lapDistanceTooltip}</TooltipContent>
                      </Tooltip>
                    ) : (
                      ""
                    )}
                </div>
              )}
              {cfg.mode === "distance" && distanceTargetDisplay && (
                <div className="mt-2 text-sm font-semibold text-zinc-400">
                  Target distance: {distanceTargetDisplay.value} {distanceTargetDisplay.unit}
                  {distanceTargetLaps != null ? ` · ${distanceTargetLaps} laps` : ""}
                </div>
              )}
                <div className="mt-5 grid gap-4 text-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total time</div>
                    <div className="mt-2 text-3xl font-bold">
                      {raceDurationMs != null ? `${msToSec(raceDurationMs)}s` : "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total laps</div>
                    <div className="mt-2 text-3xl font-bold">{laps}</div>
                  </div>
                  {totalDistanceLabel && (
                    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total distance</div>
                      {totalDistanceTooltip ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="mt-2 cursor-help text-3xl font-bold">{totalDistanceLabel}</div>
                          </TooltipTrigger>
                          <TooltipContent>{totalDistanceTooltip}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="mt-2 text-3xl font-bold">{totalDistanceLabel}</div>
                      )}
                    </div>
                  )}
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Average lap</div>
                    <div className="mt-2 text-3xl font-bold">
                      {avgLapMs != null ? `${msToSec(avgLapMs)}s` : "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Best lap</div>
                  <div className="mt-2 text-3xl font-bold">
                    {bestLapMs != null && bestLapMs !== Infinity ? `${msToSec(bestLapMs)}s` : "—"}
                  </div>
                </div>
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Last lap</div>
                    <div className="mt-2 text-3xl font-bold">
                      {lastLapMs != null ? `${msToSec(lastLapMs)}s` : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          )}

          <div className="mt-2 flex w-full max-w-3xl flex-col gap-3">
            <Button
              onClick={onPrimary}
              disabled={primaryDisabled}
              className={`h-20 text-2xl font-black ${state.phase === "finished" ? "bg-white text-black hover:bg-zinc-200" : ""}`}
            >
              {primaryLabel}
            </Button>
            {state.phase === "finished" && (
              <div className="flex w-full gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="h-16 flex-1 border-zinc-700 text-lg font-semibold text-zinc-200 hover:bg-zinc-900"
                >
                  <Link href="/lapquest/setup">New run</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-16 flex-1 border-zinc-700 text-lg font-semibold text-zinc-200 hover:bg-zinc-900"
                >
                  <Link href="/lapquest/history">My runs</Link>
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

export default function RacePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white">
          <div className="flex min-h-screen items-center justify-center text-zinc-400">Loading race…</div>
        </main>
      }
    >
      <RacePageContent />
    </Suspense>
  );
}
