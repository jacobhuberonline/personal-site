export type Mode = "free" | "first_to_n" | "time_trial" | "distance";

export type RaceConfig = {
  mode: Mode;
  target?: number;          // laps for first_to_n/distance, seconds for time_trial
  countdownSec: number;     // e.g. 3
  lapLockoutMs: number;     // e.g. 2000
};

export type RaceState =
  | { phase: "idle" }
  | { phase: "countdown"; endsAtPerf: number; startedAtPerf: number }
  | { phase: "running"; startedAtPerf: number; lastLapAtPerf?: number; laps: number; lapTimesMs: number[] }
  | { phase: "finished"; startedAtPerf: number; endedAtPerf: number; laps: number; lapTimesMs: number[] };

export function initialRaceState(): RaceState {
  return { phase: "idle" };
}

export type RaceEvent =
  | { type: "BTN"; allowStart?: boolean }
  | { type: "BEAM" }
  | { type: "RESET" }
  | { type: "TICK"; nowPerf: number };

export function reduceRace(cfg: RaceConfig, state: RaceState, ev: RaceEvent): RaceState {
  const now = ev.type === "TICK" ? ev.nowPerf : performance.now();

  // Helper: start countdown
  const startCountdown = () => {
    const startedAtPerf = now;
    const endsAtPerf = now + cfg.countdownSec * 1000;
    return { phase: "countdown", startedAtPerf, endsAtPerf } as RaceState;
  };

  // Helper: start running
  const startRunning = (startedAtPerf: number) => {
    return { phase: "running", startedAtPerf, laps: 0, lapTimesMs: [] } as RaceState;
  };

  // Helper: finish
  const finish = (running: Extract<RaceState, { phase: "running" }>) => {
    return {
      phase: "finished",
      startedAtPerf: running.startedAtPerf,
      endedAtPerf: now,
      laps: running.laps,
      lapTimesMs: running.lapTimesMs,
    } as RaceState;
  };

  switch (state.phase) {
    case "idle": {
      if (ev.type === "BTN") {
        if (ev.allowStart === false) return state;
        return startCountdown();
      }
      return state;
    }

    case "countdown": {
      if (ev.type === "RESET") return { phase: "idle" };
      if (ev.type === "BTN") return { phase: "idle" }; // second press cancels
      if (ev.type === "TICK" && now >= state.endsAtPerf) return startRunning(state.startedAtPerf);
      return state;
    }

    case "running": {
      if (
        (cfg.mode === "first_to_n" || cfg.mode === "distance") &&
        typeof cfg.target === "number" &&
        Number.isFinite(cfg.target) &&
        cfg.target > 0 &&
        state.laps >= cfg.target
      ) {
        return finish(state);
      }
      if (ev.type === "RESET") return { phase: "idle" };
      if (ev.type === "BTN") return finish(state); // toggle stop

      if (ev.type === "BEAM") {
        // lockout
        const last = state.lastLapAtPerf;
        if (last != null && now - last < cfg.lapLockoutMs) return state;

        const elapsedMs = Math.round(now - state.startedAtPerf);
        const lapTimeMs = last == null ? elapsedMs : Math.round(now - last);

        const laps = state.laps + 1;
        const lapTimesMs = [...state.lapTimesMs, lapTimeMs];

        const next: Extract<RaceState, { phase: "running" }> = {
          ...state,
          laps,
          lapTimesMs,
          lastLapAtPerf: now,
        };

        // finish conditions
        if ((cfg.mode === "first_to_n" || cfg.mode === "distance") && cfg.target && laps >= cfg.target) {
          return finish(next);
        }
        if (cfg.mode === "time_trial" && cfg.target) {
          const maxMs = cfg.target * 1000;
          if (elapsedMs >= maxMs) return finish(next);
        }

        return next;
      }

      // time_trial can also finish on time passing even without a lap
      if (ev.type === "TICK" && cfg.mode === "time_trial" && cfg.target) {
        const elapsed = now - state.startedAtPerf;
        if (elapsed >= cfg.target * 1000) return finish(state);
      }

      return state;
    }

    case "finished": {
      if (ev.type === "RESET" || ev.type === "BTN") return { phase: "idle" };
      return state;
    }
  }
}
