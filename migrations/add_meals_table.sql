-- Create meals table to store weekly meal tracking data
CREATE TABLE IF NOT EXISTS meals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  meal_index INTEGER NOT NULL CHECK (meal_index >= 1 AND meal_index <= 14),
  meat_type TEXT NOT NULL CHECK (meat_type IN ('red_meat', 'salmon', 'chicken', 'other_seafood', 'small_fish')),
  eaten BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start, meal_index)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_week_start ON meals(week_start);
CREATE INDEX IF NOT EXISTS idx_meals_user_week ON meals(user_id, week_start);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own meals
CREATE POLICY "Users can view their own meals"
  ON meals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own meals
CREATE POLICY "Users can insert their own meals"
  ON meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own meals
CREATE POLICY "Users can update their own meals"
  ON meals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

