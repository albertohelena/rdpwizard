import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptApiKey, getKeyHint } from '@/lib/crypto';
import { validateGeminiKey } from '@/lib/gemini/client';
import { apiKeySchema } from '@/lib/validators';
import { rateLimit } from '@/lib/rate-limiter';
import { RATE_LIMITS } from '@/constants/config';

/* eslint-disable @typescript-eslint/no-explicit-any */

// POST /api/api-keys — Store an encrypted OpenAI API key
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limit
        const { maxRequests, windowSeconds } = RATE_LIMITS['api-keys'];
        const rateLimitResult = await rateLimit(user.id, 'api-keys', maxRequests, windowSeconds);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
                { status: 429 }
            );
        }

        // Validate input
        const body = await req.json();
        const parsed = apiKeySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { apiKey } = parsed.data;

        // Validate the key works with OpenAI
        const validateResult = await validateGeminiKey(apiKey);
        if (!validateResult.valid) {
            return NextResponse.json(
                { error: validateResult.error || 'Invalid API key. Please verify your OpenAI API key is correct and active.' },
                { status: 400 }
            );
        }

        // Encrypt the key
        const { encrypted, iv, authTag } = encryptApiKey(apiKey);
        const hint = getKeyHint(apiKey);

        // Use admin client to upsert (handles existing key replacement)
        const admin = createAdminClient() as any;

        // Ensure a `profiles` row exists for this user. In some setups the
        // auth.users -> profiles trigger may not have run (imported users,
        // migrations applied after users were created, etc.). If the profile
        // is missing the foreign-key on `api_keys.user_id` will fail — so
        // upsert the profile here to be safe.
        await admin.from('profiles').upsert([
            {
                id: user.id,
                email: user.email ?? '',
                full_name:
                    (user.user_metadata as any)?.full_name ||
                    (user.user_metadata as any)?.name ||
                    (user.email ? user.email.split('@')[0] : null),
            },
        ], { onConflict: 'id', returning: 'minimal' });

        // Delete existing key if any
        await admin.from('api_keys').delete().eq('user_id', user.id);

        // Insert new key
        const { error: insertError } = await admin.from('api_keys').insert({
            user_id: user.id,
            encrypted_key: encrypted,
            iv,
            auth_tag: authTag,
            key_hint: hint,
            is_valid: true,
            last_validated_at: new Date().toISOString(),
        });

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            data: { hint, isValid: true },
        }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/api-keys]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/api-keys — Check if user has a stored key
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await (supabase as any)
            .from('api_keys')
            .select('key_hint, is_valid, last_used_at, last_validated_at, created_at')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            data: data || null,
            hasKey: !!data,
        });
    } catch (error) {
        console.error('[GET /api/api-keys]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/api-keys — Remove stored key
export async function DELETE() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await (supabase as any)
            .from('api_keys')
            .delete()
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/api-keys]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
