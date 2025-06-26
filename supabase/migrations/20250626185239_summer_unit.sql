/*
  # Create profiles and measurements tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, optional)
      - `preferences` (jsonb for storing user preferences)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `measurements`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key to profiles)
      - `measurements` (jsonb for storing body measurements)
      - `raw_landmarks` (jsonb for storing pose landmark data)
      - `confidence` (decimal for measurement confidence)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  preferences jsonb DEFAULT '{"units": "inches", "fit": "regular"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  measurements jsonb NOT NULL,
  raw_landmarks jsonb NOT NULL,
  confidence decimal(3,2) DEFAULT 0.75,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create policies for measurements table
CREATE POLICY "Users can view own measurements"
  ON measurements
  FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can insert own measurements"
  ON measurements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can update own measurements"
  ON measurements
  FOR UPDATE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth.uid()::text = id::text
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE auth.uid()::text = id::text
    )
  );

CREATE POLICY "Users can delete own measurements"
  ON measurements
  FOR DELETE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE auth.uid()::text = id::text
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_measurements_profile_id ON measurements(profile_id);
CREATE INDEX IF NOT EXISTS idx_measurements_created_at ON measurements(created_at DESC);

-- Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();