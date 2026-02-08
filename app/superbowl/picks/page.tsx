"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { SuperbowlEntry, SuperbowlEvent, SuperbowlQuestion } from "@/lib/superbowl";
import {
  buildOtherValue,
  formatAnswerValue,
  formatEventTime,
  getChoiceValue,
  getOtherText,
  groupQuestionsBySection,
  MVP_OTHER_CHOICE,
} from "@/lib/superbowl";

type AnswerMap = Record<string, unknown>;

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SuperbowlPicksPage() {
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [event, setEvent] = useState<SuperbowlEvent | null>(null);
  const [entry, setEntry] = useState<SuperbowlEntry | null>(null);
  const [questions, setQuestions] = useState<SuperbowlQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const hasStarted = useMemo(() => {
    if (!event) return false;
    return now.getTime() >= new Date(event.starts_at).getTime();
  }, [event, now]);

  const isLocked = useMemo(() => {
    if (!event) return false;
    if (entry?.status === "submitted") return true;
    return hasStarted;
  }, [entry, hasStarted, event]);

  const groupedQuestions = useMemo(() => groupQuestionsBySection(questions), [questions]);

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
      setEntry(null);
      setQuestions([]);
      setAnswers({});
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

      const { data: entryData, error: entryError } = await supabase
        .from("superbowl_entries")
        .select("*")
        .eq("event_id", activeEvent.id)
        .maybeSingle();

      if (!isActive) return;
      if (entryError) {
        toast({
          variant: "destructive",
          title: "Couldn’t load your picks",
          description: entryError.message,
        });
        setEntry(null);
        setAnswers({});
        setLoading(false);
        return;
      }

      setEntry(entryData ?? null);

      if (entryData) {
        const { data: answerRows, error: answerError } = await supabase
          .from("superbowl_answers")
          .select("question_id,value")
          .eq("entry_id", entryData.id);

        if (!isActive) return;
        if (answerError) {
          toast({
            variant: "destructive",
            title: "Couldn’t load saved answers",
            description: answerError.message,
          });
          setAnswers({});
          setLoading(false);
          return;
        }

        const answerMap: AnswerMap = {};
        answerRows?.forEach((row) => {
          answerMap[row.question_id] = row.value;
        });
        setAnswers(answerMap);
      } else {
        setAnswers({});
      }

      setDirty(false);
      setSaveStatus("idle");
      setLoading(false);
    };

    void loadData();

    return () => {
      isActive = false;
    };
  }, [session, toast]);

  const buildPayload = useCallback(() => {
    if (!event) return null;
    const answerRows = Object.entries(answers)
      .filter(([, value]) => value !== undefined)
      .map(([questionId, value]) => ({
        questionId,
        value,
      }));

    return {
      eventId: event.id,
      answers: answerRows,
    };
  }, [answers, event]);

  const saveDraft = useCallback(async () => {
    if (!session || !event) return false;
    const payload = buildPayload();
    if (!payload) return false;

    setSaving(true);
    setSaveStatus("saving");

    try {
      const res = await fetch("/api/superbowl/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to save draft.");
      }
      if (data?.entry) {
        setEntry(data.entry);
      }
      setDirty(false);
      setSaveStatus("saved");
      return true;
    } catch (error: any) {
      setSaveStatus("error");
      toast({
        variant: "destructive",
        title: "Draft not saved",
        description: error?.message ?? "Try again in a moment.",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [buildPayload, event, session, toast]);

  useEffect(() => {
    if (!dirty || isLocked || !session || !event) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      void saveDraft();
    }, 500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [dirty, isLocked, saveDraft, session, event]);

  const handleChoiceChange = (question: SuperbowlQuestion, value: string) => {
    setAnswers((prev) => {
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
    setDirty(true);
    setSaveStatus("idle");
  };

  const handleOtherTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: buildOtherValue(text),
    }));
    setDirty(true);
    setSaveStatus("idle");
  };

  const handleScoreChange = (questionId: string, field: "sea" | "ne", value: string) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      const nextScore = typeof current === "object" && current !== null ? { ...(current as any) } : {};
      const parsed = value === "" ? null : Number(value);
      nextScore[field] = Number.isFinite(parsed) ? parsed : null;
      return {
        ...prev,
        [questionId]: nextScore,
      };
    });
    setDirty(true);
    setSaveStatus("idle");
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setDirty(true);
    setSaveStatus("idle");
  };

  const handleSubmit = async () => {
    if (!session || !event) return;
    setSubmitting(true);
    try {
      if (dirty) {
        const ok = await saveDraft();
        if (!ok) {
          setSubmitting(false);
          return;
        }
      }
      const res = await fetch("/api/superbowl/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ eventId: event.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to submit picks.");
      }
      toast({
        title: "Picks submitted",
        description: "Your picks are locked in.",
      });
      if (data?.entry) {
        setEntry(data.entry);
      }
      setDirty(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error?.message ?? "Try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <h1 className="text-3xl font-semibold">Super Bowl Picks</h1>
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
          <h1 className="text-3xl font-semibold">Make your picks</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Log in with your email to start a Super Bowl props card.
          </p>
        </div>
        <SuperbowlLoginCta redirectPath="/superbowl/picks" label="Log in to start picks" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <SuperbowlHeader
        title="Your picks"
        description={event ? `${event.name} · ${formatEventTime(event.starts_at)}` : "Loading event"}
      />

      {loading ? (
        <Card>
          <CardContent className="py-10 text-sm text-neutral-500">Loading picks…</CardContent>
        </Card>
      ) : !event ? (
        <Card>
          <CardContent className="py-10 text-sm text-neutral-500">No active event.</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                {entry?.status === "submitted" ? "Submitted" : entry ? "Draft" : "Not started"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {isLocked ? (
                <div className="text-amber-600 dark:text-amber-400">
                  Picks are locked. {entry?.status === "submitted" ? "You submitted your picks." : "Kickoff has passed."}
                </div>
              ) : (
                <div className="text-neutral-500">
                  Draft autosaves. Submitting locks immediately. Kickoff: {formatEventTime(event.starts_at)}.
                </div>
              )}
              {saveStatus === "saving" && <div className="text-neutral-500">Saving draft…</div>}
              {saveStatus === "saved" && <div className="text-emerald-600 dark:text-emerald-400">Draft saved.</div>}
              {saveStatus === "error" && <div className="text-rose-600 dark:text-rose-400">Draft save failed.</div>}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3">
              <Button
                onClick={handleSubmit}
                disabled={isLocked || submitting || saving || !event || (!entry && !dirty)}
              >
                {submitting ? "Submitting…" : "Submit picks"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/superbowl/leaderboard">View leaderboard</Link>
              </Button>
            </CardFooter>
          </Card>

          {groupedQuestions.map((group) => (
            <Card key={group.section}>
              <CardHeader>
                <CardTitle>{group.section}</CardTitle>
                <CardDescription>
                  {group.section === "Fun"
                    ? "Just for fun — no points."
                    : "Points only awarded for exact matches."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {group.questions.map((question) => {
                  const currentValue = answers[question.id];
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
                            disabled={isLocked}
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
                              disabled={isLocked}
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
                              disabled={isLocked}
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
                              disabled={isLocked}
                            />
                          </div>
                        </div>
                      ) : question.type === "text" ? (
                        <Input
                          value={typeof currentValue === "string" ? currentValue : ""}
                          onChange={(e) => handleTextChange(question.id, e.target.value)}
                          disabled={isLocked}
                        />
                      ) : (
                        <div className="text-sm text-neutral-500">Unsupported question type.</div>
                      )}

                      {isLocked && (
                        <div className="text-sm text-neutral-500">Your answer: {formatAnswerValue(question, currentValue)}</div>
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
