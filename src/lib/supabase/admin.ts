import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getOptionalEnv } from '@/lib/env';

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

function createStubAdminClient() {
    const errorResult = async () => ({ data: null, error: new Error('Supabase admin client not configured') });

    const chainable = {
        select: (_: string) => ({
            eq: (_: string, __: any) => ({ single: errorResult }),
            single: errorResult,
        }),
        update: (_: any) => ({
            eq: (_: string, __: any) => ({ data: null, error: new Error('Supabase admin client not configured') }),
        }),
        insert: (_: any) => ({ data: null, error: new Error('Supabase admin client not configured') }),
    } as any;

    return { from: (_: string) => chainable } as any;
}

export function createAdminClient() {
    const supabaseUrl = getOptionalEnv('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRoleKey = getOptionalEnv('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
        console.warn('Supabase admin not configured: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing. Returning stub admin client.');
        return createStubAdminClient();
    }

    return createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
