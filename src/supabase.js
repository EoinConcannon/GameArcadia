import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-project.supabase.co';//replace later
const SUPABASE_ANON_KEY = 'your-anon-key';              //replace later

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
