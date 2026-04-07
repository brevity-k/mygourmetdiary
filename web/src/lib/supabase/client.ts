import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (client) return client;
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use localStorage for session persistence (default for browsers)
        // This avoids all cookie synchronization issues with SSR
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // Auto-detect OAuth code/tokens in URL
      },
    },
  );
  return client;
}
