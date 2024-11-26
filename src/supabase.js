import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kgrphbvyfncuieeptpsx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncnBoYnZ5Zm5jdWllZXB0cHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIyMDM4ODYsImV4cCI6MjA0Nzc3OTg4Nn0.UgcgO95ZoTspVL94uTlI77BhzBWIletDQijZwmmHGB8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
