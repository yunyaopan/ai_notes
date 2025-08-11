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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch chunks from database');
  }

  return data || [];
}
