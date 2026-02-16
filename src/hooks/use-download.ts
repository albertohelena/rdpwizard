'use client';

import { useCallback } from 'react';

/**
 * Hook for downloading content as a file.
 */
export function useDownload() {
    const downloadFile = useCallback(
        (content: string, filename: string, mimeType = 'text/markdown') => {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },
        []
    );

    const downloadMarkdown = useCallback(
        (content: string, filename: string) => {
            downloadFile(content, filename.endsWith('.md') ? filename : `${filename}.md`);
        },
        [downloadFile]
    );

    const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        }
    }, []);

    return { downloadFile, downloadMarkdown, copyToClipboard };
}
