import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveTextChunks, getUserTextChunks } from '@/lib/api/database';
import { SaveChunksRequest, SaveChunksResponse } from '@/lib/api/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SaveChunksRequest = await request.json();
    
    if (!body.chunks || !Array.isArray(body.chunks) || body.chunks.length === 0) {
      return NextResponse.json({ error: 'Chunks array is required' }, { status: 400 });
    }

    // Validate each chunk
    for (const chunk of body.chunks) {
      if (!chunk.content || typeof chunk.content !== 'string') {
        return NextResponse.json({ error: 'Each chunk must have content' }, { status: 400 });
      }
      if (!chunk.category || !['other_emotions', 'insights', 'gratitudes', 'worries_anxiety', 'other'].includes(chunk.category)) {
        return NextResponse.json({ error: 'Each chunk must have a valid category' }, { status: 400 });
      }
    }

    const savedChunks = await saveTextChunks(body.chunks, user.id);
    
    const response: SaveChunksResponse = {
      success: true,
      chunks: savedChunks
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Save chunks API error:', error);
    return NextResponse.json(
      { error: 'Failed to save chunks' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chunks = await getUserTextChunks(user.id);
    
    return NextResponse.json({ chunks });
  } catch (error) {
    console.error('Get chunks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chunks' },
      { status: 500 }
    );
  }
}
