import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as { supabaseAdmin: SupabaseClient };

export function getSupabaseAdmin(): SupabaseClient {
  if (globalForSupabase.supabaseAdmin) return globalForSupabase.supabaseAdmin;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  if (process.env.NODE_ENV !== 'production') globalForSupabase.supabaseAdmin = client;
  return client;
}

// Lazy alias — only resolves at call time, not import time
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
