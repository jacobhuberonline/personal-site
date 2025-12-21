"use client";

import { useEffect, useMemo, useState } from "react";
import { Baby, Clock9 } from "lucide-react";

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
  findActiveBlock,
  formatDateToTimeString,
  generateSchedule,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";

const stages = [
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
    id: "starting-soon",
    label: "Starting solids (coming soon)",
    description: "We’ll add a gentle solids schedule when he’s ready.",
    config: null,
  },
] as const;

export default function ScheduleClient() {
  const [stageId, setStageId] = useState<(typeof stages)[number]["id"]>("pre-solids");
  const stage = stages.find((s) => s.id === stageId) ?? stages[0];

  const blocks = useMemo(() => {
    if (!stage.config) return [];
    return generateSchedule(stage.config.first, stage.config.interval, stage.config.last);
  }, [stage.config]);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const activeBlockId = useMemo(() => findActiveBlock(blocks, now), [blocks, now]);

  const visibleBlocks = useMemo(
    () => blocks.filter((block) => !block.end || block.end > now),
    [blocks, now]
  );

  const hiddenCount = blocks.length - visibleBlocks.length;
  const [showPast, setShowPast] = useState(false);
  const renderedBlocks = showPast ? blocks : visibleBlocks;
  const includesNightRoutine = blocks.some((block) => block.type === "Night Routine");

  const hasSchedule = renderedBlocks.length > 0;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
          <Baby className="h-4 w-4" aria-hidden="true" />
          Francis
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
          Francis&apos;s Plan for Today
        </h1>
        <p className="max-w-3xl text-sm text-neutral-700 dark:text-neutral-300">
          The highlighted row is what&apos;s happening now, and the next row shows what&apos;s
          coming up. Times are guides—shift a little earlier or later based on how he&apos;s
          feeling.
        </p>
      </div>

      {/* Stage selector */}
      <div className="flex flex-wrap gap-2">
        {stages.map((option) => (
          <Button
            key={option.id}
            type="button"
            size="sm"
            variant={option.id === stageId ? "default" : "outline"}
            disabled={!option.config}
            onClick={() => setStageId(option.id)}
            className={cn(
              "rounded-full",
              !option.config && "cursor-not-allowed opacity-60 hover:opacity-60"
            )}
          >
            {option.label}
          </Button>
        ))}
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
        </CardHeader>
        <CardContent>
          {/* Past blocks toggle */}
          {stage.config && hiddenCount > 0 && (
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
          {stage.config && hasSchedule ? (
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
                {renderedBlocks.map((block: Block) => (
                  <TableRow
                    key={block.id}
                    className={cn(
                      block.id === activeBlockId
                        ? "border-2 border-primary/60 bg-primary/10 font-semibold shadow-sm dark:border-primary/50 dark:bg-primary/15"
                        : "opacity-90"
                    )}
                  >
                    <TableCell className="font-medium">
                      {block.type === "Night Routine"
                        ? "Night Routine (see details below)"
                        : block.type}
                    </TableCell>
                    <TableCell>{formatDateToTimeString(block.start)}</TableCell>
                    <TableCell>{block.end ? formatDateToTimeString(block.end) : "—"}</TableCell>
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
