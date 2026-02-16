'use client';

import { useState, useCallback, useRef } from 'react';
import { parseSSEStream } from '@/lib/gemini/stream';
import type { StreamChunk } from '@/types/wizard';

interface UseStreamingOptions {
    onChunk?: (text: string) => void;
    onComplete?: (tokensUsed: StreamChunk['tokensUsed']) => void;
    onError?: (error: string) => void;
}

interface UseStreamingReturn {
    streamedText: string;
    isStreaming: boolean;
    error: string | null;
    startStream: (url: string, body: Record<string, unknown>) => Promise<string>;
    cancelStream: () => void;
    reset: () => void;
}

/**
 * Hook for consuming SSE streams from AI API routes.
 * Accumulates streamed text chunks and provides control callbacks.
 */
export function useStreaming(options: UseStreamingOptions = {}): UseStreamingReturn {
    const [streamedText, setStreamedText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const cancelStream = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setIsStreaming(false);
    }, []);

    const reset = useCallback(() => {
        cancelStream();
        setStreamedText('');
        setError(null);
    }, [cancelStream]);

    const startStream = useCallback(
        async (url: string, body: Record<string, unknown>): Promise<string> => {
            // Cancel any existing stream
            cancelStream();

            setStreamedText('');
            setError(null);
            setIsStreaming(true);

            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            let fullText = '';

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage =
                        errorData.error || `Request failed with status ${response.status}`;
                    setError(errorMessage);
                    options.onError?.(errorMessage);
                    setIsStreaming(false);
                    return '';
                }

                for await (const chunk of parseSSEStream(response)) {
                    if (abortController.signal.aborted) break;

                    if (chunk.error) {
                        setError(chunk.error);
                        options.onError?.(chunk.error);
                        break;
                    }

                    if (chunk.text) {
                        fullText += chunk.text;
                        setStreamedText(fullText);
                        options.onChunk?.(chunk.text);
                    }

                    if (chunk.done) {
                        options.onComplete?.(chunk.tokensUsed);
                    }
                }
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    // Stream was intentionally cancelled
                    return fullText;
                }
                const errorMessage =
                    err instanceof Error ? err.message : 'Stream failed';
                setError(errorMessage);
                options.onError?.(errorMessage);
            } finally {
                setIsStreaming(false);
                abortControllerRef.current = null;
            }

            return fullText;
        },
        [cancelStream, options]
    );

    return {
        streamedText,
        isStreaming,
        error,
        startStream,
        cancelStream,
        reset,
    };
}
