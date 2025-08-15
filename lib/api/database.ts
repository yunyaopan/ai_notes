import { createClient } from '@/lib/supabase/server';
import { TextChunk } from './types';

export async function saveTextChunks(chunks: Omit<TextChunk, 'id' | 'user_id' | 'created_at' | 'updated_at'>[], userId: string): Promise<TextChunk[]> {
  const supabase = await createClient();
  
  const chunksToInsert = chunks.map(chunk => ({
    ...chunk,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from('text_chunks')
    .insert(chunksToInsert)
    .select();

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to save chunks to database');
  }

  return data || [];
}

export async function getUserTextChunks(userId: string): Promise<TextChunk[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('text_chunks')
    .select('*')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch chunks from database');
  }

  return data || [];
}

export async function updateChunkPinStatus(chunkId: string, userId: string, pinned: boolean): Promise<TextChunk> {
  const supabase = await createClient();
  
  // First, if we're pinning this chunk, unpin all other chunks for this user
  if (pinned) {
    const { error: unpinError } = await supabase
      .from('text_chunks')
      .update({ pinned: false })
      .eq('user_id', userId)
      .eq('pinned', true);
    
    if (unpinError) {
      console.error('Database error unpinning other chunks:', unpinError);
      throw new Error('Failed to unpin other chunks');
    }
  }
  
  // Now update the target chunk
  const { data, error } = await supabase
    .from('text_chunks')
    .update({ pinned, updated_at: new Date().toISOString() })
    .eq('id', chunkId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Database error updating pin status:', error);
    throw new Error('Failed to update chunk pin status');
  }

  if (!data) {
    throw new Error('Chunk not found or access denied');
  }

  return data;
}
