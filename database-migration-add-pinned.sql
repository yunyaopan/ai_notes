-- Migration to add pinned field to existing text_chunks table
-- Run this in your Supabase SQL editor

-- Add the pinned column with default value FALSE
ALTER TABLE text_chunks ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;

-- Create an index on pinned for better query performance
CREATE INDEX IF NOT EXISTS idx_text_chunks_pinned ON text_chunks(pinned);

-- Optional: Set a specific chunk as pinned for testing
-- UPDATE text_chunks SET pinned = TRUE WHERE id = 'your-chunk-id-here' AND user_id = auth.uid();
