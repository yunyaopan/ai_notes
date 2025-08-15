-- Create the text_chunks table
CREATE TABLE IF NOT EXISTS text_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_text_chunks_user_id ON text_chunks(user_id);

-- Create an index on category for filtering
CREATE INDEX IF NOT EXISTS idx_text_chunks_category ON text_chunks(category);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_text_chunks_created_at ON text_chunks(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE text_chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own chunks
CREATE POLICY "Users can view own text_chunks" ON text_chunks
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own chunks
CREATE POLICY "Users can insert own text_chunks" ON text_chunks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own chunks
CREATE POLICY "Users can update own text_chunks" ON text_chunks
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own chunks
CREATE POLICY "Users can delete own text_chunks" ON text_chunks
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_text_chunks_updated_at
    BEFORE UPDATE ON text_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
