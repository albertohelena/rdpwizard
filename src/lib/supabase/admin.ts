import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getRequiredEnv } from '@/lib/env';

/**
 * Creates a Supabase client with the service role key.
 * IMPORTANT: This bypasses RLS — use ONLY in server-side API routes.
 * NEVER expose this client or key to the browser.
 */
export function createAdminClient() {
    const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

    return createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
