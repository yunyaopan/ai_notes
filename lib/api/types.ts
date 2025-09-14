import { CATEGORIES } from '@/lib/config/categories';

export type CategoryKey = typeof CATEGORIES[number]['key'];

export interface TextChunk {
  id?: string;
  content: string;
  category: string; // Using string instead of union type for flexibility
  emotional_intensity?: 'low' | 'medium' | 'high' | null;
  importance?: '1' | '2' | '3' | 'deprioritized' | null;
  pinned?: boolean;
  starred?: boolean;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategorizeRequest {
  text: string;
  emotionalIntensity?: 'low' | 'medium' | 'high' | null;
}

export interface CategorizeResponse {
  chunks: Omit<TextChunk, 'id' | 'user_id' | 'created_at' | 'updated_at'>[];
}

export interface SaveChunksRequest {
  chunks: Omit<TextChunk, 'id' | 'user_id' | 'created_at' | 'updated_at'>[];
}

export interface SaveChunksResponse {
  success: boolean;
  chunks: TextChunk[];
}

export interface PinChunkRequest {
  chunkId: string;
  pinned: boolean;
}

export interface PinChunkResponse {
  success: boolean;
  chunk: TextChunk;
}

export interface UpdateChunkRequest {
  content: string;
  category: string;
}

export interface UpdateChunkResponse {
  success: boolean;
  chunk: TextChunk;
}

export interface DeleteChunkResponse {
  success: boolean;
}

export interface UpdateImportanceRequest {
  chunkId: string;
  importance: '1' | '2' | '3' | 'deprioritized' | null;
}

export interface UpdateImportanceResponse {
  success: boolean;
  chunk: TextChunk;
}
