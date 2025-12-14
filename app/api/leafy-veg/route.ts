import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getLeafyVegEntries, 
  getWeekLeafyVegTotal, 
  getTodayLeafyVeg,
  upsertLeafyVegEntry 
} from '@/lib/api/database';
import { ensureSubscription, isSubscriptionOn } from '@/lib/api/subscription';

function getWeekStart(date?: Date | string): string {
  let d: Date;
  if (date) {
    if (typeof date === 'string') {
      // Parse date string as local date (Singapore timezone)
      // Format: YYYY-MM-DD
      const [year, month, day] = date.split('-').map(Number);
      d = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      d = new Date(date);
    }
  } else {
    d = new Date();
  }
  
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // If it's Sunday (0), go back 6 days to get Monday
  // Otherwise, go back (day - 1) days to get Monday
  const daysToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(monday.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  
  // Format as YYYY-MM-DD in local timezone
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
}

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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'week-total') {
      const weekStart = searchParams.get('week_start') || getWeekStart();
      const total = await getWeekLeafyVegTotal(user.id, weekStart);
      return NextResponse.json({ total });
    }

    if (action === 'today') {
      const date = searchParams.get('date') || undefined;
      const entry = await getTodayLeafyVeg(user.id, date);
      return NextResponse.json({ entry });
    }

    // Default: get recent entries
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const entries = await getLeafyVegEntries(user.id, limit);
    // Calculate week start based on today's date for the progress bar
    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart(today);
    const weekTotal = await getWeekLeafyVegTotal(user.id, weekStart);
    const todayEntry = await getTodayLeafyVeg(user.id);

    console.log('[API /leafy-veg GET] Response data:', {
      entriesCount: entries.length,
      weekStart,
      weekTotal,
      todayEntry,
      entries: entries.slice(0, 3) // Log first 3 entries
    });

    return NextResponse.json({ 
      entries,
      weekTotal,
      todayEntry,
      weekStart
    });
  } catch (error) {
    console.error('Get leafy veg API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leafy veg data' },
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
    const { date, grams } = body;

    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'date (string) is required' },
        { status: 400 }
      );
    }

    if (typeof grams !== 'number' || grams < 0) {
      return NextResponse.json(
        { error: 'grams (number >= 0) is required' },
        { status: 400 }
      );
    }

    const entry = await upsertLeafyVegEntry(user.id, date, grams);
    // Calculate week start based on the entry's date, not current date
    const weekStart = getWeekStart(date);
    const weekTotal = await getWeekLeafyVegTotal(user.id, weekStart);

    console.log('[API /leafy-veg POST] Response data:', {
      entry,
      weekStart,
      weekTotal,
      date,
      grams
    });

    return NextResponse.json({
      success: true,
      entry,
      weekTotal
    });
  } catch (error) {
    console.error('Update leafy veg API error:', error);
    return NextResponse.json(
      { error: 'Failed to update leafy veg entry' },
      { status: 500 }
    );
  }
}

