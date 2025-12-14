import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getBowelMovementEntries, 
  getTodayBowelMovement,
  upsertBowelMovementEntry 
} from '@/lib/api/database';
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'today') {
      const date = searchParams.get('date') || undefined;
      const entry = await getTodayBowelMovement(user.id, date);
      return NextResponse.json({ entry });
    }

    // Default: get recent entries
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const entries = await getBowelMovementEntries(user.id, limit);
    const todayEntry = await getTodayBowelMovement(user.id);

    return NextResponse.json({ 
      entries,
      todayEntry
    });
  } catch (error) {
    console.error('Get bowel movement API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bowel movement data' },
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
    const { date, occurred } = body;

    if (!date || typeof date !== 'string') {
      return NextResponse.json(
        { error: 'date (string) is required' },
        { status: 400 }
      );
    }

    if (typeof occurred !== 'boolean') {
      return NextResponse.json(
        { error: 'occurred (boolean) is required' },
        { status: 400 }
      );
    }

    const entry = await upsertBowelMovementEntry(user.id, date, occurred);

    return NextResponse.json({
      success: true,
      entry
    });
  } catch (error) {
    console.error('Update bowel movement API error:', error);
    return NextResponse.json(
      { error: 'Failed to update bowel movement entry' },
      { status: 500 }
    );
  }
}

