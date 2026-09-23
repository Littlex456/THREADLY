const SUPABASE_URL = "https://claupyzoupmtiembwfua.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_A1DqPIrYuVm9JOP9AwVtJA_EzQZFd6V";

if (!window.supabase) {
    console.error("Supabase library failed to load.");
} else {
    window.threadlySupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );
}

