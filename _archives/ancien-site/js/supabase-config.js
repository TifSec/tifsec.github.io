const SUPABASE_URL =
    "https://aqbjykgppbyrzqxlzxuf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_QurNizkqNqwICBWfRgfPPA_VZ71c6WM";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);