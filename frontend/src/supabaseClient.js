// frontend/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase project URL and Anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);