import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getOptionalEnv } from '@/lib/env';

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
