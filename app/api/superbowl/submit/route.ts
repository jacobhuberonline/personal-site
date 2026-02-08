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

  if (!eventId) {
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

  const { data: entry, error: entryErr } = await supabase
    .from("superbowl_entries")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (entryErr) {
    return NextResponse.json({ error: entryErr.message }, { status: 400 });
  }

  if (!entry) {
    return NextResponse.json({ error: "No draft entry found." }, { status: 400 });
  }

  if (entry.status === "submitted") {
    return NextResponse.json({ ok: true, entry });
  }

  const { data: updated, error: updateErr } = await supabase
    .from("superbowl_entries")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", entry.id)
    .select("*")
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, entry: updated });
}
