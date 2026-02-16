-- ============================================================
-- Migration: 00003_create_project_versions.sql
-- Immutable version history for all project artifacts
-- ============================================================

CREATE TYPE version_type AS ENUM (
    'original_idea',
    'improved_idea',
    'generated_prd',
    'edited_prd',
    'final_markdown',
    'final_prompt'
);

CREATE TABLE public.project_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    version_type    version_type NOT NULL,
    version_number  INTEGER NOT NULL DEFAULT 1,
    content         TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure unique version numbers per project+type
    UNIQUE(project_id, version_type, version_number)
);

COMMENT ON TABLE public.project_versions IS 'Immutable version history — no UPDATE/DELETE by users';
COMMENT ON COLUMN public.project_versions.metadata IS 'Stores: model used, token counts, generation parameters';

-- Indexes
CREATE INDEX idx_versions_project_id ON public.project_versions(project_id);
CREATE INDEX idx_versions_type ON public.project_versions(version_type);
CREATE INDEX idx_versions_created ON public.project_versions(created_at DESC);

-- Auto-increment version_number per (project_id, version_type)
CREATE OR REPLACE FUNCTION public.auto_version_number()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO NEW.version_number
    FROM public.project_versions
    WHERE project_id = NEW.project_id
      AND version_type = NEW.version_type;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_version_number
    BEFORE INSERT ON public.project_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_version_number();
