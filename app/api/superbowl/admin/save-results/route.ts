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
  const results = body?.results as Array<{ questionId: string; value: unknown }> | undefined;

  if (!eventId || !Array.isArray(results)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { data: adminRow, error: adminErr } = await supabase
    .from("site_admins")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (adminErr) {
    return NextResponse.json({ error: adminErr.message }, { status: 403 });
  }

  if (!adminRow) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const rows = results
    .filter((result) => result?.questionId)
    .map((result) => ({
      event_id: eventId,
      question_id: result.questionId,
      value: result.value ?? null,
      entered_by: auth.user.id,
    }));

  if (rows.length > 0) {
    const { error: resultErr } = await supabase
      .from("superbowl_results")
      .upsert(rows, { onConflict: "event_id,question_id" });

    if (resultErr) {
      return NextResponse.json({ error: resultErr.message }, { status: 400 });
    }
  }

  const { error: recomputeErr } = await supabase.rpc("recompute_superbowl_scores", {
    target_event: eventId,
  });

  if (recomputeErr) {
    return NextResponse.json({ error: recomputeErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
