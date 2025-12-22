// /lib/supabaseClient.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --- Frontend Client ---
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Missing Supabase environment variables. Check your .env.local file.");
}

// Export client for frontend usage (uses anon/public key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Backend Admin Client ---
// Export client for secure backend usage (uses service role/secret key)
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            // Must disable global session for service role key usage
            autoRefreshToken: false,
            persistSession: false,
        }
    })
    : null;

// Log for development only
if (process.env.NODE_ENV === "development") {
  console.log("✅ Supabase URL:", supabaseUrl);
  console.log("✅ Anon Key Loaded:", !!supabaseAnonKey);
  console.log("✅ Service Role Key Loaded:", !!supabaseServiceRoleKey);
}