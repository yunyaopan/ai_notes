import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateChunkPinStatus } from '@/lib/api/database';
import { PinChunkRequest, PinChunkResponse } from '@/lib/api/types';
import { ensureSubscription, isSubscriptionOn } from '@/lib/api/subscription';

export async function PATCH(request: NextRequest) {
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

    const body: PinChunkRequest = await request.json();
    
    if (!body.chunkId || typeof body.chunkId !== 'string') {
      return NextResponse.json({ error: 'Chunk ID is required' }, { status: 400 });
    }

    if (typeof body.pinned !== 'boolean') {
      return NextResponse.json({ error: 'Pinned status must be a boolean' }, { status: 400 });
    }

    const updatedChunk = await updateChunkPinStatus(body.chunkId, user.id, body.pinned);
    
    const response: PinChunkResponse = {
      success: true,
      chunk: updatedChunk
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Pin chunk API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update pin status' },
      { status: 500 }
    );
  }
}
