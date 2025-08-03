import { createClient } from '@supabase/supabase-js';
import type { Submission } from '@shared/gameConfig';

// Supabase configuration - these can be public for client-side access
const supabaseUrl = 'https://xnqxwhbbrpdfxdlvfuyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhucXh3aGJicnBkZnhkbHZmdXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NTg5MTAsImV4cCI6MjA1MjEzNDkxMH0.jkV7m5e64OBPE6GrKdRPcWfmhOvp7S7Hj8Z2YQB-KtM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database interface for Supabase
export interface SupabaseSubmission extends Submission {
  created_at?: string;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      submissions: {
        Row: SupabaseSubmission;
        Insert: Omit<SupabaseSubmission, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SupabaseSubmission, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

// Initialize the database table if it doesn't exist
export async function initializeDatabase() {
  try {
    // Check if the table exists by trying to select from it
    const { error } = await supabase
      .from('submissions')
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('relation "public.submissions" does not exist')) {
      console.log('Database table does not exist. Please create it manually or use the SQL below:');
      console.log(`
CREATE TABLE public.submissions (
  id text PRIMARY KEY,
  team_name text NOT NULL,
  level integer NOT NULL,
  difficulty integer NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  timestamp bigint NOT NULL,
  completed_levels integer[] NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_submissions_team_name ON public.submissions(team_name);
CREATE INDEX idx_submissions_level ON public.submissions(level);
CREATE INDEX idx_submissions_timestamp ON public.submissions(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow read/write access
CREATE POLICY "Allow all operations on submissions" ON public.submissions
FOR ALL
TO anon
USING (true)
WITH CHECK (true);
      `);
      
      // For now, return false to indicate table needs to be created
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

export default supabase;
