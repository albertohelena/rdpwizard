-- ============================================================
-- Migration: 00002_create_projects.sql
-- Projects table with wizard state tracking
-- ============================================================

CREATE TYPE project_status AS ENUM (
    'draft',
    'idea_complete',
    'prd_generated',
    'prd_edited',
    'prompt_generated',
    'completed'
);

CREATE TABLE public.projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    status          project_status DEFAULT 'draft' NOT NULL,
    current_step    INTEGER DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),

    -- Step 1: Idea
    original_idea   TEXT,
    improved_idea   TEXT,

    -- Step 2: PRD Generation
    generated_prd   TEXT,

    -- Step 3: Edited PRD + Design
    edited_prd      TEXT,
    color_palette   JSONB,
    ui_guidelines   TEXT,
    app_structure   TEXT,

    -- Step 4: Final outputs
    final_markdown  TEXT,
    final_prompt    TEXT,

    -- Metadata
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.projects IS 'User projects with complete wizard state';
COMMENT ON COLUMN public.projects.color_palette IS 'JSON: {primary, secondary, accent, background, text} hex colors';
COMMENT ON COLUMN public.projects.metadata IS 'Extensible metadata: tokens used, generation params, etc.';

-- Indexes
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at DESC);

-- Auto-update timestamp
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Keep profile projects_count in sync
CREATE OR REPLACE FUNCTION public.update_projects_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles SET projects_count = projects_count + 1 WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles SET projects_count = projects_count - 1 WHERE id = OLD.user_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER projects_count_trigger
    AFTER INSERT OR DELETE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_projects_count();
