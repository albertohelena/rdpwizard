import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { getOptionalEnv } from '@/lib/env';

export async function createClient() {
    const cookieStore = await cookies();

    const supabaseUrl = getOptionalEnv('NEXT_PUBLIC_SUPABASE_URL');
    const anonKey = getOptionalEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    // If Supabase env vars are missing, return a stub client so pages can render
    // without crashing. This disables Supabase-dependent features gracefully.
    if (!supabaseUrl || !anonKey) {
        console.warn('Supabase not configured: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing. Returning stub client.');
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
            },
            from: (_: string) => ({
                select: async () => ({ data: [], error: null }),
                insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
                update: async () => ({ data: null, error: new Error('Supabase not configured') }),
                delete: async () => ({ data: null, error: new Error('Supabase not configured') }),
                single: async () => ({ data: null, error: new Error('Supabase not configured') }),
            }),
        } as any;
    }

    return createServerClient<Database>(
        supabaseUrl,
        anonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing sessions.
                    }
                },
            },
        }
    );
}
