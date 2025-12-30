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
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

type Course = {
  id: string;
  name: string;
  lap_distance_in: number | null;
  owner_id: string | null;
};

function formatDistance(inches: number | null | undefined) {
  if (!inches) return null;
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  if (feet > 0 && remaining > 0) return `${feet}ft ${remaining}in`;
  if (feet > 0) return `${feet}ft`;
  return `${remaining}in`;
}

function splitDistance(inches: number | null | undefined) {
  const total = Math.max(0, Math.round(inches ?? 0));
  return { feet: Math.floor(total / 12), inches: total % 12 };
}

export default function LapQuestHome() {
  const { toast } = useToast();
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
        .select("id, name, lap_distance_in, owner_id")
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
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [distanceValue, setDistanceValue] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<"m" | "mi">("m");
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseFeet, setNewCourseFeet] = useState("");
  const [newCourseInches, setNewCourseInches] = useState("");
  const [createCourseStatus, setCreateCourseStatus] = useState("");
  const [createCourseLoading, setCreateCourseLoading] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFeet, setEditFeet] = useState("");
  const [editInches, setEditInches] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );
  const ownedCourses = useMemo(
    () => courses.filter((course) => course.owner_id && course.owner_id === userId),
    [courses, userId]
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
  const canStart = signedIn === true;
  const startDisabled =
    !canStart ||
    (mode === "distance"
      ? !distanceTargetLaps
      : mode === "free"
        ? false
        : !Number.isFinite(target) || target <= 0);

  const resetManageState = () => {
    setEditCourseId(null);
    setEditName("");
    setEditFeet("");
    setEditInches("");
    setEditStatus("");
    setEditLoading(false);
    setDeleteCourseId(null);
    setDeleteLoadingId(null);
  };

  const startEditCourse = (course: Course) => {
    const distance = splitDistance(course.lap_distance_in);
    setEditCourseId(course.id);
    setEditName(course.name);
    setEditFeet(distance.feet ? String(distance.feet) : "");
    setEditInches(distance.inches ? String(distance.inches) : "");
    setEditStatus("");
    setDeleteCourseId(null);
  };

  const cancelEditCourse = () => {
    setEditCourseId(null);
    setEditName("");
    setEditFeet("");
    setEditInches("");
    setEditStatus("");
  };

  const handleUpdateCourse = async () => {
    if (!editCourseId) return;
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setEditStatus("Supabase is not configured.");
      return;
    }
    if (!signedIn) {
      setEditStatus("Sign in to edit courses.");
      return;
    }
    const name = editName.trim();
    if (!name) {
      setEditStatus("Enter a course name.");
      return;
    }
    const feetValue = editFeet.trim() === "" ? 0 : Number(editFeet);
    const inchesValue = editInches.trim() === "" ? 0 : Number(editInches);
    if (!Number.isFinite(feetValue) || !Number.isFinite(inchesValue)) {
      setEditStatus("Enter a valid distance.");
      return;
    }
    if (feetValue < 0 || inchesValue < 0 || inchesValue >= 12) {
      setEditStatus("Inches must be between 0 and 11.");
      return;
    }
    const totalInches = Math.round(feetValue * 12 + inchesValue);
    if (totalInches <= 0) {
      setEditStatus("Distance must be greater than 0.");
      return;
    }

    setEditLoading(true);
    setEditStatus("");
    try {
      const result = await client
        .from("courses")
        .update({ name, lap_distance_in: totalInches })
        .eq("id", editCourseId)
        .select("id, name, lap_distance_in, owner_id")
        .single();

      if (result.error) {
        setEditStatus(result.error.message);
        return;
      }

      const updated = result.data as Course;
      setCourses((prev) => prev.map((course) => (course.id === updated.id ? updated : course)));
      setEditCourseId(null);
      setEditStatus("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn’t update course.";
      toast({
        variant: "destructive",
        title: "Update failed",
        description: message,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      toast({
        variant: "destructive",
        title: "Supabase isn’t configured",
        description: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
      });
      return;
    }
    if (!signedIn) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Sign in to delete courses.",
      });
      return;
    }

    setDeleteLoadingId(courseId);
    try {
      const result = await client.from("courses").delete().eq("id", courseId);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: result.error.message,
        });
        return;
      }

      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      if (selectedCourseId === courseId) {
        setSelectedCourseId(null);
      }
      if (editCourseId === courseId) {
        cancelEditCourse();
      }
      setDeleteCourseId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn’t delete course.";
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: message,
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setSignedIn(false);
      return;
    }

    let isActive = true;
    client.auth.getSession().then(({ data }) => {
      if (!isActive) return;
      setSignedIn(Boolean(data.session));
      setUserId(data.session?.user?.id ?? null);
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;
      setSignedIn(Boolean(session));
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      isActive = false;
      data?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      setCourses([]);
      setCoursesLoading(false);
      return;
    }

    let isActive = true;
    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        const result = await client
          .from("courses")
          .select("id, name, lap_distance_in, owner_id")
          .order("created_at", { ascending: false });
        if (!isActive) return;
        if (result.error) {
          setCourses([]);
          return;
        }

        const rows = (result.data as Course[]) ?? [];
        setCourses(rows);
      } catch (error) {
        if (!isActive) return;
        const message = error instanceof Error ? error.message : "Couldn’t load courses.";
        setCourses([]);
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

  useEffect(() => {
    if (!manageDialogOpen) {
      resetManageState();
    }
  }, [manageDialogOpen]);

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
    <main className="min-h-screen bg-white text-slate-900 dark:bg-black dark:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
        <div className="mt-4 text-center text-slate-700 dark:text-zinc-300">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500">
            Race setup
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
            Set up your next run
          </h1>
          <p className="mt-2 text-slate-600 dark:text-zinc-400">
            Pick a race mode and set your target. When you are ready, jump into the
            race screen to connect the Tracker and start the timer.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <Card className="border-slate-200 bg-white/80 text-slate-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-100">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-zinc-100">Race setup</CardTitle>
              <CardDescription className="text-slate-600 dark:text-zinc-400">
                Choose how LapQuest should track this session.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">Course</label>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        Add course
                      </Button>
                    </DialogTrigger>
                  </div>
                  <Select
                    value={selectedCourseId ?? "none"}
                    onValueChange={(value) => {
                      if (value === "manage") {
                        setManageDialogOpen(true);
                        return;
                      }
                      setSelectedCourseId(value === "none" ? null : value);
                    }}
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
                      <SelectSeparator />
                      <SelectItem value="manage" disabled={!signedIn}>
                        Manage courses…
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogContent className="border-slate-200 bg-white text-slate-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  <DialogHeader>
                    <DialogTitle>New course</DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-zinc-400">
                      Add a course name and lap distance.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">Course name</label>
                      <Input
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        placeholder="Backyard loop"
                        disabled={createCourseLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">Lap distance</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 dark:text-zinc-500">Feet</div>
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
                          <div className="text-xs text-slate-500 dark:text-zinc-500">Inches</div>
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
                      <p className="text-xs text-slate-500 dark:text-zinc-500">We store distance in inches.</p>
                    </div>
                  </div>
                  {createCourseStatus && (
                    <p className="text-xs text-slate-500 dark:text-zinc-500">{createCourseStatus}</p>
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                        disabled={createCourseLoading}
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={handleCreateCourse}
                      disabled={createCourseLoading}
                      className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      {createCourseLoading ? "Saving..." : "Create course"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
                <DialogContent className="border-slate-200 bg-white text-slate-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                  <DialogHeader>
                    <DialogTitle>Manage courses</DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-zinc-400">
                      Edit or delete courses you own.
                    </DialogDescription>
                  </DialogHeader>
                  {!signedIn && (
                    <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
                      Sign in to manage your courses.
                    </div>
                  )}
                  {signedIn && ownedCourses.length === 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
                      No courses to manage yet.
                    </div>
                  )}
                  {signedIn && ownedCourses.length > 0 && (
                    <div className="space-y-3">
                      {ownedCourses.map((course) => {
                        const isEditing = editCourseId === course.id;
                        const isDeleting = deleteCourseId === course.id;
                        return (
                          <div
                            key={course.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
                          >
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_110px]">
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                                      Name
                                    </label>
                                    <Input
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      placeholder="Backyard loop"
                                      disabled={editLoading}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                                      Feet
                                    </label>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={editFeet}
                                      onChange={(e) => setEditFeet(e.target.value)}
                                      placeholder="0"
                                      disabled={editLoading}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                                      Inches
                                    </label>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={11}
                                      value={editInches}
                                      onChange={(e) => setEditInches(e.target.value)}
                                      placeholder="0"
                                      disabled={editLoading}
                                    />
                                  </div>
                                </div>
                                {editStatus && (
                                  <p className="text-xs text-rose-600 dark:text-rose-300">{editStatus}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    onClick={handleUpdateCourse}
                                    className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                                    disabled={editLoading}
                                  >
                                    {editLoading ? "Saving..." : "Save"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                    onClick={cancelEditCourse}
                                    disabled={editLoading}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                    {course.name}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-zinc-400">
                                    {formatDistance(course.lap_distance_in) ?? "Distance not set"}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                    onClick={() => startEditCourse(course)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-rose-300 text-rose-700 hover:border-rose-400 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-200 dark:hover:border-rose-500/70 dark:hover:bg-rose-500/10"
                                    onClick={() => setDeleteCourseId(course.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            )}
                            {isDeleting && !isEditing && (
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
                                <span>Delete this course?</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                  onClick={() => setDeleteCourseId(null)}
                                  disabled={deleteLoadingId === course.id}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-rose-600 text-white hover:bg-rose-500"
                                  onClick={() => handleDeleteCourse(course.id)}
                                  disabled={deleteLoadingId === course.id}
                                >
                                  {deleteLoadingId === course.id ? "Deleting..." : "Confirm delete"}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">Mode</label>
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
                <p className="text-xs text-slate-500 dark:text-zinc-500">
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
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">Target distance</label>
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
                    <p className="text-xs text-slate-500 dark:text-zinc-500">
                      {distanceTargetLaps != null
                        ? `Estimated laps: ${distanceTargetLaps} (rounded up).`
                        : "Enter a distance to calculate laps."}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-200">
                      Add a lap distance to the course to use distance mode.
                    </p>
                  )}
                </div>
              )}

              {(mode === "first_to_n" || mode === "time_trial") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-200">
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
                  <p className="text-xs text-slate-500 dark:text-zinc-500">
                    {mode === "first_to_n"
                      ? "LapQuest ends the run once you reach this number."
                      : "LapQuest ends the run when the timer hits this value."}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {startDisabled ? (
                  <Button
                    disabled
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    Select
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    <Link href={`/lapquest/race?${query}`}>Select</Link>
                  </Button>
                )}
              </div>
              {!canStart && (
                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  Sign in to start a run. You can still browse courses.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
