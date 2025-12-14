import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSettings, updateUserSettings } from '@/lib/api/database';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getUserSettings(user.id);

    return NextResponse.json({ 
      anxietyCharacter: settings?.anxiety_character || null 
    });
  } catch (error) {
    console.error('Error fetching anxiety character:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch anxiety character' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { anxietyCharacter } = body;

    if (!anxietyCharacter || !['octupus', 'yellow', 'worm', 'furry'].includes(anxietyCharacter)) {
      return NextResponse.json(
        { error: 'Invalid anxiety character. Must be one of: octupus, yellow, worm, furry' },
        { status: 400 }
      );
    }

    const settings = await updateUserSettings(user.id, anxietyCharacter);

    return NextResponse.json({ 
      success: true,
      anxietyCharacter: settings.anxiety_character 
    });
  } catch (error) {
    console.error('Error updating anxiety character:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update anxiety character' },
      { status: 500 }
    );
  }
}

