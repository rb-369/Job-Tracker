-- 1. DROP EXISTING TABLES IF NEEDED (Careful: This deletes data)
-- DROP TABLE IF EXISTS jobs;
-- DROP TABLE IF EXISTS user_profiles;
-- DROP TYPE IF EXISTS job_status;

-- 2. CREATE THE ENUM TYPE
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('wishlist', 'applied', 'interviewing', 'offer', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CREATE THE JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  status job_status DEFAULT 'wishlist' NOT NULL,
  url TEXT,
  description TEXT,
  intel_kit JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. CREATE THE USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_text TEXT,
  resume_pdf_url TEXT
);

-- 5. CREATE THE CHAT HISTORY TABLE
CREATE TABLE IF NOT EXISTS job_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE UNIQUE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. ADD USER_ID TO TABLES FOR AUTHENTICATION
-- We need to associate data with the logged-in user.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE job_chats ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 7. ENABLE ROW LEVEL SECURITY (PRODUCTION READY)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_chats ENABLE ROW LEVEL SECURITY;

-- 8. CREATE POLICIES (Users can only see and edit their own data)
-- Policies for 'jobs'
CREATE POLICY "Users can view their own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own jobs" ON jobs FOR DELETE USING (auth.uid() = user_id);

-- Policies for 'user_profiles'
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Policies for 'job_chats'
CREATE POLICY "Users can view their own chats" ON job_chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chats" ON job_chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chats" ON job_chats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chats" ON job_chats FOR DELETE USING (auth.uid() = user_id);-- Only use this if you want to keep RLS enabled.
/*
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON jobs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
*/
