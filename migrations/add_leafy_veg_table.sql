-- Create leafy_veg table to store daily leafy vegetable consumption
CREATE TABLE IF NOT EXISTS leafy_veg (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  grams INTEGER NOT NULL CHECK (grams >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_leafy_veg_user_id ON leafy_veg(user_id);
CREATE INDEX IF NOT EXISTS idx_leafy_veg_date ON leafy_veg(date);
CREATE INDEX IF NOT EXISTS idx_leafy_veg_user_date ON leafy_veg(user_id, date);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leafy_veg_updated_at
  BEFORE UPDATE ON leafy_veg
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE leafy_veg ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own entries
CREATE POLICY "Users can view their own leafy veg entries"
  ON leafy_veg
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own entries
CREATE POLICY "Users can insert their own leafy veg entries"
  ON leafy_veg
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own entries
CREATE POLICY "Users can update their own leafy veg entries"
  ON leafy_veg
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own entries
CREATE POLICY "Users can delete their own leafy veg entries"
  ON leafy_veg
  FOR DELETE
  USING (auth.uid() = user_id);

