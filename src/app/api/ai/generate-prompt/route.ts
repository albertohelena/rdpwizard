import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptApiKey } from '@/lib/crypto';
import { callGemini } from '@/lib/gemini/client';
import { generatePromptSchema } from '@/lib/validators';
import { rateLimit } from '@/lib/rate-limiter';
import { GENERATE_ANTIGRAVITY_PROMPT } from '@/constants/prompts';
import { RATE_LIMITS, GEMINI_MODEL } from '@/constants/config';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ApiKeyRow {
    encrypted_key: string;
    iv: string;
    auth_tag: string;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Rate limit
        const { maxRequests, windowSeconds } = RATE_LIMITS['generate-prompt'];
        const rateLimitResult = await rateLimit(user.id, 'generate-prompt', maxRequests, windowSeconds);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.', retryAfter: rateLimitResult.retryAfter },
                { status: 429 }
            );
        }

        // 3. Validate input
        const body = await req.json();
        const parsed = generatePromptSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // 4. Decrypt API key
        const admin = createAdminClient() as any;
        const { data: keyDataRaw, error: keyError } = await admin
            .from('api_keys')
            .select('encrypted_key, iv, auth_tag')
            .eq('user_id', user.id)
            .single();
        const keyData = keyDataRaw as ApiKeyRow | null;

        if (keyError || !keyData) {
            return NextResponse.json(
                { error: 'No API key configured. Please add your OpenAI API key in Settings.' },
                { status: 400 }
            );
        }

        const apiKey = decryptApiKey(keyData.encrypted_key, keyData.iv, keyData.auth_tag);

        // 5. Update last_used_at
        await admin
            .from('api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('user_id', user.id);

        // 6. Call LLM (OpenAI) (streaming)
        const stream = await callGemini({
            apiKey,
            model: GEMINI_MODEL,
            systemPrompt: GENERATE_ANTIGRAVITY_PROMPT,
            userMessage: `Transform the following PRD for project "${parsed.data.projectTitle}" into a build-ready markdown and an Antigravity prompt:\n\n${parsed.data.prd}`,
            stream: true,
            temperature: 0.5,
            maxTokens: 8192,
        });

        // 7. Return SSE stream
        return new Response(stream as ReadableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (error) {
        console.error('[POST /api/ai/generate-prompt]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
