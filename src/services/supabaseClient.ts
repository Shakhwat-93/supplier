import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://supabasekong-a5tg2fvpwj6emkewfdknamid.187.77.159.209.sslip.io';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4ODc3MzEwMCwiZXhwIjo0OTQ0NDQ2NzAwLCJyb2xlIjoiYW5vbiJ9.xKr5ARhjhbCSpBSFNjU9LuAl7Do_CMfN0So9h43swaQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
