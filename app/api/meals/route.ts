import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWeekMeals, initializeWeekMeals, updateMealEatenStatus } from '@/lib/api/database';
import { ensureSubscription, isSubscriptionOn } from '@/lib/api/subscription';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure subscription exists and check access
    await ensureSubscription(user);
    const hasAccess = await isSubscriptionOn(user);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    // Get week start from query params if provided
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('week_start') || undefined;

    // Get or initialize meals for the current week
    let meals = await getWeekMeals(user.id, weekStart);
    
    // If no meals exist, initialize them
    if (meals.length === 0) {
      meals = await initializeWeekMeals(user.id, weekStart);
    }

    // Transform meals to match component format
    const transformedMeals = meals.map(meal => ({
      id: meal.meal_index,
      type: meal.meat_type,
      eaten: meal.eaten,
    }));

    return NextResponse.json({ meals: transformedMeals });
  } catch (error) {
    console.error('Get meals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure subscription exists and check access
    await ensureSubscription(user);
    const hasAccess = await isSubscriptionOn(user);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    const body = await request.json();
    const { mealId, eaten } = body;

    if (typeof mealId !== 'number' || typeof eaten !== 'boolean') {
      return NextResponse.json(
        { error: 'mealId (number) and eaten (boolean) are required' },
        { status: 400 }
      );
    }

    // First, ensure meals are initialized for this week
    let meals = await getWeekMeals(user.id);
    if (meals.length === 0) {
      meals = await initializeWeekMeals(user.id);
    }

    // Find the meal by meal_index (which is the id in the component)
    const meal = meals.find(m => m.meal_index === mealId);
    if (!meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Update the meal
    const updatedMeal = await updateMealEatenStatus(user.id, meal.id, eaten);

    return NextResponse.json({
      success: true,
      meal: {
        id: updatedMeal.meal_index,
        type: updatedMeal.meat_type,
        eaten: updatedMeal.eaten,
      },
    });
  } catch (error) {
    console.error('Update meal API error:', error);
    return NextResponse.json(
      { error: 'Failed to update meal' },
      { status: 500 }
    );
  }
}

