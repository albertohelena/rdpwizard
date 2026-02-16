import type { StreamChunk } from '@/types/wizard';

/**
 * Parses an SSE (Server-Sent Events) stream into an async iterable of chunks.
 */
export async function* parseSSEStream(
    response: Response
): AsyncGenerator<StreamChunk> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ')) continue;

                const jsonStr = trimmed.slice(6); // Remove "data: " prefix
                try {
                    const chunk: StreamChunk = JSON.parse(jsonStr);
                    yield chunk;
                } catch {
                    // Skip malformed JSON chunks
                    console.warn('Failed to parse SSE chunk:', jsonStr);
                }
            }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith('data: ')) {
                try {
                    const chunk: StreamChunk = JSON.parse(trimmed.slice(6));
                    yield chunk;
                } catch {
                    // Skip
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}
