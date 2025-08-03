# 🌐 Supabase Database Setup

## Quick Fix for Current Errors

The initialization errors are happening because the Supabase database table needs to be created manually. Here's how to fix it:

### 1. **Go to Supabase Dashboard**
Visit: https://supabase.com/dashboard/project/qkoyrnxoepblvzzxafjp

### 2. **Open SQL Editor**
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### 3. **Create the Table**
Copy and paste this SQL:

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL,
  level INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,
  completed_levels INTEGER[] NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_name, level)
);

CREATE INDEX IF NOT EXISTS idx_submissions_level ON submissions(level);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_name);
CREATE INDEX IF NOT EXISTS idx_submissions_timestamp ON submissions(timestamp);
```

### 4. **Run the SQL**
- Click "Run" button
- You should see "Success. No rows returned"

### 5. **Verify Table Creation**
- Go to "Table Editor" in the left sidebar
- You should see the "submissions" table

## ✅ After Setup

Once the table is created:
1. Refresh your application
2. The initialization errors will stop
3. Multi-device functionality will work perfectly
4. All submissions will be stored in the central database

## 🔧 Alternative: Use Existing Working Solution

If you prefer not to set up Supabase manually, I can quickly revert to the working Netlify Functions solution that was functional before.
