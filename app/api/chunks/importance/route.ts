import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateImportanceRequest, UpdateImportanceResponse } from '@/lib/api/types';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateImportanceRequest = await request.json();
    
    if (!body.chunkId || typeof body.chunkId !== 'string') {
      return NextResponse.json({ error: 'Chunk ID is required' }, { status: 400 });
    }

    // Validate importance value
    const validImportance = ['1', '2', '3', 'deprioritized', null];
    if (body.importance !== null && !validImportance.includes(body.importance)) {
      return NextResponse.json({ error: 'Invalid importance value' }, { status: 400 });
    }

    // Update the chunk importance
    const { data, error } = await supabase
      .from('text_chunks')
      .update({ 
        importance: body.importance,
        updated_at: new Date().toISOString() 
      })
      .eq('id', body.chunkId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating importance:', error);
      return NextResponse.json({ error: 'Failed to update importance' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Chunk not found or access denied' }, { status: 404 });
    }

    const response: UpdateImportanceResponse = {
      success: true,
      chunk: data
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Update importance API error:', error);
    return NextResponse.json(
      { error: 'Failed to update importance' },
      { status: 500 }
    );
  }
}
