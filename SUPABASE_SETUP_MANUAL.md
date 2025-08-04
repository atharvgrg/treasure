# 🔥 Manual Supabase Setup (If Needed)

## If Automatic Setup Fails

If you see connection errors, manually create the table in your Supabase dashboard:

### 1. **Go to Supabase Dashboard**

- Visit: https://supabase.com/dashboard/projects
- Click your project: `ogwqprcxmivlolpmhicm`

### 2. **Go to SQL Editor**

- Click "SQL Editor" in the left sidebar
- Click "New Query"

### 3. **Create Table**

Copy and paste this SQL:

```sql
-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "teamName" TEXT NOT NULL,
  level INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,
  "completedLevels" INTEGER[] NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("teamName", level)
);

-- Enable Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON public.submissions
FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_level ON public.submissions(level);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON public.submissions("teamName");
CREATE INDEX IF NOT EXISTS idx_submissions_timestamp ON public.submissions(timestamp);
```

### 4. **Run the SQL**

- Click "Run" button
- You should see "Success. No rows returned"

### 5. **Verify**

- Go to "Table Editor" in left sidebar
- You should see the "submissions" table

## ✅ **After Manual Setup**

- Refresh your app
- Should show: `🔥 Supabase connected • 0 submissions • Real-time active`
- Test by submitting an entry!

## 🔧 **If Still Issues**

Check:

1. **Database URL**: `https://ogwqprcxmivlolpmhicm.supabase.co` (should be correct)
2. **API Key**: Make sure it's the `anon/public` key, not service key
3. **RLS Policies**: The policy above allows all operations for the event

**Your database will be ready for hundreds of teams!**
