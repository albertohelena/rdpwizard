-- ============================================================
-- Migration: 00005_create_api_keys.sql
-- Encrypted BYOK storage (AES-256-GCM)
-- ============================================================

CREATE TABLE public.api_keys (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    encrypted_key       TEXT NOT NULL,
    key_hint            TEXT,                   -- Display hint: "...xK9m"
    iv                  TEXT NOT NULL,           -- Initialization vector (base64)
    auth_tag            TEXT NOT NULL,           -- GCM authentication tag (base64)
    is_valid            BOOLEAN DEFAULT TRUE,
    last_used_at        TIMESTAMPTZ,
    last_validated_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.api_keys IS 'One encrypted Gemini API key per user. Decrypted server-side only.';
COMMENT ON COLUMN public.api_keys.encrypted_key IS 'AES-256-GCM encrypted key — never sent to client';
COMMENT ON COLUMN public.api_keys.iv IS 'Random 16-byte init vector, base64 encoded';
COMMENT ON COLUMN public.api_keys.auth_tag IS 'GCM auth tag for integrity verification, base64 encoded';

-- Auto-update timestamp
CREATE TRIGGER api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Sync has_api_key flag on profiles
CREATE OR REPLACE FUNCTION public.sync_has_api_key()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.profiles SET has_api_key = TRUE WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.profiles SET has_api_key = FALSE WHERE id = OLD.user_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER api_keys_sync_trigger
    AFTER INSERT OR DELETE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_has_api_key();
