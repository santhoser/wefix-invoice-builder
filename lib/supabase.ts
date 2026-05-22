import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// New key format (sb_publishable_...) — replaces legacy anon key
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
// New key format (sb_secret_...) — replaces legacy service_role key, server-side only
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

// Public client (for client-side use only - limited permissions)
export const supabaseClient = createClient(supabaseUrl, supabasePublishableKey);

// Server-side admin client with elevated permissions
export function createSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
