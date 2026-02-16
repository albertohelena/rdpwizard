export const APP_NAME = 'PRD Wizard';
export const APP_DESCRIPTION = 'AI-powered PRD Generator — from idea to implementation-ready prompts';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Default model name used by the LLM adapter. Set `OPENAI_MODEL` in env to override.
export const GEMINI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export const RATE_LIMITS = {
    'improve-idea': { maxRequests: 10, windowSeconds: 60 },
    'generate-prd': { maxRequests: 5, windowSeconds: 60 },
    'generate-prompt': { maxRequests: 5, windowSeconds: 60 },
    'projects-read': { maxRequests: 30, windowSeconds: 60 },
    'projects-write': { maxRequests: 10, windowSeconds: 60 },
    'api-keys': { maxRequests: 5, windowSeconds: 60 },
    'download': { maxRequests: 20, windowSeconds: 60 },
} as const;

export const PROJECT_STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    idea_complete: 'Idea Ready',
    prd_generated: 'PRD Generated',
    prd_edited: 'PRD Edited',
    prompt_generated: 'Prompts Ready',
    completed: 'Completed',
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
    draft: 'bg-zinc-500/20 text-zinc-400',
    idea_complete: 'bg-blue-500/20 text-blue-400',
    prd_generated: 'bg-purple-500/20 text-purple-400',
    prd_edited: 'bg-amber-500/20 text-amber-400',
    prompt_generated: 'bg-emerald-500/20 text-emerald-400',
    completed: 'bg-green-500/20 text-green-400',
};
