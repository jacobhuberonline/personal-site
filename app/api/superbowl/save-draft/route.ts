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
  const eventId = body?.eventId as string | undefined;
  const answers = body?.answers as Array<{ questionId: string; value: unknown }> | undefined;

  if (!eventId || !Array.isArray(answers)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { data: event, error: eventErr } = await supabase
    .from("superbowl_events")
    .select("id,starts_at")
    .eq("id", eventId)
    .single();

  if (eventErr || !event) {
    return NextResponse.json({ error: eventErr?.message ?? "Event not found." }, { status: 400 });
  }

  if (Date.now() >= new Date(event.starts_at).getTime()) {
    return NextResponse.json({ error: "Picks are locked after kickoff." }, { status: 423 });
  }

  const { data: existingEntry, error: entryErr } = await supabase
    .from("superbowl_entries")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (entryErr) {
    return NextResponse.json({ error: entryErr.message }, { status: 400 });
  }

  if (existingEntry?.status === "submitted") {
    return NextResponse.json({ error: "Picks are already submitted." }, { status: 423 });
  }

  let entry = existingEntry;

  if (!entry) {
    const { data: newEntry, error: newEntryErr } = await supabase
      .from("superbowl_entries")
      .insert({
        event_id: eventId,
        user_id: auth.user.id,
        status: "draft",
      })
      .select("*")
      .single();

    if (newEntryErr) {
      return NextResponse.json({ error: newEntryErr.message }, { status: 400 });
    }
    entry = newEntry ?? null;
  }

  if (!entry) {
    return NextResponse.json({ error: "Unable to create entry." }, { status: 400 });
  }

  const rows = answers
    .filter((answer) => answer?.questionId)
    .map((answer) => ({
      entry_id: entry?.id,
      question_id: answer.questionId,
      value: answer.value ?? null,
    }));

  if (rows.length > 0) {
    const { error: answerErr } = await supabase
      .from("superbowl_answers")
      .upsert(rows, { onConflict: "entry_id,question_id" });

    if (answerErr) {
      return NextResponse.json({ error: answerErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, entry });
}
