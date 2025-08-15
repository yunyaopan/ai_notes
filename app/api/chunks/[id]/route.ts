import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateTextChunk, deleteTextChunk } from '@/lib/api/database';
import { UpdateChunkRequest, UpdateChunkResponse, DeleteChunkResponse } from '@/lib/api/types';
import { getCategoryKeys } from '@/lib/config/categories';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateChunkRequest = await request.json();
    const params = await context.params;
    const chunkId = params.id;
    
    if (!chunkId || typeof chunkId !== 'string') {
      return NextResponse.json({ error: 'Invalid chunk ID' }, { status: 400 });
    }

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!body.category || typeof body.category !== 'string') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // Validate category
    const validCategories = getCategoryKeys();
    if (!validCategories.includes(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const updatedChunk = await updateTextChunk(chunkId, user.id, body.content.trim(), body.category);
    
    const response: UpdateChunkResponse = {
      success: true,
      chunk: updatedChunk
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Update chunk API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update chunk' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const chunkId = params.id;
    
    if (!chunkId || typeof chunkId !== 'string') {
      return NextResponse.json({ error: 'Invalid chunk ID' }, { status: 400 });
    }

    await deleteTextChunk(chunkId, user.id);
    
    const response: DeleteChunkResponse = {
      success: true
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Delete chunk API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete chunk' },
      { status: 500 }
    );
  }
}
