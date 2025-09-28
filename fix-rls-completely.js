import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wgcmusjsuziqjkzuaqkd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRLS() {
  console.log('🔧 Fixing RLS policies...')
  
  // First, let's check what profiles exist without RLS
  console.log('Checking profiles with RLS disabled...')
  
  // We need to run SQL directly to fix this
  console.log('\n📋 Run this SQL in your Supabase Dashboard SQL Editor:')
  console.log(`
-- Step 1: Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view patient profiles" ON public.profiles;

-- Step 3: Check what profiles exist
SELECT email, full_name, role, created_at FROM public.profiles ORDER BY created_at;

-- Step 4: Re-enable RLS with simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Step 6: Allow doctors to view all profiles (for patient dropdown)
CREATE POLICY "Doctors can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'doctor'
  )
);
  `)
}

fixRLS()
