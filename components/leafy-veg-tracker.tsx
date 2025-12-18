"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

const DAILY_GOAL = 250; // grams per day
const WEEKLY_GOAL = DAILY_GOAL * 7; // 1750 grams per week

interface LeafyVegEntry {
  id: number;
  date: string;
  grams: number;
}

export function LeafyVegTracker() {
  const [todayGrams, setTodayGrams] = useState<string>("");
  const [weekTotal, setWeekTotal] = useState<number>(0);
  const [entries, setEntries] = useState<LeafyVegEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editGrams, setEditGrams] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPastDate, setSelectedPastDate] = useState<string>("");
  const [pastGrams, setPastGrams] = useState<string>("");
  const [addingPastEntry, setAddingPastEntry] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log("[LeafyVegTracker] Loading data...");
      const response = await fetch("/api/leafy-veg");
      if (response.ok) {
        const data = await response.json();
        console.log("[LeafyVegTracker] Load data response:", {
          weekTotal: data.weekTotal,
          entriesCount: data.entries?.length || 0,
          todayEntry: data.todayEntry,
          fullData: data,
        });
        setWeekTotal(data.weekTotal || 0);
        setEntries(data.entries || []);

        // Set today's grams if entry exists
        if (data.todayEntry) {
          setTodayGrams(data.todayEntry.grams.toString());
        } else {
          setTodayGrams("");
        }
        console.log(
          "[LeafyVegTracker] State updated - weekTotal:",
          data.weekTotal || 0
        );
      } else {
        console.error(
          "[LeafyVegTracker] Load data failed:",
          response.status,
          await response.text()
        );
      }
    } catch (error) {
      console.error("[LeafyVegTracker] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToday = async () => {
    const grams = parseInt(todayGrams, 10);
    console.log(
      "[LeafyVegTracker] handleSaveToday called with grams:",
      grams,
      "today:",
      today
    );
    if (isNaN(grams) || grams < 0) {
      alert("Please enter a valid number of grams (0 or greater)");
      return;
    }

    setSaving(true);
    try {
      console.log("[LeafyVegTracker] Sending POST request with:", {
        date: today,
        grams,
      });
      const response = await fetch("/api/leafy-veg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: today,
          grams,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[LeafyVegTracker] POST response:", {
          success: data.success,
          entry: data.entry,
          weekTotal: data.weekTotal,
          fullData: data,
        });

        // Update weekTotal immediately from response - this should trigger progress bar update
        console.log(
          "[LeafyVegTracker] Setting weekTotal to:",
          data.weekTotal || 0
        );
        setWeekTotal(data.weekTotal || 0);

        // Reload entries to get updated list
        console.log("[LeafyVegTracker] Reloading data after save...");
        const reloadResponse = await fetch("/api/leafy-veg");
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json();
          console.log("[LeafyVegTracker] Reload response:", {
            weekTotal: reloadData.weekTotal,
            entriesCount: reloadData.entries?.length || 0,
            todayEntry: reloadData.todayEntry,
          });

          // Ensure we have the latest weekTotal
          console.log(
            "[LeafyVegTracker] Setting weekTotal from reload to:",
            reloadData.weekTotal || 0
          );
          setWeekTotal(reloadData.weekTotal || 0);
          setEntries(reloadData.entries || []);
          if (reloadData.todayEntry) {
            setTodayGrams(reloadData.todayEntry.grams.toString());
          } else if (data.entry && data.entry.date === today) {
            setTodayGrams(data.entry.grams.toString());
          }
        } else {
          console.error(
            "[LeafyVegTracker] Reload failed:",
            reloadResponse.status
          );
        }
      } else {
        const error = await response.json();
        console.error("[LeafyVegTracker] POST failed:", error);
        alert(error.error || "Failed to save entry");
      }
    } catch (error) {
      console.error("[LeafyVegTracker] Error saving entry:", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (entry: LeafyVegEntry) => {
    setEditingId(entry.id);
    setEditGrams(entry.grams.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditGrams("");
  };

  const handleSaveEdit = async (entryId: number, date: string) => {
    const grams = parseInt(editGrams, 10);
    console.log("[LeafyVegTracker] handleSaveEdit called with:", {
      entryId,
      date,
      grams,
    });
    if (isNaN(grams) || grams < 0) {
      alert("Please enter a valid number of grams (0 or greater)");
      return;
    }

    try {
      console.log("[LeafyVegTracker] Sending POST request for edit with:", {
        date,
        grams,
      });
      const response = await fetch("/api/leafy-veg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          grams,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[LeafyVegTracker] Edit POST response:", {
          success: data.success,
          entry: data.entry,
          weekTotal: data.weekTotal,
          fullData: data,
        });

        // Update weekTotal immediately from response - this should trigger progress bar update
        console.log(
          "[LeafyVegTracker] Setting weekTotal to:",
          data.weekTotal || 0
        );
        setWeekTotal(data.weekTotal || 0);
        setEditingId(null);
        setEditGrams("");

        // Reload entries to get updated list
        console.log("[LeafyVegTracker] Reloading data after edit...");
        const reloadResponse = await fetch("/api/leafy-veg");
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json();
          console.log("[LeafyVegTracker] Reload response:", {
            weekTotal: reloadData.weekTotal,
            entriesCount: reloadData.entries?.length || 0,
            todayEntry: reloadData.todayEntry,
          });

          // Ensure we have the latest weekTotal
          console.log(
            "[LeafyVegTracker] Setting weekTotal from reload to:",
            reloadData.weekTotal || 0
          );
          setWeekTotal(reloadData.weekTotal || 0);
          setEntries(reloadData.entries || []);
          if (reloadData.todayEntry) {
            setTodayGrams(reloadData.todayEntry.grams.toString());
          }
        } else {
          console.error(
            "[LeafyVegTracker] Reload failed:",
            reloadResponse.status
          );
        }
      } else {
        const error = await response.json();
        console.error("[LeafyVegTracker] Edit POST failed:", error);
        alert(error.error || "Failed to update entry");
      }
    } catch (error) {
      console.error("[LeafyVegTracker] Error updating entry:", error);
      alert("Failed to update entry. Please try again.");
    }
  };

  const progressPercentage = Math.min((weekTotal / WEEKLY_GOAL) * 100, 100);

  const handleAddPastEntry = async () => {
    if (!selectedPastDate || !pastGrams) {
      alert("Please select both a date and enter grams");
      return;
    }

    const grams = parseInt(pastGrams, 10);
    if (isNaN(grams) || grams < 0) {
      alert("Please enter a valid number of grams (0 or greater)");
      return;
    }

    setAddingPastEntry(true);
    try {
      const response = await fetch("/api/leafy-veg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedPastDate,
          grams,
        }),
      });

      if (response.ok) {
        // Reload data to get updated entries and week total
        const reloadResponse = await fetch("/api/leafy-veg");
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json();
          setWeekTotal(reloadData.weekTotal || 0);
          setEntries(reloadData.entries || []);
        }
        setDialogOpen(false);
        setSelectedPastDate("");
        setPastGrams("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add entry");
      }
    } catch (error) {
      console.error("Error adding entry:", error);
      alert("Error adding entry");
    } finally {
      setAddingPastEntry(false);
    }
  };

  // Log progress calculation on every render
  useEffect(() => {
    console.log("[LeafyVegTracker] Render values:", {
      weekTotal,
      WEEKLY_GOAL,
      progressPercentage,
      calculation: `(${weekTotal} / ${WEEKLY_GOAL}) * 100 = ${progressPercentage}%`,
    });
  }, [weekTotal, progressPercentage]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leafy Vegetables Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leafy Vegetables Tracker</CardTitle>
        <CardDescription>
          Daily goal: {DAILY_GOAL}g | Weekly goal: {WEEKLY_GOAL}g
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Input */}
        <div className="space-y-2">
          <Label htmlFor="today-grams" className="text-base font-semibold">
            {todayFormatted}
          </Label>
          <div className="flex gap-2">
            <Input
              id="today-grams"
              type="number"
              min="0"
              placeholder="Enter grams consumed today"
              value={todayGrams}
              onChange={(e) => setTodayGrams(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveToday();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSaveToday}
              disabled={saving || !todayGrams}
              className="min-w-[100px]"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Weekly Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold">Weekly Progress</Label>
            <span className="text-sm text-muted-foreground">
              {weekTotal.toLocaleString()}g / {WEEKLY_GOAL.toLocaleString()}g
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-3"
            key={weekTotal}
            data-week-total={weekTotal}
            data-progress={progressPercentage}
          />
          <p className="text-xs text-muted-foreground">
            {progressPercentage >= 100
              ? "🎉 Weekly goal achieved!"
              : `${Math.round(WEEKLY_GOAL - weekTotal)}g remaining this week`}
          </p>
        </div>

        <Separator />

        {/* Recent Entries */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Recent Entries (Last 10)
            </Label>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </Button>
          </div>
          
          {/* Modal Overlay */}
          {dialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div
                className="bg-white dark:bg-gray-950 rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Add Entry for Different Date</h2>
                  <button
                    onClick={() => setDialogOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a date and enter the grams consumed
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="past-date">Date</Label>
                    <Input
                      id="past-date"
                      type="date"
                      value={selectedPastDate}
                      onChange={(e) => setSelectedPastDate(e.target.value)}
                      max={today}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="past-grams">Grams</Label>
                    <Input
                      id="past-grams"
                      type="number"
                      min="0"
                      placeholder="Enter grams consumed"
                      value={pastGrams}
                      onChange={(e) => setPastGrams(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleAddPastEntry}
                      disabled={
                        addingPastEntry || !selectedPastDate || !pastGrams
                      }
                      className="flex-1"
                    >
                      {addingPastEntry ? "Adding..." : "Add Entry"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div onClick={() => dialogOpen && setDialogOpen(false)} className={dialogOpen ? "fixed inset-0 z-40" : "hidden"} />
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No entries yet. Start tracking your leafy vegetable consumption!
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const entryDate = new Date(entry.date);
                const isToday = entry.date === today;
                const dateFormatted = entryDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year:
                    entryDate.getFullYear() !== new Date().getFullYear()
                      ? "numeric"
                      : undefined,
                });

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      isToday && "bg-primary/5 border-primary/20"
                    )}
                  >
                    {editingId === entry.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium min-w-[120px]">
                          {dateFormatted}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          value={editGrams}
                          onChange={(e) => setEditGrams(e.target.value)}
                          className="w-24"
                          autoFocus
                        />
                        <span className="text-sm text-muted-foreground">g</span>
                        <div className="flex gap-1 ml-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveEdit(entry.id, entry.date)}
                            className="h-8"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-8"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium min-w-[120px]">
                            {dateFormatted}
                            {isToday && (
                              <span className="ml-2 text-xs text-primary font-semibold">
                                (Today)
                              </span>
                            )}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {entry.grams.toLocaleString()}g
                          </span>
                          {entry.grams >= DAILY_GOAL && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              ✓ Goal met
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(entry)}
                          className="h-8"
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
