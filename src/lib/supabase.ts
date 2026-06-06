import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Debugging: Log configuration status (without leaking keys)
if (typeof window !== 'undefined') {
  if (!supabaseUrl || supabaseUrl.includes('your-project') || supabaseUrl.includes('placeholder')) {
    console.warn('⚠️ Supabase URL is missing or using placeholder. Check your .env.local file.');
  }
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
