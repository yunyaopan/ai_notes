export interface TextChunk {
  id?: string;
  content: string;
  category: 'other_emotions' | 'insights' | 'gratitudes' | 'worries_anxiety' | 'other';
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
