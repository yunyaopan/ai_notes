import { CATEGORIES } from '@/lib/config/categories';

export type CategoryKey = typeof CATEGORIES[number]['key'];

export interface TextChunk {
  id?: string;
  content: string;
  category: string; // Using string instead of union type for flexibility
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategorizeRequest {
  text: string;
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
