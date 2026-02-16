-- ============================================================
-- Migration: 00006_create_rls_policies.sql
-- Row Level Security for complete user isolation
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- ========================
-- PROFILES
-- ========================

CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- INSERT handled by trigger (SECURITY DEFINER)
-- DELETE cascades from auth.users

-- ========================
-- PROJECTS
-- ========================

CREATE POLICY "projects_select_own"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete_own"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- ========================
-- PROJECT VERSIONS
-- ========================

CREATE POLICY "versions_select_own"
    ON public.project_versions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "versions_insert_own"
    ON public.project_versions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE: versions are immutable
-- Cascade delete from project handles cleanup

-- ========================
-- GENERATED PROMPTS
-- ========================

CREATE POLICY "prompts_select_own"
    ON public.generated_prompts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "prompts_insert_own"
    ON public.generated_prompts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prompts_update_own"
    ON public.generated_prompts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "prompts_delete_own"
    ON public.generated_prompts FOR DELETE
    USING (auth.uid() = user_id);

-- ========================
-- API KEYS
-- ========================

CREATE POLICY "api_keys_select_own"
    ON public.api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "api_keys_insert_own"
    ON public.api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_update_own"
    ON public.api_keys FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "api_keys_delete_own"
    ON public.api_keys FOR DELETE
    USING (auth.uid() = user_id);
