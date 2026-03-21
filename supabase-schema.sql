-- FindMyID Database Schema Setup with Authentication
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- 1. DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth DATE,  -- Nullable for Student IDs which don't have DOB
  id_number TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('National ID', 'Passport', 'Driver''s License', 'Student ID', 'Other')),
  image_url TEXT NOT NULL,
  location_found TEXT NOT NULL,
  finder_phone TEXT NOT NULL,
  reward_amount NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- 2. CLAIMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  verification_passed BOOLEAN DEFAULT FALSE,
  claim_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- 2B. STUDENT DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  registration_number TEXT,          -- e.g., 15/U/12345/PS
  student_id_number TEXT,            -- 9-10 digit student ID
  faculty TEXT,                      -- Faculty/School
  program TEXT,                      -- Program/Course
  hall TEXT,                         -- Hall of residence
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for student_documents
CREATE INDEX IF NOT EXISTS idx_student_documents_document_id ON student_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_reg_no ON student_documents(registration_number);

-- ============================================
-- 3. USER PROFILES TABLE (for roles)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- 4. INDEXES FOR FASTER SEARCHES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_documents_full_name ON documents(full_name);
CREATE INDEX IF NOT EXISTS idx_documents_id_number ON documents(id_number);
CREATE INDEX IF NOT EXISTS idx_documents_date_of_birth ON documents(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- 5. STORAGE BUCKET FOR DOCUMENT IMAGES
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('document_images', 'document_images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. POLICIES FOR DOCUMENTS TABLE
-- ============================================
CREATE POLICY "Allow public read on documents"
ON documents FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on documents"
ON documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on documents"
ON documents FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on documents"
ON documents FOR DELETE
USING (true);

-- ============================================
-- 8. POLICIES FOR CLAIMS TABLE
-- ============================================
CREATE POLICY "Allow public read on claims"
ON claims FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on claims"
ON claims FOR INSERT
WITH CHECK (true);

-- ============================================
-- 8B. POLICIES FOR STUDENT_DOCUMENTS TABLE
-- ============================================
CREATE POLICY "Allow public read on student_documents"
ON student_documents FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on student_documents"
ON student_documents FOR INSERT
WITH CHECK (true);

-- ============================================
-- 9. POLICIES FOR PROFILES TABLE
-- ============================================
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Allow public insert on profiles"
ON profiles FOR INSERT
WITH CHECK (true);

-- ============================================
-- 10. STORAGE POLICIES
-- ============================================
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'document_images');

CREATE POLICY "Allow Uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'document_images');

-- ============================================
-- 11. TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 12. ADMIN REGISTRATION CODE VALIDATION
-- ============================================
-- Note: The admin code validation is handled in the application code
-- Admin code: FINDMYID-ADMIN-2024

-- ============================================
-- 13. INITIAL ADMIN USER SETUP (Optional)
-- ============================================
-- To create an admin user manually, first sign up through the app,
-- then run this SQL to update their role:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- ============================================
-- 14. FUNCTION TO CHECK IF USER IS ADMIN
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
-- After running this schema:
-- 1. Users can register with the admin code to become admins
-- 2. Regular users can still use the app without authentication
-- 3. Admin dashboard is protected and only accessible to admins
