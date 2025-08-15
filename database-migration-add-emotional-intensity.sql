-- Add emotional_intensity column to text_chunks table
ALTER TABLE text_chunks 
ADD COLUMN emotional_intensity TEXT CHECK (emotional_intensity IN ('low', 'medium', 'high'));

-- Create an index on emotional_intensity for filtering
CREATE INDEX IF NOT EXISTS idx_text_chunks_emotional_intensity ON text_chunks(emotional_intensity);
