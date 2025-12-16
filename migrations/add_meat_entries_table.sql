-- Create meat_entries table to store daily meat consumption history
CREATE TABLE IF NOT EXISTS meat_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meat_type TEXT NOT NULL CHECK (meat_type IN ('red_meat', 'salmon', 'chicken', 'other_seafood', 'small_fish')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date, meat_type)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_meat_entries_user_id ON meat_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_meat_entries_date ON meat_entries(date);
CREATE INDEX IF NOT EXISTS idx_meat_entries_user_date ON meat_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meat_entries_user_meat_type ON meat_entries(user_id, meat_type);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meat_entries_updated_at
  BEFORE UPDATE ON meat_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE meat_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own entries
CREATE POLICY "Users can view their own meat entries"
  ON meat_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own entries
CREATE POLICY "Users can insert their own meat entries"
  ON meat_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own entries
CREATE POLICY "Users can update their own meat entries"
  ON meat_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own entries
CREATE POLICY "Users can delete their own meat entries"
  ON meat_entries
  FOR DELETE
  USING (auth.uid() = user_id);
