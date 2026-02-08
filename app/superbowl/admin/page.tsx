"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuperbowlHeader } from "@/components/superbowl/header";
import { SuperbowlLoginCta } from "@/components/superbowl/login-cta";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { SuperbowlEvent, SuperbowlQuestion } from "@/lib/superbowl";
import {
  buildOtherValue,
  formatEventTime,
  getChoiceValue,
  getOtherText,
  groupQuestionsBySection,
  MVP_OTHER_CHOICE,
} from "@/lib/superbowl";

type ResultMap = Record<string, unknown>;

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SuperbowlAdminPage() {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [event, setEvent] = useState<SuperbowlEvent | null>(null);
  const [questions, setQuestions] = useState<SuperbowlQuestion[]>([]);
  const [results, setResults] = useState<ResultMap>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saving, setSaving] = useState(false);

  const groupedQuestions = useMemo(() => groupQuestionsBySection(questions), [questions]);

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
      setQuestions([]);
      setResults({});
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const client = supabase;
    let isActive = true;

    const loadData = async () => {
      setLoading(true);
      const { data: adminRow, error: adminError } = await client
        .from("site_admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!isActive) return;
      if (adminError) {
        toast({
          variant: "destructive",
          title: "Admin check failed",
          description: adminError.message,
        });
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (!adminRow) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

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

      const { data: questionRows, error: questionError } = await client
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

      const { data: resultRows, error: resultError } = await client
        .from("superbowl_results")
        .select("question_id,value")
        .eq("event_id", activeEvent.id);

      if (!isActive) return;
      if (resultError) {
        toast({
          variant: "destructive",
          title: "Couldn’t load results",
          description: resultError.message,
        });
        setLoading(false);
        return;
      }

      const resultMap: ResultMap = {};
      resultRows?.forEach((row) => {
        resultMap[row.question_id] = row.value;
      });
      setResults(resultMap);
      setSaveStatus("idle");
      setLoading(false);
    };

    void loadData();

    return () => {
      isActive = false;
    };
  }, [session, toast]);

  const isResultComplete = useCallback((question: SuperbowlQuestion, value: unknown) => {
    if (value === null || value === undefined) return false;
    if (question.type === "score") {
      if (typeof value !== "object" || value === null) return false;
      const sea = (value as { sea?: number | null }).sea;
      const ne = (value as { ne?: number | null }).ne;
      return typeof sea === "number" && typeof ne === "number";
    }
    if (question.type === "text") {
      return typeof value === "string" && value.trim().length > 0;
    }
    const choice = getChoiceValue(value);
    if (!choice) return false;
    if (choice === MVP_OTHER_CHOICE) {
      const text = getOtherText(value);
      return text.trim().length > 0;
    }
    return true;
  }, []);

  const completeness = useMemo(() => {
    const answered = questions.filter((question) => isResultComplete(question, results[question.id])).length;
    return { answered, total: questions.length };
  }, [questions, results, isResultComplete]);

  const buildPayload = useCallback(() => {
    if (!event) return null;
    const resultRows = Object.entries(results)
      .filter(([, value]) => value !== undefined)
      .map(([questionId, value]) => ({
        questionId,
        value,
      }));

    return {
      eventId: event.id,
      results: resultRows,
    };
  }, [event, results]);

  const saveResults = useCallback(async () => {
    if (!session || !event) return;
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    setSaveStatus("saving");

    try {
      const res = await fetch("/api/superbowl/admin/save-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to save results.");
      }
      setSaveStatus("saved");
      toast({
        title: "Results saved",
        description: "Scores recomputed for submitted entries.",
      });
    } catch (error: any) {
      setSaveStatus("error");
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error?.message ?? "Try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  }, [buildPayload, event, session, toast]);

  const handleChoiceChange = (question: SuperbowlQuestion, value: string) => {
    setResults((prev) => {
      const next = { ...prev };
      if (question.key === "mvp_player" && value === MVP_OTHER_CHOICE) {
        const existing = prev[question.id];
        const text = getOtherText(existing);
        next[question.id] = buildOtherValue(text);
      } else {
        next[question.id] = value;
      }
      return next;
    });
    setSaveStatus("idle");
  };

  const handleOtherTextChange = (questionId: string, text: string) => {
    setResults((prev) => ({
      ...prev,
      [questionId]: buildOtherValue(text),
    }));
    setSaveStatus("idle");
  };

  const handleScoreChange = (questionId: string, field: "sea" | "ne", value: string) => {
    setResults((prev) => {
      const current = prev[questionId];
      const nextScore = typeof current === "object" && current !== null ? { ...(current as any) } : {};
      const parsed = value === "" ? null : Number(value);
      nextScore[field] = Number.isFinite(parsed) ? parsed : null;
      return {
        ...prev,
        [questionId]: nextScore,
      };
    });
    setSaveStatus("idle");
  };

  const handleTextChange = (questionId: string, value: string) => {
    setResults((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setSaveStatus("idle");
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <h1 className="text-3xl font-semibold">Super Bowl Admin</h1>
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
          <h1 className="text-3xl font-semibold">Super Bowl Admin</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Log in with your email to manage results.
          </p>
        </div>
        <SuperbowlLoginCta redirectPath="/superbowl/admin" label="Log in to manage results" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <SuperbowlHeader
        eyebrow="Super Bowl Admin"
        title="Enter official results"
        description={event ? `${event.name} · ${formatEventTime(event.starts_at)}` : "Loading event"}
      />

      {loading ? (
        <Card>
          <CardContent className="py-10 text-sm text-neutral-500">Loading admin tools…</CardContent>
        </Card>
      ) : !isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Admin access required</CardTitle>
            <CardDescription>
              Add your user id to the site_admins table to enable this page.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/superbowl">Back to overview</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : !event ? (
        <Card>
          <CardContent className="py-10 text-sm text-neutral-500">No active event.</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Results completeness</CardTitle>
              <CardDescription>Fill in every scored question to finalize scoring.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                {completeness.answered}/{completeness.total} questions answered
              </div>
              {saveStatus === "saving" && <div className="text-neutral-500">Saving results…</div>}
              {saveStatus === "saved" && <div className="text-emerald-600 dark:text-emerald-400">Results saved.</div>}
              {saveStatus === "error" && <div className="text-rose-600 dark:text-rose-400">Save failed.</div>}
            </CardContent>
            <CardFooter>
              <Button onClick={saveResults} disabled={saving}>
                {saving ? "Saving…" : "Save results & recompute"}
              </Button>
            </CardFooter>
          </Card>

          {groupedQuestions.map((group) => (
            <Card key={group.section}>
              <CardHeader>
                <CardTitle>{group.section}</CardTitle>
                <CardDescription>Official answers for scoring.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {group.questions.map((question) => {
                  const currentValue = results[question.id];
                  const choiceValue = getChoiceValue(currentValue) ?? undefined;
                  const showOtherText = question.key === "mvp_player" && choiceValue === MVP_OTHER_CHOICE;
                  const scoreValue = typeof currentValue === "object" && currentValue !== null ? (currentValue as any) : {};
                  const seaValue = typeof scoreValue?.sea === "number" ? scoreValue.sea : "";
                  const neValue = typeof scoreValue?.ne === "number" ? scoreValue.ne : "";

                  return (
                    <div key={question.id} className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {question.label}
                          </div>
                          {question.description ? (
                            <div className="text-sm text-neutral-500">{question.description}</div>
                          ) : null}
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                          {question.points > 0 ? `${question.points} pts` : "Fun"}
                        </div>
                      </div>

                      {question.type === "single_choice" && question.options ? (
                        <div className="space-y-2">
                          <Select
                            value={choiceValue}
                            onValueChange={(value) => handleChoiceChange(question, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {showOtherText && (
                            <Input
                              placeholder="Specify other MVP"
                              value={getOtherText(currentValue)}
                              onChange={(e) => handleOtherTextChange(question.id, e.target.value)}
                            />
                          )}
                        </div>
                      ) : question.type === "score" ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                              Seahawks
                            </label>
                            <Input
                              type="number"
                              min={0}
                              value={seaValue}
                              onChange={(e) => handleScoreChange(question.id, "sea", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                              Patriots
                            </label>
                            <Input
                              type="number"
                              min={0}
                              value={neValue}
                              onChange={(e) => handleScoreChange(question.id, "ne", e.target.value)}
                            />
                          </div>
                        </div>
                      ) : question.type === "text" ? (
                        <Input
                          value={typeof currentValue === "string" ? currentValue : ""}
                          onChange={(e) => handleTextChange(question.id, e.target.value)}
                        />
                      ) : (
                        <div className="text-sm text-neutral-500">Unsupported question type.</div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
