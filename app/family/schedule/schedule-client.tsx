"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock9 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  Block,
  DEFAULT_FIRST_FEED,
  DEFAULT_INTERVAL_HOURS,
  DEFAULT_LAST_FEED,
  DEFAULT_NAME,
  formatDateToTimeString,
  generateSchedule,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";

type ScheduleRow = {
  id: string;
  activity: string;
  startLabel: string;
  endLabel: string;
  start?: Date;
  end?: Date | null;
  isNightRoutine?: boolean;
};

type StageConfig = {
  name: string;
  first: string;
  interval: number;
  last: string;
};

type Stage = {
  id: string;
  label: string;
  description: string;
  config?: StageConfig | null;
  rows?: ScheduleRow[];
};

type FoodsIntroducedEvent = {
  id: string;
  activity: string;
  start: string;
  kind: "milk" | "food" | "nap" | "other";
  durationMinutes?: number;
  playAfter?: boolean;
};

const MILK_DURATION_MINUTES = 30;
const FOOD_DURATION_MINUTES = 15;
const MORNING_NAP_DURATION_MINUTES = 90;
const MIDDAY_NAP_DURATION_MINUTES = 90;
const CATNAP_DURATION_MINUTES = 30;
const PLAY_ACTIVITY = "Awake / Play";
const STORAGE_STAGE_KEY = "francis_schedule_stage";

const foodsIntroducedTemplate: FoodsIntroducedEvent[] = [
  {
    id: "wake",
    activity: "Wakes up; drinks formula/breast milk.",
    start: "07:00",
    kind: "milk",
    playAfter: true,
  },
  {
    id: "breakfast-solids",
    activity: "1/2 jar fruit, 1-2 tablespoons of baby cereal. May begin to give sippy cup.",
    start: "08:00",
    kind: "food",
    playAfter: true,
  },
  {
    id: "morning-nap",
    activity: "Naptime (1-1 1/2 hours).",
    start: "09:00",
    kind: "nap",
    durationMinutes: MORNING_NAP_DURATION_MINUTES,
  },
  {
    id: "late-morning-milk",
    activity: "Formula/breast milk.",
    start: "11:00",
    kind: "milk",
    playAfter: true,
  },
  {
    id: "lunch-solids",
    activity:
      "2-4 oz. veggies, 2-4 oz. fruit, 1-2 tablespoons of baby cereal. May include a sippy cup here.",
    start: "12:00",
    kind: "food",
    playAfter: true,
  },
  {
    id: "midday-nap",
    activity:
      "Nap. Pick one time between 12:30 and 1:30 and start nap at that time each day (ideally 1 1/2-2 hours).",
    start: "12:30",
    kind: "nap",
    durationMinutes: MIDDAY_NAP_DURATION_MINUTES,
  },
  {
    id: "afternoon-milk",
    activity: "Formula/breast milk.",
    start: "15:00",
    kind: "milk",
    playAfter: true,
  },
  {
    id: "afternoon-solids",
    activity:
      "2-4 oz. veggies, 2-4 oz. fruit with a sippy cup of formula/breast milk.",
    start: "16:00",
    kind: "food",
    playAfter: true,
  },
  {
    id: "catnap",
    activity: "May take a catnap.",
    start: "17:00",
    kind: "nap",
    durationMinutes: CATNAP_DURATION_MINUTES,
  },
  {
    id: "evening-awake",
    activity:
      "Keep awake from now until bath time. (Do 10 minutes of tummy time-release that energy!)",
    start: "18:00",
    kind: "other",
  },
  {
    id: "bath-time",
    activity: "Begin bath time routine.",
    start: "18:30",
    kind: "other",
  },
  {
    id: "bedtime-feed",
    activity: "Begin \"Bedtime Feeding\".",
    start: "19:00",
    kind: "milk",
    playAfter: false,
  },
  {
    id: "crib",
    activity: "In the crib for the night.",
    start: "19:30",
    kind: "other",
  },
];

const timeStringToDate = (value: string, baseDate: Date) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60 * 1000);

const buildFoodsIntroducedRows = (baseDate: Date): ScheduleRow[] => {
  const rows: ScheduleRow[] = [];

  foodsIntroducedTemplate.forEach((event, index) => {
    const start = timeStringToDate(event.start, baseDate);
    const nextEvent = foodsIntroducedTemplate[index + 1];
    const nextStart = nextEvent ? timeStringToDate(nextEvent.start, baseDate) : null;

    if (event.kind === "milk" || event.kind === "food") {
      const duration =
        event.kind === "milk" ? MILK_DURATION_MINUTES : FOOD_DURATION_MINUTES;
      const feedEnd = addMinutes(start, duration);

      rows.push({
        id: event.id,
        activity: event.activity,
        startLabel: formatDateToTimeString(start),
        endLabel: formatDateToTimeString(feedEnd),
        start,
        end: feedEnd,
      });

      if (event.playAfter !== false && nextStart && feedEnd < nextStart) {
        rows.push({
          id: `${event.id}-play`,
          activity: PLAY_ACTIVITY,
          startLabel: formatDateToTimeString(feedEnd),
          endLabel: formatDateToTimeString(nextStart),
          start: feedEnd,
          end: nextStart,
        });
      }
      return;
    }

    const eventEnd = event.durationMinutes
      ? addMinutes(start, event.durationMinutes)
      : nextStart;

    rows.push({
      id: event.id,
      activity: event.activity,
      startLabel: formatDateToTimeString(start),
      endLabel: eventEnd ? formatDateToTimeString(eventEnd) : "—",
      start,
      end: eventEnd,
    });

    if (event.kind === "nap" && eventEnd && nextStart && eventEnd < nextStart) {
      rows.push({
        id: `${event.id}-play`,
        activity: PLAY_ACTIVITY,
        startLabel: formatDateToTimeString(eventEnd),
        endLabel: formatDateToTimeString(nextStart),
        start: eventEnd,
        end: nextStart,
      });
    }
  });

  return rows;
};

const findActiveRow = (rows: ScheduleRow[], now: Date) => {
  for (const row of rows) {
    if (!row.start) continue;
    if (row.end) {
      if (now >= row.start && now < row.end) {
        return row.id;
      }
    } else if (now >= row.start) {
      return row.id;
    }
  }

  return null;
};

export default function ScheduleClient() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const foodsIntroducedRows = useMemo(() => buildFoodsIntroducedRows(now), [now]);

  const stages = useMemo<Stage[]>(
    () => [
      {
        id: "pre-solids",
        label: "Pre-solids (2–4 months)",
        description: "No solids yet. Feeds every ~3 hours with naps after each awake window.",
        config: {
          name: DEFAULT_NAME,
          first: DEFAULT_FIRST_FEED,
          interval: DEFAULT_INTERVAL_HOURS,
          last: DEFAULT_LAST_FEED,
        },
      },
      {
        id: "foods-introduced",
        label: "Foods introduced (4–6 months)",
        description:
          "Typical day once baby foods are introduced. Each bottle is 6–8 oz. Sippy cups are usually 2–4 oz. Food amounts are guides, not requirements.",
        rows: foodsIntroducedRows,
        config: null,
      },
    ],
    [foodsIntroducedRows]
  );

  const [stageId, setStageId] = useState<Stage["id"]>("pre-solids");
  const stage = stages.find((s) => s.id === stageId) ?? stages[0];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_STAGE_KEY);
    if (saved && stages.some((option) => option.id === saved)) {
      setStageId(saved as Stage["id"]);
    }
  }, [stages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_STAGE_KEY, stageId);
  }, [stageId]);

  const generatedBlocks = useMemo(() => {
    if (!stage.config) return [];
    return generateSchedule(stage.config.first, stage.config.interval, stage.config.last);
  }, [stage.config]);

  const scheduleRows = useMemo<ScheduleRow[]>(() => {
    if (stage.rows) return stage.rows;
    return generatedBlocks.map((block: Block) => ({
      id: block.id,
      activity:
        block.type === "Night Routine" ? "Night Routine (see details below)" : block.type,
      startLabel: formatDateToTimeString(block.start),
      endLabel: block.end ? formatDateToTimeString(block.end) : "—",
      start: block.start,
      end: block.end,
      isNightRoutine: block.type === "Night Routine",
    }));
  }, [generatedBlocks, stage.rows]);

  const visibleRows = useMemo(() => {
    return scheduleRows.filter((row) => !row.end || row.end > now);
  }, [scheduleRows, now]);

  const hiddenCount = scheduleRows.length - visibleRows.length;
  const [showPast, setShowPast] = useState(false);
  const renderedRows = !showPast ? visibleRows : scheduleRows;
  const includesNightRoutine = generatedBlocks.some((block) => block.type === "Night Routine");

  const hasSchedule = renderedRows.length > 0;
  const activeRowId = useMemo(() => findActiveRow(scheduleRows, now), [scheduleRows, now]);

  return (
    <main className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          Francis&apos;s Plan for Today
        </h1>
        <p className="max-w-3xl text-sm text-neutral-700 dark:text-neutral-300">
          Choose a schedule below. The highlighted row shows what's happening now, and the next row
          shows what's coming up. Times and food amounts are guides—shift a little earlier or later
          based on how he's feeling.
        </p>
      </div>

      {/* Stage selector */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
          Choose Schedule
        </div>
        <div className="flex flex-wrap gap-2">
        {stages.map((option) => {
          const isActive = option.id === stageId;
          const isDisabled = !option.config && !option.rows;
          return (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant="ghost"
              disabled={isDisabled}
              onClick={() => setStageId(option.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-2 ring-primary/40 ring-offset-2 ring-offset-background hover:bg-primary/90 dark:ring-primary/50"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-200 dark:hover:bg-neutral-800",
                isDisabled && "cursor-not-allowed opacity-60 hover:bg-transparent"
              )}
            >
              {option.label}
            </Button>
          );
        })}
        </div>
      </div>

      {/* Plan card */}
      <Card className="border-neutral-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-900/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-neutral-900 dark:text-neutral-50">
            <Clock9 className="h-5 w-5 text-primary" aria-hidden="true" /> Plan Overview
          </CardTitle>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {stage.description}
          </p>
          <p className="text-xs text-muted-foreground">
            Currently viewing: <span className="font-semibold text-foreground">{stage.label}</span>
          </p>
        </CardHeader>
        <CardContent>
          {/* Past blocks toggle */}
          {hiddenCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-muted-foreground">
                {showPast
                  ? "Showing the earlier parts of today so you can review what already happened."
                  : `${hiddenCount} earlier part${hiddenCount === 1 ? "" : "s"} of the day hidden.`}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPast((prev) => !prev)}
              >
                {showPast ? "Hide earlier activity" : "Show earlier activity"}
              </Button>
            </div>
          )}

          {/* Schedule table */}
          {hasSchedule ? (
            <Table>
              <TableCaption>
                Times are approximate. Staying close to this plan will help Francis stay rested,
                fed, and happy.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderedRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      row.id === activeRowId
                        ? "border-2 border-primary/60 bg-primary/10 font-semibold shadow-sm dark:border-primary/50 dark:bg-primary/15"
                        : "opacity-90"
                    )}
                  >
                    <TableCell className="font-medium">{row.activity}</TableCell>
                    <TableCell>{row.startLabel}</TableCell>
                    <TableCell>{row.endLabel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-200">
              This schedule will be added once solids begin. We&apos;ll publish the routine with
              feeding windows and solids guidance when it&apos;s ready.
            </div>
          )}

          {/* Night routine helper */}
          {includesNightRoutine && (
            <div className="mt-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Night Routine</p>
              <p>
                This is the wind-down before bed: give him a clean diaper, put on fresh pajamas if
                needed, and choose a calming activity like a soothing book or quiet cuddles before
                the final feeding.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
