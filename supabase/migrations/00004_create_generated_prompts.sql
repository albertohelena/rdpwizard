-- ============================================================
-- Migration: 00004_create_generated_prompts.sql
-- Stored generated prompts (final outputs from Step 4)
-- ============================================================

CREATE TYPE prompt_type AS ENUM (
    'build_markdown',
    'antigravity_prompt'
);

CREATE TABLE public.generated_prompts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prompt_type     prompt_type NOT NULL,
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    token_count     INTEGER,
    model_used      TEXT DEFAULT 'gemini-2.0-flash',
    is_favorite     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.generated_prompts IS 'Final generated outputs saved to user profile';

-- Indexes
CREATE INDEX idx_prompts_project_id ON public.generated_prompts(project_id);
CREATE INDEX idx_prompts_user_id ON public.generated_prompts(user_id);
CREATE INDEX idx_prompts_created_at ON public.generated_prompts(created_at DESC);
CREATE INDEX idx_prompts_favorite ON public.generated_prompts(user_id, is_favorite) WHERE is_favorite = TRUE;
