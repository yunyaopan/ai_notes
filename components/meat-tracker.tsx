'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MeatType = 'red_meat' | 'salmon' | 'chicken' | 'other_seafood' | 'small_fish';

interface MealBox {
  id: number;
  type: MeatType;
  eaten: boolean;
}

const MEAL_QUOTAS: { type: MeatType; count: number; label: string; color: string }[] = [
  { type: 'red_meat', count: 4, label: 'Red Meat', color: 'bg-red-500' },
  { type: 'salmon', count: 2, label: 'Salmon', color: 'bg-pink-500' },
  { type: 'chicken', count: 2, label: 'Chicken', color: 'bg-yellow-500' },
  { type: 'other_seafood', count: 1, label: 'Other Seafood', color: 'bg-blue-500' },
  { type: 'small_fish', count: 5, label: 'Small Fish', color: 'bg-cyan-500' },
];

export function MeatTracker() {
  const [meals, setMeals] = useState<MealBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  // Initialize meals with quota info
  useEffect(() => {
    const initializeMeals = async () => {
      try {
        // Fetch current week's meal data
        const response = await fetch('/api/meals');
        if (response.ok) {
          const data = await response.json();
          if (data.meals && data.meals.length > 0) {
            setMeals(data.meals);
          } else {
            // Initialize with quota info
            const initialMeals: MealBox[] = [];
            let id = 1;
            MEAL_QUOTAS.forEach(quota => {
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
          MEAL_QUOTAS.forEach(quota => {
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
        console.error('Error fetching meals:', error);
        // Initialize with quota info on error
        const initialMeals: MealBox[] = [];
        let id = 1;
        MEAL_QUOTAS.forEach(quota => {
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

  const handleMealClick = async (mealId: number) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;

    setUpdating(mealId);
    const newEatenState = !meal.eaten;

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mealId,
          eaten: newEatenState,
        }),
      });

      if (response.ok) {
        setMeals(prevMeals =>
          prevMeals.map(m => (m.id === mealId ? { ...m, eaten: newEatenState } : m))
        );
      } else {
        console.error('Failed to update meal');
      }
    } catch (error) {
      console.error('Error updating meal:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getMealTypeInfo = (type: MeatType) => {
    return MEAL_QUOTAS.find(q => q.type === type)!;
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
          Click on a meal box to mark it as eaten. Click again to undo.
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
                title={`${typeInfo.label} - ${meal.eaten ? 'Eaten' : 'Not eaten'}`}
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
              const eatenCount = meals.filter(m => m.type === quota.type && m.eaten).length;
              return (
                <div key={quota.type} className="flex items-center gap-2">
                  <div className={cn("w-4 h-4 rounded-full", quota.color)} />
                  <span className="font-medium">{quota.label}:</span>
                  <span className={cn(
                    eatenCount === quota.count ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                  )}>
                    {eatenCount}/{quota.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

