import type { StreamChunk } from '@/types/wizard';

const OPENAI_BASE = 'https://api.openai.com/v1';

interface GeminiCallOptions {
    apiKey?: string; // optional, falls back to OPENAI_API_KEY env
    model?: string;
    systemPrompt: string;
    userMessage: string;
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
}

interface GeminiResponse {
    content: string;
    tokensUsed: {
        prompt: number;
        completion: number;
        total: number;
    };
}

function getEnvOpenAIApiKey() {
    return process.env.OPENAI_API_KEY;
}

export async function callGemini(
    options: GeminiCallOptions
): Promise<ReadableStream | GeminiResponse> {
    const {
        apiKey,
        model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        systemPrompt,
        userMessage,
        stream = false,
        temperature = 0.7,
        maxTokens = 2048,
    } = options;

    const key = apiKey || getEnvOpenAIApiKey();
    if (!key) throw new Error('Missing OpenAI API key');

    if (stream) {
        const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: maxTokens,
                temperature,
                stream: true,
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `OpenAI stream error: ${res.status}`);
        }

        return new ReadableStream({
            async start(controller) {
                const reader = res.body?.getReader();
                if (!reader) {
                    controller.error(new Error('No response body'));
                    return;
                }
                const decoder = new TextDecoder();
                let buffer = '';
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });

                        const parts = buffer.split('\n\n');
                        buffer = parts.pop() || '';
                        for (const part of parts) {
                            const line = part.trim();
                            if (!line.startsWith('data:')) continue;
                            const payload = line.replace(/^data:\s*/, '');
                            if (payload === '[DONE]') {
                                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                                continue;
                            }
                            try {
                                const json = JSON.parse(payload);
                                const choices = json.choices ?? [];
                                for (const ch of choices) {
                                    const delta = ch.delta?.content ?? ch.delta?.message?.content ?? '';
                                    if (delta) {
                                        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
                                    }
                                }
                            } catch {
                                // ignore parse errors
                            }
                        }
                    }

                    controller.close();
                } catch (err) {
                    controller.error(err as Error);
                } finally {
                    reader.releaseLock();
                }
            },
        });
    }

    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            max_tokens: maxTokens,
            temperature,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `OpenAI error: ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    const usage = data.usage ?? {};

    return {
        content,
        tokensUsed: {
            prompt: usage.prompt_tokens ?? 0,
            completion: usage.completion_tokens ?? 0,
            total: usage.total_tokens ?? 0,
        },
    };
}

export async function validateGeminiKey(apiKey?: string): Promise<{ valid: boolean; error?: string }> {
    const key = apiKey || getEnvOpenAIApiKey();
    if (!key) return { valid: false, error: 'Missing OpenAI API key' };

    try {
        const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Say ok' }],
                max_tokens: 1,
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            if (res.status === 401) return { valid: false, error: 'Invalid API key or unauthorized.' };
            if (res.status === 429) return { valid: false, error: 'Quota exceeded: please check your OpenAI billing and quotas.' };
            return { valid: false, error: `Provider error: ${text}` };
        }

        await res.json();
        return { valid: true };
    } catch (error) {
        try {
            const err: any = error;
            console.error('[validateGeminiKey] provider error:', err?.message ?? err);
        } catch {
            // ignore
        }
        return { valid: false, error: 'Network or provider error validating key.' };
    }
}
