import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateChunkStarStatus } from '@/lib/api/database';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chunkId, starred } = body;

    if (!chunkId || typeof starred !== 'boolean') {
      return NextResponse.json({ error: 'chunkId and starred are required' }, { status: 400 });
    }

    const updatedChunk = await updateChunkStarStatus(chunkId, user.id, starred);
    
    return NextResponse.json({ chunk: updatedChunk });
  } catch (error) {
    console.error('Star API error:', error);
    return NextResponse.json(
      { error: 'Failed to update star status' },
      { status: 500 }
    );
  }
}
