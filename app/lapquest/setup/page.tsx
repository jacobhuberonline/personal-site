"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

type Course = {
  id: string;
  name: string;
  lap_distance_in: number | null;
};

function formatDistance(inches: number | null | undefined) {
  if (!inches) return null;
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  if (feet > 0 && remaining > 0) return `${feet}ft ${remaining}in`;
  if (feet > 0) return `${feet}ft`;
  return `${remaining}in`;
}

export default function LapQuestHome() {
  const handleCreateCourse = async () => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setCreateCourseStatus("Supabase is not configured.");
      return;
    }

    const name = newCourseName.trim();
    if (!name) {
      setCreateCourseStatus("Enter a course name.");
      return;
    }

    const feetValue = newCourseFeet.trim() === "" ? 0 : Number(newCourseFeet);
    const inchesValue = newCourseInches.trim() === "" ? 0 : Number(newCourseInches);
    if (!Number.isFinite(feetValue) || !Number.isFinite(inchesValue)) {
      setCreateCourseStatus("Enter a valid distance.");
      return;
    }
    if (feetValue < 0 || inchesValue < 0 || inchesValue >= 12) {
      setCreateCourseStatus("Inches must be between 0 and 11.");
      return;
    }
    const totalInches = Math.round(feetValue * 12 + inchesValue);
    if (totalInches <= 0) {
      setCreateCourseStatus("Distance must be greater than 0.");
      return;
    }

    setCreateCourseLoading(true);
    setCreateCourseStatus("");
    try {
      const session = await client.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) {
        setCreateCourseStatus("Sign in to create a course.");
        return;
      }

      const result = await client
        .from("courses")
        .insert({
          owner_id: userId,
          name,
          lap_distance_in: totalInches,
        })
        .select("id, name, lap_distance_in")
        .single();

      if (result.error) {
        setCreateCourseStatus(result.error.message);
        return;
      }

      const created = result.data as Course;
      setCourses((prev) => [created, ...prev]);
      setSelectedCourseId(created.id);
      setNewCourseName("");
      setNewCourseFeet("");
      setNewCourseInches("");
      setCoursesStatus("");
      setCreateCourseStatus("");
      setCourseDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn’t create course.";
      setCreateCourseStatus(message);
    } finally {
      setCreateCourseLoading(false);
    }
  };

  const [mode, setMode] = useState<"free" | "first_to_n" | "time_trial" | "distance">("first_to_n");
  const [target, setTarget] = useState<number>(20);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesStatus, setCoursesStatus] = useState("");
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [distanceValue, setDistanceValue] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<"m" | "mi">("m");
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseFeet, setNewCourseFeet] = useState("");
  const [newCourseInches, setNewCourseInches] = useState("");
  const [createCourseStatus, setCreateCourseStatus] = useState("");
  const [createCourseLoading, setCreateCourseLoading] = useState(false);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );
  const lapDistanceMeters = selectedCourse?.lap_distance_in
    ? selectedCourse.lap_distance_in * 0.0254
    : null;
  const parsedDistance = distanceValue.trim() === "" ? null : Number(distanceValue);
  const distanceMeters =
    parsedDistance != null && Number.isFinite(parsedDistance)
      ? distanceUnit === "mi"
        ? parsedDistance * 1609.344
        : parsedDistance
      : null;
  const distanceTargetLaps =
    lapDistanceMeters != null && distanceMeters != null && distanceMeters > 0
      ? Math.ceil(distanceMeters / lapDistanceMeters)
      : null;
  const startDisabled =
    mode === "distance"
      ? !distanceTargetLaps
      : mode === "free"
        ? false
        : !Number.isFinite(target) || target <= 0;

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setCourses([]);
      setCoursesStatus("Supabase is not configured.");
      setCoursesLoading(false);
      return;
    }

    let isActive = true;
    const loadCourses = async () => {
      setCoursesLoading(true);
      setCoursesStatus("Loading courses...");
      try {
        const session = await client.auth.getSession();
        if (!isActive) return;
        if (!session.data.session) {
          setCourses([]);
          setCoursesStatus("Redirecting to login...");
          setCoursesLoading(false);
          const nextPath = `${window.location.pathname}${window.location.search}`;
          window.location.href = "/lapquest/login";
          return;
        }

        const result = await client
          .from("courses")
          .select("id, name, lap_distance_in")
          .order("created_at", { ascending: false });
        if (!isActive) return;
        if (result.error) {
          setCourses([]);
          setCoursesStatus(result.error.message);
          return;
        }

        const rows = (result.data as Course[]) ?? [];
        setCourses(rows);
        setCoursesStatus(rows.length ? "" : "No courses yet.");
      } catch (error) {
        if (!isActive) return;
        const message = error instanceof Error ? error.message : "Couldn’t load courses.";
        setCourses([]);
        setCoursesStatus(message);
      } finally {
        if (isActive) setCoursesLoading(false);
      }
    };

    void loadCourses();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (courseDialogOpen) {
      setCreateCourseStatus("");
    }
  }, [courseDialogOpen]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("mode", mode);
    if (mode === "first_to_n" || mode === "time_trial") p.set("target", String(target));
    if (mode === "distance" && distanceValue.trim()) {
      p.set("distance", distanceValue.trim());
      p.set("distanceUnit", distanceUnit);
    }
    if (selectedCourseId) p.set("course", selectedCourseId);
    return p.toString();
  }, [distanceUnit, distanceValue, mode, selectedCourseId, target]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
        <div className="mt-4 text-center text-zinc-300">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Race setup
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Set up your next run
          </h1>
          <p className="mt-2 text-zinc-400">
            Pick a race mode and set your target. When you are ready, jump into the
            race screen to connect the Tracker and start the timer.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <Card className="border-zinc-800 bg-zinc-950/70 text-zinc-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-zinc-100">Race setup</CardTitle>
              <CardDescription className="text-zinc-400">
                Choose how LapQuest should track this session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-200">Course</label>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                      >
                        Add course
                      </Button>
                    </DialogTrigger>
                  </div>
                  <Select
                    value={selectedCourseId ?? "none"}
                    onValueChange={(value) => setSelectedCourseId(value === "none" ? null : value)}
                    disabled={coursesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No course</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                          {course.lap_distance_in ? ` · ${formatDistance(course.lap_distance_in)}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
                  <DialogHeader>
                    <DialogTitle>New course</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Add a course name and lap distance.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Course name</label>
                      <Input
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        placeholder="Backyard loop"
                        disabled={createCourseLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-200">Lap distance</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-500">Feet</div>
                          <Input
                            type="number"
                            min={0}
                            value={newCourseFeet}
                            onChange={(e) => setNewCourseFeet(e.target.value)}
                            placeholder="0"
                            disabled={createCourseLoading}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-500">Inches</div>
                          <Input
                            type="number"
                            min={0}
                            max={11}
                            value={newCourseInches}
                            onChange={(e) => setNewCourseInches(e.target.value)}
                            placeholder="0"
                            disabled={createCourseLoading}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500">We store distance in inches.</p>
                    </div>
                  </div>
                  {createCourseStatus && <p className="text-xs text-zinc-500">{createCourseStatus}</p>}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                        disabled={createCourseLoading}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={handleCreateCourse}
                      disabled={createCourseLoading}
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      {createCourseLoading ? "Saving..." : "Create course"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Mode</label>
                <Select value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_to_n">Target laps</SelectItem>
                    <SelectItem value="time_trial">Time trial (seconds)</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="free">Free run</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-500">
                  {mode === "first_to_n"
                    ? "Finish automatically when you reach the target lap count."
                    : mode === "time_trial"
                      ? "Run laps until the timer hits your target."
                      : mode === "distance"
                        ? "Run until you cover the target distance."
                      : "Start and stop whenever you want."}
                </p>
              </div>

              {mode === "distance" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">Target distance</label>
                  <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      value={distanceValue}
                      onChange={(e) => setDistanceValue(e.target.value)}
                      placeholder="1000"
                    />
                    <Select value={distanceUnit} onValueChange={(value) => setDistanceUnit(value as "m" | "mi")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m">Meters</SelectItem>
                        <SelectItem value="mi">Miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedCourse?.lap_distance_in ? (
                    <p className="text-xs text-zinc-500">
                      {distanceTargetLaps != null
                        ? `Estimated laps: ${distanceTargetLaps} (rounded up).`
                        : "Enter a distance to calculate laps."}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-200">Add a lap distance to the course to use distance mode.</p>
                  )}
                </div>
              )}

              {(mode === "first_to_n" || mode === "time_trial") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-200">
                    {mode === "first_to_n" ? "Target laps" : "Time limit (seconds)"}
                  </label>
                  <div className="max-w-[180px]">
                    <Input
                      type="number"
                      min={1}
                      value={target}
                      onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">
                    {mode === "first_to_n"
                      ? "LapQuest ends the run once you reach this number."
                      : "LapQuest ends the run when the timer hits this value."}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {startDisabled ? (
                  <Button disabled className="w-full bg-white text-black hover:bg-zinc-200">
                    Select
                  </Button>
                ) : (
                  <Button asChild className="w-full bg-white text-black hover:bg-zinc-200">
                    <Link href={`/lapquest/race?${query}`}>Select</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
