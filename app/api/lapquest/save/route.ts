import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY" },
      { status: 500 }
    );
  }

  // Use the caller's auth token (Supabase RLS policies rely on auth.uid()).
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabase = createClient(url, anon, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 401 });
  }
  if (!auth?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Expected body:
  // {
  //   mode: 'free' | 'first_to_n' | 'time_trial',
  //   target: number | null,
  //   courseId: string | null,
  //   startedAtIso: string,
  //   endedAtIso: string,
  //   durationMs: number,
  //   totalLaps: number,
  //   laps: Array<{ n: number; elapsedMs: number; lapTimeMs: number }>
  // }
  const {
    mode,
    target,
    courseId = null,
    startedAtIso,
    endedAtIso,
    durationMs,
    totalLaps,
    laps,
  } = body ?? {};

  if (!mode || !startedAtIso || !endedAtIso || typeof durationMs !== "number" || typeof totalLaps !== "number") {
    return NextResponse.json(
      { error: "Invalid payload. Required: mode, startedAtIso, endedAtIso, durationMs, totalLaps." },
      { status: 400 }
    );
  }

  const owner_id = auth.user.id;

  const { data: run, error: runErr } = await supabase
    .from("runs")
    .insert({
      owner_id,
      course_id: courseId,
      mode,
      target,
      started_at: startedAtIso,
      ended_at: endedAtIso,
      total_laps: totalLaps,
      duration_ms: durationMs,
    })
    .select("id")
    .single();

  if (runErr) {
    return NextResponse.json({ error: runErr.message }, { status: 400 });
  }

  if (Array.isArray(laps) && laps.length > 0) {
    const rows = laps.map((l: any) => ({
      run_id: run.id,
      n: Number(l.n),
      elapsed_ms: Number(l.elapsedMs),
      lap_time_ms: Number(l.lapTimeMs),
    }));

    const { error: lapsErr } = await supabase.from("laps").insert(rows);
    if (lapsErr) {
      return NextResponse.json({ error: lapsErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, runId: run.id });
}