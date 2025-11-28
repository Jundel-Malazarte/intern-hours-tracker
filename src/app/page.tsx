"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calendar, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { toast } from "react-hot-toast";
import useAuthUser from "@/hooks/useAuthUser";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

interface TimeEntry {
  id: number;
  date: string;
  morning_time_in: string;
  morning_time_out: string;
  afternoon_time_in: string;
  afternoon_time_out: string;
  evening_time_in: string;
  evening_time_out: string;
}

type NewTimeEntry = Omit<TimeEntry, "id">;

export default function Home() {
  // store as string so user can freely clear/type
  const [requiredHours, setRequiredHours] = useState<string>("500");
  const [completedHours, setCompletedHours] = useState<number>(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const { user, userLoading } = useAuthUser();

  const [newEntry, setNewEntry] = useState<NewTimeEntry>({
    date: "",
    morning_time_in: "",
    morning_time_out: "",
    afternoon_time_in: "",
    afternoon_time_out: "",
    evening_time_in: "",
    evening_time_out: "",
  });

  const [updateEntry, setUpdateEntry] = useState<NewTimeEntry>({
    date: "",
    morning_time_in: "",
    morning_time_out: "",
    afternoon_time_in: "",
    afternoon_time_out: "",
    evening_time_in: "",
    evening_time_out: "",
  });

  // numeric version for math
  const requiredHoursNumber = Number(requiredHours) || 0;

  const completionPercentage: number =
    requiredHoursNumber === 0
      ? 0
      : Math.min(
          Math.round((completedHours / requiredHoursNumber) * 100),
          100
        );

  // shared helper for entry hours (handles HH:MM and HH:MM:SS)
  const calculateEntryHours = (timeIn: string, timeOut: string): number => {
    if (!timeIn || !timeOut) return 0;

    const inParts = timeIn.split(":").map((p) => Number(p));
    const outParts = timeOut.split(":").map((p) => Number(p));

    if (inParts.length < 2 || outParts.length < 2) return 0;
    if (inParts.some(Number.isNaN) || outParts.some(Number.isNaN)) return 0;

    const [inHour, inMinute] = inParts;
    const [outHour, outMinute] = outParts;

    const inMinutes = inHour * 60 + inMinute;
    const outMinutes = outHour * 60 + outMinute;

    return Math.max(0, (outMinutes - inMinutes) / 60);
  };

  useEffect(() => {
    if (!localStorage.getItem("hours")) {
      localStorage.setItem("hours", requiredHours);
    }

    async function fetchEntries() {
      if (!user?.id) return;

      try {
        const res = await fetch(`/api/entries`);
        
        // 1. Safety Check: Did the API return an error code?
        if (!res.ok) {
          console.error("Failed to fetch:", res.status, res.statusText);
          setTimeEntries([]); // Set empty array so app doesn't crash
          setLoading(false);
          return;
        }

        const data = await res.json();

        // 2. Safety Check: Is the data actually an array?
        if (Array.isArray(data)) {
          setTimeEntries(data);
        } else {
          console.error("API returned invalid format:", data);
          setTimeEntries([]); // Fallback to empty array
        }
      } catch (error) {
        console.error("Network or parsing error:", error);
        setTimeEntries([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEntries();

    const stored = localStorage.getItem("hours");
    if (stored !== null) {
      setRequiredHours(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setNewEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setUpdateEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequiredHoursChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    // allow empty while typing
    setRequiredHours(value);
    localStorage.setItem("hours", value === "" ? "0" : value);
  };

  const handleAddEntry = async () => {
    if (!newEntry.date) {
      alert("Please select a date");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/entries", {
      method: "POST",
      body: JSON.stringify({ ...newEntry }),
    });

    if (response.status !== 201) {
      toast.error("Error adding time entry");
      setIsSubmitting(false);
      return;
    }

    const data: TimeEntry = await response.json();

    // use the real DB row returned from API
    setTimeEntries((prev) => [...prev, data]);

    toast.success("Added entry successfully");
    setIsSubmitting(false);

    setNewEntry({
      date: "",
      morning_time_in: "",
      morning_time_out: "",
      afternoon_time_in: "",
      afternoon_time_out: "",
      evening_time_in: "",
      evening_time_out: "",
    });
  };

  const handleUpdateEntry = async (id: number) => {
    if (!updateEntry.date) {
      alert("Please select a date");
      return;
    }
    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateEntry),
      });

      if (response.status !== 204) {
        toast.error("Error updating time entry");
        return;
      }

      if (response.ok) {
        setTimeEntries((prevTimeEntries) =>
          prevTimeEntries.map((item) =>
            item.id === id ? { ...item, ...updateEntry } : item
          )
        );

        toast.success("Entry updated successfully");
      }
    } catch (error) {
      alert(error);
    } finally {
      setUpdateEntry({
        date: "",
        morning_time_in: "",
        morning_time_out: "",
        afternoon_time_in: "",
        afternoon_time_out: "",
        evening_time_in: "",
        evening_time_out: "",
      });
    }
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
      });

      if (response.status !== 204) {
        toast.error("Cannot delete entry");
        return;
      }

      if (response.ok) {
        toast.success("Deleted entry successfully");
        setTimeEntries((prev) => prev.filter((entry) => entry.id !== id));
      }
    } catch (error) {
      alert(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const onClickLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/60 text-foreground">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Intern Hours Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track daily attendance, compute OJT hours, and monitor progress in
              one place.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeSwitcher />
            {userLoading ? (
              <div className="h-7 w-7 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              user && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1">
                    <Image
                      width={32}
                      height={32}
                      src={user?.user_metadata.avatar_url}
                      alt="user pic"
                      className="h-8 w-8 rounded-full border border-border"
                    />
                    <span className="hidden md:inline text-xs text-muted-foreground max-w-[140px] truncate">
                      {user.email}
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-center">
                      <Button size="sm" onClick={onClickLogout}>
                        Logout
                      </Button>
                    </DropdownMenuLabel>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Progress Card */}
          <Card className="shadow-xl border-border bg-card/80 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-lg">
                Intern Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48">
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: `conic-gradient(
                      var(--color-primary) ${completionPercentage}%,
                      var(--color-muted) ${completionPercentage}%
                    )`,
                  }}
                >
                  <div className="absolute top-4 left-4 right-4 bottom-4 bg-background rounded-full flex items-center justify-center flex-col border border-border shadow-inner">
                    <span className="text-4xl font-bold">
                      {completionPercentage}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 w-full space-y-2">
                <Progress value={completionPercentage} className="h-2" />
                <div className="flex flex-wrap justify-between text-xs md:text-sm mt-1 gap-y-1">
                  <span className="text-foreground">
                    {completedHours.toFixed(2)} hours logged
                  </span>
                  <span className="text-muted-foreground">
                    {requiredHoursNumber} hours required
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="text-lg font-semibold text-primary">
                      {(requiredHoursNumber - completedHours).toFixed(2)} hrs
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card px-3 py-2">
                    <p className="text-muted-foreground">Total Required</p>
                    <div className="flex items-center gap-2">
                      <Input
                        id="requiredHours"
                        type="number"
                        value={requiredHours}
                        onChange={handleRequiredHoursChange}
                        className="mt-1 h-8 text-xs bg-background border-border"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        hours
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Entry Form */}
          <Card className="shadow-xl border-border bg-card/80 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" /> Record Time Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    name="date"
                    value={newEntry.date}
                    onChange={handleInputChange}
                    className="mt-1 bg-background border-border"
                  />
                </div>

                {/* Morning */}
                <div>
                  <Label className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-emerald-500" /> Morning
                    <span className="text-[11px] text-muted-foreground">
                      Time in (AM), time out (PM)
                    </span>
                  </Label>
                  <div className="flex gap-3 mt-1">
                    <div className="w-1/2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Time In</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                          AM
                        </span>
                      </div>
                      <Input
                        type="time"
                        name="morning_time_in"
                        value={newEntry.morning_time_in}
                        onChange={handleInputChange}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="w-1/2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Time Out</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/60 dark:text-sky-200">
                          PM
                        </span>
                      </div>
                      <Input
                        type="time"
                        name="morning_time_out"
                        value={newEntry.morning_time_out}
                        onChange={handleInputChange}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Afternoon */}
                <div>
                  <Label className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-amber-500" /> Afternoon
                    <span className="text-[11px] text-muted-foreground">
                      Time in &amp; out (PM)
                    </span>
                  </Label>
                  <div className="flex gap-3 mt-1">
                    <div className="w-1/2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Time In</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
                          PM
                        </span>
                      </div>
                      <Input
                        type="time"
                        name="afternoon_time_in"
                        value={newEntry.afternoon_time_in}
                        onChange={handleInputChange}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="w-1/2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Time Out</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
                          PM
                        </span>
                      </div>
                      <Input
                        type="time"
                        name="afternoon_time_out"
                        value={newEntry.afternoon_time_out}
                        onChange={handleInputChange}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Evening */}
                <div>
                  <Label className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-fuchsia-500" /> Evening
                    <span className="text-[11px] text-muted-foreground">
                      Optional, both PM
                    </span>
                  </Label>
                  <div className="flex gap-3 mt-1">
                    <div className="w-1/2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Time In</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-fuchsia-100 text-[10px] font-semibold text-fuchsia-700 dark:bg-fuchsia-900/60 dark:text-fuchsia-200">
                          PM
                        </span>
                      </div>
                      <Input
                        type="time"
                        name="evening_time_in"
                        value={newEntry.evening_time_in}
                        onChange={handleInputChange}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="w-1/2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Time Out</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-fuchsia-100 text-[10px] font-semibold text-fuchsia-700 dark:bg-fuchsia-900/60 dark:text-fuchsia-200">
                          PM
                        </span>
                      </div>
                      <Input
                        type="time"
                        name="evening_time_out"
                        value={newEntry.evening_time_out}
                        onChange={handleInputChange}
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {/* Primary button style used here */}
              <Button
                disabled={isSubmitting}
                className="w-full"
                onClick={handleAddEntry}
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <p>Add Time Entry</p>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* History */}
        <Card className="shadow-xl border-border bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Time Entry History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Loading entries...
              </div>
            )}
            {timeEntries.length === 0 && !loading ? (
              <Alert className="bg-background border-border">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-foreground">
                  No time entries yet. Add your first entry using the form
                  above.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {Array.isArray(timeEntries) && timeEntries.map((entry, index) => {
                  const morningHours = calculateEntryHours(
                    entry.morning_time_in,
                    entry.morning_time_out
                  );
                  const afternoonHours = calculateEntryHours(
                    entry.afternoon_time_in,
                    entry.afternoon_time_out
                  );
                  const eveningHours = calculateEntryHours(
                    entry.evening_time_in,
                    entry.evening_time_out
                  );
                  const totalHours =
                    morningHours + afternoonHours + eveningHours;

                  return (
                    <div
                      key={entry.id}
                      className="border border-border rounded-xl p-4 bg-background"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Morning, afternoon and evening breakdown
                          </p>
                        </div>
                        <span className="font-bold text-primary text-sm md:text-base">
                          {totalHours.toFixed(2)} hours
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                        {entry.morning_time_in && (
                          <div className="rounded-lg bg-card px-3 py-2 border border-border">
                            <span className="font-medium text-foreground">
                              Morning
                            </span>
                            <div className="text-xs text-muted-foreground mt-1">
                              {entry.morning_time_in} (AM) –{" "}
                              {entry.morning_time_out} (PM)
                              <span className="ml-2 text-primary font-medium">
                                {morningHours.toFixed(2)} hrs
                              </span>
                            </div>
                          </div>
                        )}

                        {entry.afternoon_time_in && (
                          <div className="rounded-lg bg-card px-3 py-2 border border-border">
                            <span className="font-medium text-foreground">
                              Afternoon
                            </span>
                            <div className="text-xs text-muted-foreground mt-1">
                              {entry.afternoon_time_in} (PM) –{" "}
                              {entry.afternoon_time_out} (PM)
                              <span className="ml-2 text-amber-600 dark:text-amber-300 font-medium">
                                {afternoonHours.toFixed(2)} hrs
                              </span>
                            </div>
                          </div>
                        )}

                        {entry.evening_time_in && (
                          <div className="rounded-lg bg-card px-3 py-2 border border-border">
                            <span className="font-medium text-foreground">
                              Evening
                            </span>
                            <div className="text-xs text-muted-foreground mt-1">
                              {entry.evening_time_in} (PM) –{" "}
                              {entry.evening_time_out} (PM)
                              <span className="ml-2 text-fuchsia-600 dark:text-fuchsia-300 font-medium">
                                {eveningHours.toFixed(2)} hrs
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex justify-end gap-3 items-center">
                        <Sheet key={index}>
                          <SheetTrigger asChild>
                            {/* Edit button now uses same primary style as Add */}
                            <Button
                              onClick={() =>
                                setUpdateEntry({
                                  date: entry.date,
                                  afternoon_time_in: entry.afternoon_time_in,
                                  afternoon_time_out: entry.afternoon_time_out,
                                  evening_time_in: entry.evening_time_in,
                                  evening_time_out: entry.evening_time_out,
                                  morning_time_in: entry.morning_time_in,
                                  morning_time_out: entry.morning_time_out,
                                })
                              }
                              className="min-w-[72px]"
                            >
                              Edit
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="bg-background text-foreground border-border">
                            <SheetHeader>
                              <SheetTitle>Edit Time History</SheetTitle>
                              <SheetDescription>
                                Edit your time history here and click Submit to
                                save changes.
                              </SheetDescription>
                              <div className="space-y-4 mt-4">
                                {/* Date */}
                                <div>
                                  <Label
                                    htmlFor="date"
                                    className="flex items-center gap-2"
                                  >
                                    <Calendar className="h-4 w-4" /> Date
                                  </Label>
                                  <Input
                                    id="date"
                                    type="date"
                                    name="date"
                                    value={updateEntry.date}
                                    onChange={handleUpdateInputChange}
                                    className="mt-1 bg-background border-border"
                                  />
                                </div>

                                {/* Morning */}
                                <div>
                                  <Label className="flex items-center gap-2 mb-1">
                                    <Clock className="h-4 w-4 text-emerald-500" />{" "}
                                    Morning
                                    <span className="text-[11px] text-muted-foreground">
                                      Time in (AM), time out (PM)
                                    </span>
                                  </Label>
                                  <div className="flex gap-3 mt-1">
                                    <div className="w-1/2 space-y-1">
                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>Time In</span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                                          AM
                                        </span>
                                      </div>
                                      <Input
                                        type="time"
                                        name="morning_time_in"
                                        value={updateEntry.morning_time_in}
                                        onChange={handleUpdateInputChange}
                                        className="bg-background border-border"
                                      />
                                    </div>
                                    <div className="w-1/2 space-y-1">
                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>Time Out</span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/60 dark:text-sky-200">
                                          PM
                                        </span>
                                      </div>
                                      <Input
                                        type="time"
                                        name="morning_time_out"
                                        value={updateEntry.morning_time_out}
                                        onChange={handleUpdateInputChange}
                                        className="bg-background border-border"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Afternoon */}
                                <div>
                                  <Label className="flex items-center gap-2 mb-1">
                                    <Clock className="h-4 w-4 text-amber-500" />{" "}
                                    Afternoon
                                    <span className="text-[11px] text-muted-foreground">
                                      Time in &amp; out (PM)
                                    </span>
                                  </Label>
                                  <div className="flex gap-3 mt-1">
                                    <div className="w-1/2 space-y-1">
                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>Time In</span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
                                          PM
                                        </span>
                                      </div>
                                      <Input
                                        type="time"
                                        name="afternoon_time_in"
                                        value={updateEntry.afternoon_time_in}
                                        onChange={handleUpdateInputChange}
                                        className="bg-background border-border"
                                      />
                                    </div>
                                    <div className="w-1/2 space-y-1">
                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>Time Out</span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">
                                          PM
                                        </span>
                                      </div>
                                      <Input
                                        type="time"
                                        name="afternoon_time_out"
                                        value={updateEntry.afternoon_time_out}
                                        onChange={handleUpdateInputChange}
                                        className="bg-background border-border"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Evening */}
                                <div>
                                  <Label className="flex items-center gap-2 mb-1">
                                    <Clock className="h-4 w-4 text-fuchsia-500" />{" "}
                                    Evening (Optional)
                                    <span className="text-[11px] text-muted-foreground">
                                      Both PM
                                    </span>
                                  </Label>
                                  <div className="flex gap-3 mt-1">
                                    <div className="w-1/2 space-y-1">
                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>Time In</span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-fuchsia-100 text-[10px] font-semibold text-fuchsia-700 dark:bg-fuchsia-900/60 dark:text-fuchsia-200">
                                          PM
                                        </span>
                                      </div>
                                      <Input
                                        type="time"
                                        name="evening_time_in"
                                        value={updateEntry.evening_time_in}
                                        onChange={handleUpdateInputChange}
                                        className="bg-background border-border"
                                      />
                                    </div>
                                    <div className="w-1/2 space-y-1">
                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>Time Out</span>
                                        <span className="px-1.5 py-0.5 rounded-full bg-fuchsia-100 text-[10px] font-semibold text-fuchsia-700 dark:bg-fuchsia-900/60 dark:text-fuchsia-200">
                                          PM
                                        </span>
                                      </div>
                                      <Input
                                        type="time"
                                        name="evening_time_out"
                                        value={updateEntry.evening_time_out}
                                        onChange={handleUpdateInputChange}
                                        className="bg-background border-border"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </SheetHeader>
                            <SheetFooter className="mt-4">
                              <SheetClose asChild>
                                {/* same primary style as Add */}
                                <Button
                                  onClick={() => handleUpdateEntry(entry.id)}
                                  type="submit"
                                >
                                  Submit
                                </Button>
                              </SheetClose>
                            </SheetFooter>
                          </SheetContent>
                        </Sheet>
                        <Button
                          disabled={isDeleting}
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          {isDeleting ? (
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <p>Delete</p>
                          )}
                        </Button>
                      </div>

                      {index < timeEntries.length - 1 && (
                        <Separator className="mt-4 border-border" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="p-3 mt-10 text-center text-xs text-muted-foreground">
          Built with Next.js + Tailwind CSS ·{" "}
          <a
            className="underline hover:text-primary"
            href="https://github.com/jundel-malazarte/"
            target="_blank"
          >
            Jundel Malazarte
          </a>
        </footer>
      </div>
    </div>
  );
}
