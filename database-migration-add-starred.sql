-- Add starred column to text_chunks table
ALTER TABLE text_chunks ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT FALSE;

-- Create an index on starred for filtering starred chunks
CREATE INDEX IF NOT EXISTS idx_text_chunks_starred ON text_chunks(starred);
