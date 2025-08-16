-- Add importance column to text_chunks table
ALTER TABLE text_chunks 
ADD COLUMN importance TEXT CHECK (importance IN ('1', '2', '3', 'deprioritized'));

-- Create an index on importance for filtering
CREATE INDEX IF NOT EXISTS idx_text_chunks_importance ON text_chunks(importance);

-- Create composite index for category and importance filtering
CREATE INDEX IF NOT EXISTS idx_text_chunks_category_importance ON text_chunks(category, importance);
