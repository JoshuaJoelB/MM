/* ================================================================
   SUPABASE CONFIGURATION & HELPER
   ================================================================ */

const SUPABASE_URL = 'https://vynipvyzfvzkrhbjdfty.supabase.co'; // <--- PUT YOUR URL HERE
const SUPABASE_ANON_KEY = 'sb_publishable_vrnWwRvsWDGnDTXNAETvFw_WDmMZOc6'; // <--- PUT YOUR ANON KEY HERE

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
