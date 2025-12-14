"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface BowelMovementEntry {
  id: number;
  date: string;
  occurred: boolean;
}

export function BowelMovementTracker() {
  const [entries, setEntries] = useState<BowelMovementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch a larger limit to show more entries on calendar
      const response = await fetch("/api/bowel-movement?limit=100");
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      } else {
        console.error(
          "[BowelMovementTracker] Load data failed:",
          response.status
        );
      }
    } catch (error) {
      console.error("[BowelMovementTracker] Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create a map of dates to entries for quick lookup
  const entriesMap = new Map<string, boolean>();
  entries.forEach((entry) => {
    entriesMap.set(entry.date, entry.occurred);
  });

  const handleDateClick = async (date: Date | undefined) => {
    if (!date) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const currentStatus = entriesMap.get(dateStr);

    // Toggle: if currently true, set to false; if false or undefined, set to true
    const newStatus = currentStatus === true ? false : true;

    setSaving(dateStr);
    try {
      const response = await fetch("/api/bowel-movement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: dateStr,
          occurred: newStatus,
        }),
      });

      if (response.ok) {
        // Reload entries to get updated list
        await loadData();
      } else {
        const error = await response.json();
        console.error("[BowelMovementTracker] POST failed:", error);
        alert(error.error || "Failed to save entry");
      }
    } catch (error) {
      console.error("[BowelMovementTracker] Error saving entry:", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  // Custom day renderer to show circles on dates with entries
  const modifiers = {
    occurred: (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return entriesMap.get(dateStr) === true;
    },
    notOccurred: (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return entriesMap.get(dateStr) === false;
    },
  };

  const modifiersClassNames = {
    occurred:
      "relative after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:w-2.5 after:h-2.5 after:bg-green-500 after:rounded-full after:border-2 after:border-background",
    notOccurred:
      "relative after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:w-2.5 after:h-2.5 after:bg-gray-400 after:rounded-full after:border-2 after:border-background",
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>排便 Tracker</CardTitle>
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
        <CardTitle>排便 Tracker</CardTitle>
        <CardDescription>
          Click on a date to toggle bowel movement status. Green circle = Yes,
          Gray circle = No
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={handleDateClick}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border"
            disabled={saving !== null}
          />
        </div>
        {saving && (
          <p className="text-sm text-center text-muted-foreground">
            Saving {format(new Date(saving), "MMM d, yyyy")}...
          </p>
        )}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Yes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span>No</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
