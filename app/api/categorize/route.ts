import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorizeText } from '@/lib/api/openrouter';
import { CategorizeRequest, CategorizeResponse } from '@/lib/api/types';
import { ensureSubscription, isSubscriptionOn } from '@/lib/api/subscription';

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

    const body: CategorizeRequest = await request.json();
    
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }


    const chunks = await categorizeText(body.text);
    
    // Add emotional intensity to all chunks if provided
    const chunksWithIntensity = body.emotionalIntensity ? 
      chunks.map((chunk) => ({ ...chunk, emotional_intensity: body.emotionalIntensity })) :
      chunks;
    
    const response: CategorizeResponse = {
      chunks: chunksWithIntensity
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Categorize API error:', error);
    return NextResponse.json(
      { error: 'Failed to categorize text' },
      { status: 500 }
    );
  }
}
