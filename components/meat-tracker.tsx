"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

type MeatType =
  | "red_meat"
  | "salmon"
  | "chicken"
  | "other_seafood"
  | "small_fish";

interface MealBox {
  id: number;
  type: MeatType;
  eaten: boolean;
}

interface MeatEntry {
  id: number;
  user_id: string;
  date: string;
  meat_type: MeatType;
  created_at: string;
  updated_at: string;
}

const MEAL_QUOTAS: {
  type: MeatType;
  count: number;
  label: string;
  color: string;
}[] = [
  { type: "red_meat", count: 4, label: "Red Meat", color: "bg-red-500" },
  { type: "salmon", count: 2, label: "Salmon", color: "bg-pink-500" },
  { type: "chicken", count: 2, label: "Chicken", color: "bg-yellow-500" },
  {
    type: "other_seafood",
    count: 1,
    label: "Other Seafood",
    color: "bg-blue-500",
  },
  { type: "small_fish", count: 5, label: "Small Fish", color: "bg-cyan-500" },
];

export function MeatTracker() {
  const [meals, setMeals] = useState<MealBox[]>([]);
  const [entries, setEntries] = useState<MeatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const selectedDate = new Date().toISOString().split("T")[0];

  // Initialize meals with quota info
  useEffect(() => {
    const initializeMeals = async () => {
      try {
        // Fetch current week's meal data
        const response = await fetch("/api/meals");
        if (response.ok) {
          const data = await response.json();
          if (data.meals && data.meals.length > 0) {
            setMeals(data.meals);
          } else {
            // Initialize with quota info
            const initialMeals: MealBox[] = [];
            let id = 1;
            MEAL_QUOTAS.forEach((quota) => {
              for (let i = 0; i < quota.count; i++) {
                initialMeals.push({
                  id: id++,
                  type: quota.type,
                  eaten: false,
                });
              }
            });
            setMeals(initialMeals);
          }
        } else {
          // Initialize with quota info if fetch fails
          const initialMeals: MealBox[] = [];
          let id = 1;
          MEAL_QUOTAS.forEach((quota) => {
            for (let i = 0; i < quota.count; i++) {
              initialMeals.push({
                id: id++,
                type: quota.type,
                eaten: false,
              });
            }
          });
          setMeals(initialMeals);
        }
      } catch (error) {
        console.error("Error fetching meals:", error);
        // Initialize with quota info on error
        const initialMeals: MealBox[] = [];
        let id = 1;
        MEAL_QUOTAS.forEach((quota) => {
          for (let i = 0; i < quota.count; i++) {
            initialMeals.push({
              id: id++,
              type: quota.type,
              eaten: false,
            });
          }
        });
        setMeals(initialMeals);
      } finally {
        setLoading(false);
      }
    };

    initializeMeals();
  }, []);

  // Load meat entries history
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const response = await fetch("/api/meat-entries");
        if (response.ok) {
          const data = await response.json();
          setEntries(data.entries || []);
        }
      } catch (error) {
        console.error("Error loading meat entries:", error);
      }
    };

    loadEntries();
  }, []);

  const handleMealClick = async (mealId: number) => {
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;

    setUpdating(mealId);
    const newEatenState = !meal.eaten;

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealId,
          eaten: newEatenState,
        }),
      });

      if (response.ok) {
        setMeals((prevMeals) =>
          prevMeals.map((m) =>
            m.id === mealId ? { ...m, eaten: newEatenState } : m
          )
        );

        // If meal is now marked as eaten, add entry to history
        if (newEatenState) {
          const meatType = meal.type;
          try {
            const addResponse = await fetch("/api/meat-entries", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                date: selectedDate,
                meat_type: meatType,
              }),
            });

            if (addResponse.ok) {
              const newEntry = await addResponse.json();
              setEntries((prev) => [newEntry.entry, ...prev].slice(0, 10));
            }
          } catch (error) {
            console.error("Error adding meat entry:", error);
          }
        }
      } else {
        console.error("Failed to update meal");
      }
    } catch (error) {
      console.error("Error updating meal:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    setDeleting(entryId);
    try {
      const response = await fetch("/api/meat-entries", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entryId }),
      });

      if (response.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      } else {
        console.error("Failed to delete entry");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    } finally {
      setDeleting(null);
    }
  };

  const getMealTypeInfo = (type: MeatType) => {
    return MEAL_QUOTAS.find((q) => q.type === type)!;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Meat Tracker</CardTitle>
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
        <CardTitle>Weekly Meat Tracker</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click on a meal box to mark it as eaten and record it. Click again to
          undo.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {meals.map((meal) => {
            const typeInfo = getMealTypeInfo(meal.type);
            const isUpdating = updating === meal.id;

            return (
              <button
                key={meal.id}
                onClick={() => handleMealClick(meal.id)}
                disabled={isUpdating}
                className={cn(
                  "relative aspect-square rounded-lg border-2 transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  meal.eaten
                    ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
                  meal.eaten && "ring-2 ring-green-500 ring-offset-2"
                )}
                title={`${typeInfo.label} - ${
                  meal.eaten ? "Eaten" : "Not eaten"
                }`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full mb-1",
                      typeInfo.color,
                      meal.eaten && "opacity-50"
                    )}
                  />
                  <span className="text-xs font-medium text-center leading-tight">
                    {typeInfo.label}
                  </span>
                  {meal.eaten && (
                    <span className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓
                    </span>
                  )}
                </div>
                {isUpdating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-4 text-sm">
            {MEAL_QUOTAS.map((quota) => {
              const eatenCount = meals.filter(
                (m) => m.type === quota.type && m.eaten
              ).length;
              return (
                <div key={quota.type} className="flex items-center gap-2">
                  <div className={cn("w-4 h-4 rounded-full", quota.color)} />
                  <span className="font-medium">{quota.label}:</span>
                  <span
                    className={cn(
                      eatenCount === quota.count
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {eatenCount}/{quota.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* History Section */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold text-lg mb-4">
            Recent History (Last 10 Entries)
          </h3>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recorded entries yet
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const typeInfo = getMealTypeInfo(entry.meat_type);
                const isDeletingThis = deleting === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn("w-3 h-3 rounded-full", typeInfo.color)}
                      />
                      <div>
                        <p className="text-sm font-medium">{typeInfo.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.date)} at{" "}
                          {formatTime(entry.created_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={isDeletingThis}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      {isDeletingThis ? (
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
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
