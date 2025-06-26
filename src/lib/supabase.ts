import { createClient } from '@supabase/supabase-js';
import { DatabaseProfile, DatabaseMeasurement } from '../types/measurements';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DatabaseProfile;
        Insert: Omit<DatabaseProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
      measurements: {
        Row: DatabaseMeasurement;
        Insert: Omit<DatabaseMeasurement, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseMeasurement, 'id' | 'created_at'>>;
      };
    };
  };
}