import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SERVER ONLY. Holds the service role key — never import into a client component.
// The client is created lazily on first use so that simply importing a route
// module (which Next.js does during `next build` page-data collection) never
// throws when env vars are absent. It only errors if actually called at runtime
// without configuration, which is the correct time to fail.

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
