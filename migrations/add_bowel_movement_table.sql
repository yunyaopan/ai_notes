-- Create bowel_movement table to store daily bowel movement tracking
CREATE TABLE IF NOT EXISTS bowel_movement (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  occurred BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_bowel_movement_user_id ON bowel_movement(user_id);
CREATE INDEX IF NOT EXISTS idx_bowel_movement_date ON bowel_movement(date);
CREATE INDEX IF NOT EXISTS idx_bowel_movement_user_date ON bowel_movement(user_id, date);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bowel_movement_updated_at
  BEFORE UPDATE ON bowel_movement
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE bowel_movement ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own entries
CREATE POLICY "Users can view their own bowel movement entries"
  ON bowel_movement
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own entries
CREATE POLICY "Users can insert their own bowel movement entries"
  ON bowel_movement
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own entries
CREATE POLICY "Users can update their own bowel movement entries"
  ON bowel_movement
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own entries
CREATE POLICY "Users can delete their own bowel movement entries"
  ON bowel_movement
  FOR DELETE
  USING (auth.uid() = user_id);

