# PRD Generator Wizard — Production Architecture

> **Version:** 1.0.0  
> **Last Updated:** 2026-02-16  
> **Stack:** Next.js 15 (App Router) · TypeScript · TailwindCSS v4 · Supabase · Google Gemini · Vercel

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE NETWORK                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Next.js 15 App Router (RSC + Client)          │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │
│  │  │ Middleware│  │  App Layout  │  │  Server Components  │  │  │
│  │  │(auth gate)│  │  (providers) │  │  (data fetching)    │  │  │
│  │  └──────────┘  └──────────────┘  └─────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │           API Routes (/api/*)                        │  │  │
│  │  │  ┌────────────┐ ┌────────────┐ ┌──────────────────┐  │  │  │
│  │  │  │ /ai/improve│ │/ai/gen-prd │ │/ai/gen-prompt    │  │  │  │
│  │  │  └─────┬──────┘ └─────┬──────┘ └────────┬─────────┘  │  │  │
│  │  │        │              │                  │            │  │  │
│  │  │        └──────────────┼──────────────────┘            │  │  │
│  │  │                       ▼                               │  │  │
│  │  │            ┌─────────────────────┐                    │  │  │
│  │  │            │  Gemini Service     │                    │  │  │
│  │  │            │  (decrypt key →     │                    │  │  │
│  │  │            │   call API →        │                    │  │  │
│  │  │            │   stream response)  │                    │  │  │
│  │  │            └─────────┬───────────┘                    │  │  │
│  │  └──────────────────────┼────────────────────────────────┘  │  │
│  └─────────────────────────┼──────────────────────────────────┘  │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │    Google Gemini API    │
                │   (gemini-2.0-flash)   │
                └─────────────────────────┘

                ┌─────────────────────────┐
                │       SUPABASE          │
                │  ┌───────────────────┐  │
                │  │   Auth (GoTrue)   │  │
                │  │   email/password  │  │
                │  └───────────────────┘  │
                │  ┌───────────────────┐  │
                │  │   PostgreSQL DB   │  │
                │  │   + RLS Policies  │  │
                │  └───────────────────┘  │
                │  ┌───────────────────┐  │
                │  │   Vault (secrets) │  │
                │  │   API key encrypt │  │
                │  └───────────────────┘  │
                └─────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Server-side Gemini calls only** | User API keys never reach the browser |
| **Supabase Vault for key encryption** | Native pgcrypto + Vault; no custom encryption service needed |
| **Streaming responses** | SSE for AI generation to provide real-time UX feedback |
| **Server Components by default** | Data fetching at the edge, minimal client JS bundle |
| **Zustand for wizard state** | Lightweight, no boilerplate, persist middleware for draft recovery |
| **Optimistic updates** | Dashboard CRUD operations feel instant |

---

## 2. Folder Structure (Next.js App Router)

```
byok/
├── .env.local                          # Local secrets (never committed)
├── .env.example                        # Template for env vars
├── next.config.ts                      # Next.js configuration
├── tailwind.config.ts                  # TailwindCSS v4 config
├── tsconfig.json
├── package.json
├── middleware.ts                        # Auth guard + rate limiting
│
├── supabase/
│   ├── migrations/
│   │   ├── 00001_create_profiles.sql
│   │   ├── 00002_create_projects.sql
│   │   ├── 00003_create_project_versions.sql
│   │   ├── 00004_create_generated_prompts.sql
│   │   ├── 00005_create_api_keys.sql
│   │   └── 00006_create_rls_policies.sql
│   ├── seed.sql
│   └── config.toml
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png
│   └── fonts/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (providers, fonts)
│   │   ├── page.tsx                    # Landing / marketing page
│   │   ├── globals.css                 # TailwindCSS base + custom tokens
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx              # Auth pages layout (centered card)
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Dashboard shell (sidebar + topbar)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx            # Projects list
│   │   │   ├── projects/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx        # Create project → enters wizard
│   │   │   │   └── [projectId]/
│   │   │   │       ├── page.tsx        # Project detail / resume wizard
│   │   │   │       ├── wizard/
│   │   │   │       │   └── page.tsx    # Wizard container (steps 1-4)
│   │   │   │       └── prompts/
│   │   │   │           └── page.tsx    # Prompt history for project
│   │   │   ├── settings/
│   │   │   │   └── page.tsx            # API key management, profile
│   │   │   └── history/
│   │   │       └── page.tsx            # Global prompt history
│   │   │
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── improve-idea/
│   │   │   │   │   └── route.ts        # POST: enhance idea with Gemini
│   │   │   │   ├── generate-prd/
│   │   │   │   │   └── route.ts        # POST: generate MVP PRD
│   │   │   │   └── generate-prompt/
│   │   │   │       └── route.ts        # POST: generate Antigravity prompt
│   │   │   ├── projects/
│   │   │   │   └── route.ts            # CRUD operations
│   │   │   ├── api-keys/
│   │   │   │   └── route.ts            # Store/retrieve encrypted keys
│   │   │   └── download/
│   │   │       └── route.ts            # Generate .md downloads
│   │   │
│   │   └── auth/
│   │       ├── callback/
│   │       │   └── route.ts            # Supabase auth callback
│   │       └── confirm/
│   │           └── route.ts            # Email confirmation
│   │
│   ├── components/
│   │   ├── ui/                         # Primitive UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── user-menu.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── project-card.tsx
│   │   │   ├── project-list.tsx
│   │   │   ├── create-project-dialog.tsx
│   │   │   ├── empty-state.tsx
│   │   │   └── stats-overview.tsx
│   │   │
│   │   ├── wizard/
│   │   │   ├── wizard-shell.tsx        # Step container + progress bar
│   │   │   ├── step-indicator.tsx       # Visual step tracker
│   │   │   ├── step-1-idea.tsx
│   │   │   ├── step-2-prd.tsx
│   │   │   ├── step-3-editor.tsx
│   │   │   ├── step-4-prompt.tsx
│   │   │   ├── markdown-preview.tsx
│   │   │   ├── color-palette.tsx
│   │   │   ├── version-history.tsx
│   │   │   └── download-actions.tsx
│   │   │
│   │   ├── settings/
│   │   │   ├── api-key-form.tsx
│   │   │   ├── profile-form.tsx
│   │   │   └── danger-zone.tsx
│   │   │
│   │   └── shared/
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── confirm-dialog.tsx
│   │       └── markdown-renderer.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server Supabase client (cookies)
│   │   │   ├── admin.ts                # Service-role client (API routes)
│   │   │   ├── middleware.ts            # Supabase middleware helper
│   │   │   └── types.ts                # Generated DB types
│   │   │
│   │   ├── gemini/
│   │   │   ├── client.ts               # Gemini API wrapper
│   │   │   ├── prompts.ts              # System prompts for each step
│   │   │   └── stream.ts               # SSE streaming utilities
│   │   │
│   │   ├── crypto.ts                   # AES-256-GCM encrypt/decrypt helpers
│   │   ├── rate-limiter.ts             # Token bucket rate limiter
│   │   ├── validators.ts               # Zod schemas for API validation
│   │   └── utils.ts                    # Shared utilities (cn, formatDate, etc.)
│   │
│   ├── hooks/
│   │   ├── use-wizard-store.ts         # Zustand wizard state
│   │   ├── use-projects.ts             # SWR/React Query for projects
│   │   ├── use-streaming.ts            # SSE consumption hook
│   │   ├── use-debounce.ts
│   │   └── use-download.ts             # File download utility hook
│   │
│   ├── types/
│   │   ├── database.ts                 # Supabase generated types
│   │   ├── wizard.ts                   # Wizard step types
│   │   ├── api.ts                      # API request/response types
│   │   └── gemini.ts                   # Gemini-specific types
│   │
│   └── constants/
│       ├── prompts.ts                  # AI system prompts
│       ├── wizard-steps.ts             # Step metadata
│       └── config.ts                   # App-wide constants
│
└── tests/
    ├── unit/
    │   ├── crypto.test.ts
    │   └── validators.test.ts
    ├── integration/
    │   ├── api-routes.test.ts
    │   └── wizard-flow.test.ts
    └── e2e/
        ├── auth.spec.ts
        ├── wizard.spec.ts
        └── dashboard.spec.ts
```

---

## 3. Database Schema (SQL)

```sql
-- ============================================================
-- Migration: 00001_create_profiles.sql
-- Profiles table (extends Supabase auth.users)
-- ============================================================

CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    full_name       TEXT,
    avatar_url      TEXT,
    has_api_key     BOOLEAN DEFAULT FALSE,
    projects_count  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Migration: 00002_create_projects.sql
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
    original_idea   TEXT,                   -- Raw idea from Step 1
    improved_idea   TEXT,                   -- AI-improved version
    generated_prd   TEXT,                   -- Markdown PRD from Step 2
    edited_prd      TEXT,                   -- User-edited PRD from Step 3
    color_palette   JSONB,                  -- Suggested colors from Step 3
    ui_guidelines   TEXT,                   -- UI style guidelines
    app_structure   TEXT,                   -- App structure overview
    final_markdown  TEXT,                   -- Build-ready markdown from Step 4
    final_prompt    TEXT,                   -- Antigravity prompt from Step 4
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Update profile projects_count
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

-- ============================================================
-- Migration: 00003_create_project_versions.sql
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
    metadata        JSONB DEFAULT '{}'::JSONB,  -- tokens used, model, etc.
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(project_id, version_type, version_number)
);

CREATE INDEX idx_versions_project_id ON public.project_versions(project_id);
CREATE INDEX idx_versions_type ON public.project_versions(version_type);

-- ============================================================
-- Migration: 00004_create_generated_prompts.sql
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

CREATE INDEX idx_prompts_project_id ON public.generated_prompts(project_id);
CREATE INDEX idx_prompts_user_id ON public.generated_prompts(user_id);
CREATE INDEX idx_prompts_created_at ON public.generated_prompts(created_at DESC);

-- ============================================================
-- Migration: 00005_create_api_keys.sql
-- ============================================================

CREATE TABLE public.api_keys (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    encrypted_key       TEXT NOT NULL,          -- AES-256-GCM encrypted
    key_hint            TEXT,                   -- Last 4 chars: "...xK9m"
    iv                  TEXT NOT NULL,          -- Initialization vector (base64)
    auth_tag            TEXT NOT NULL,          -- GCM auth tag (base64)
    is_valid            BOOLEAN DEFAULT TRUE,
    last_used_at        TIMESTAMPTZ,
    last_validated_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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
```

### Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    │ 1:1
    ▼
profiles ─────────────────────────────┐
    │                                 │
    │ 1:N                        1:1  │
    ▼                                 ▼
projects                          api_keys
    │
    ├── 1:N ──► project_versions
    │
    └── 1:N ──► generated_prompts
```

---

## 4. RLS Policies

```sql
-- ============================================================
-- Migration: 00006_create_rls_policies.sql
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

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- INSERT handled by trigger (SECURITY DEFINER)
-- DELETE cascades from auth.users

-- ========================
-- PROJECTS
-- ========================

CREATE POLICY "Users can view own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- ========================
-- PROJECT VERSIONS
-- ========================

CREATE POLICY "Users can view own project versions"
    ON public.project_versions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own project versions"
    ON public.project_versions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Versions are immutable: no UPDATE or DELETE policies
-- (cascade delete from project handles cleanup)

-- ========================
-- GENERATED PROMPTS
-- ========================

CREATE POLICY "Users can view own prompts"
    ON public.generated_prompts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompts"
    ON public.generated_prompts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
    ON public.generated_prompts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
    ON public.generated_prompts FOR DELETE
    USING (auth.uid() = user_id);

-- ========================
-- API KEYS
-- ========================

-- CRITICAL: Only the service role can read encrypted_key, iv, auth_tag
-- Users interact via API routes only

CREATE POLICY "Users can view own key metadata"
    ON public.api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own key"
    ON public.api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own key"
    ON public.api_keys FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own key"
    ON public.api_keys FOR DELETE
    USING (auth.uid() = user_id);

-- ========================
-- GRANT SERVICE ROLE ACCESS
-- ========================
-- The service role bypasses RLS and is used in server-side
-- API routes only to decrypt keys for Gemini calls.
```

---

## 5. API Route Design

| Method | Endpoint | Auth | Purpose | Rate Limit |
|--------|----------|------|---------|------------|
| `POST` | `/api/ai/improve-idea` | ✅ | Enhance user idea with Gemini | 10/min |
| `POST` | `/api/ai/generate-prd` | ✅ | Generate MVP PRD from idea | 5/min |
| `POST` | `/api/ai/generate-prompt` | ✅ | Generate Antigravity prompt | 5/min |
| `GET` | `/api/projects` | ✅ | List user projects | 30/min |
| `POST` | `/api/projects` | ✅ | Create new project | 10/min |
| `PATCH` | `/api/projects` | ✅ | Update project | 20/min |
| `DELETE` | `/api/projects` | ✅ | Delete project | 10/min |
| `POST` | `/api/api-keys` | ✅ | Store encrypted Gemini key | 5/min |
| `DELETE` | `/api/api-keys` | ✅ | Remove stored key | 5/min |
| `GET` | `/api/download` | ✅ | Download .md file | 20/min |
| `GET` | `/api/auth/callback` | — | Supabase OAuth callback | — |

### API Route Implementation Pattern

```typescript
// src/app/api/ai/improve-idea/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptApiKey } from '@/lib/crypto';
import { callGemini } from '@/lib/gemini/client';
import { improveIdeaSchema } from '@/lib/validators';
import { rateLimit } from '@/lib/rate-limiter';
import { IMPROVE_IDEA_PROMPT } from '@/constants/prompts';

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Rate limit
        const rateLimitResult = await rateLimit(user.id, 'improve-idea', 10, 60);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
                { status: 429 }
            );
        }

        // 3. Validate input
        const body = await req.json();
        const parsed = improveIdeaSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        // 4. Decrypt API key (service role — bypasses RLS)
        const admin = createAdminClient();
        const { data: keyData, error: keyError } = await admin
            .from('api_keys')
            .select('encrypted_key, iv, auth_tag')
            .eq('user_id', user.id)
            .single();

        if (keyError || !keyData) {
            return NextResponse.json(
                { error: 'No API key configured. Please add your Gemini API key in Settings.' },
                { status: 400 }
            );
        }

        const apiKey = decryptApiKey(
            keyData.encrypted_key,
            keyData.iv,
            keyData.auth_tag
        );

        // 5. Call Gemini (streaming)
        const stream = await callGemini({
            apiKey,
            model: 'gemini-2.0-flash',
            systemPrompt: IMPROVE_IDEA_PROMPT,
            userMessage: parsed.data.idea,
            stream: true,
        });

        // 6. Return SSE stream
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('[improve-idea]', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

---

## 6. Gemini Integration (TypeScript)

### 6.1 Encryption Utilities

```typescript
// src/lib/crypto.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

interface EncryptedData {
    encrypted: string;  // base64
    iv: string;         // base64
    authTag: string;    // base64
}

export function encryptApiKey(plaintext: string): EncryptedData {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    return {
        encrypted,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
    };
}

export function decryptApiKey(
    encryptedKey: string,
    iv: string,
    authTag: string
): string {
    const decipher = createDecipheriv(
        ALGORITHM,
        KEY,
        Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    
    let decrypted = decipher.update(encryptedKey, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

export function getKeyHint(apiKey: string): string {
    return `...${apiKey.slice(-4)}`;
}
```

### 6.2 Gemini Client

```typescript
// src/lib/gemini/client.ts

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

interface GeminiCallOptions {
    apiKey: string;
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

export async function callGemini(options: GeminiCallOptions): Promise<ReadableStream | GeminiResponse> {
    const {
        apiKey,
        model = 'gemini-2.0-flash',
        systemPrompt,
        userMessage,
        stream = false,
        temperature = 0.7,
        maxTokens = 4096,
    } = options;

    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel: GenerativeModel = genAI.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
        generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            topP: 0.95,
        },
    });

    if (stream) {
        const result = await genModel.generateContentStream(userMessage);
        
        return new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                            );
                        }
                    }
                    // Send final metadata
                    const response = await result.response;
                    const usage = response.usageMetadata;
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                            done: true,
                            tokensUsed: {
                                prompt: usage?.promptTokenCount ?? 0,
                                completion: usage?.candidatesTokenCount ?? 0,
                                total: usage?.totalTokenCount ?? 0,
                            }
                        })}\n\n`)
                    );
                    controller.close();
                } catch (error) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                            error: error instanceof Error ? error.message : 'Stream error'
                        })}\n\n`)
                    );
                    controller.close();
                }
            },
        });
    }

    // Non-streaming
    const result = await genModel.generateContent(userMessage);
    const response = result.response;
    const usage = response.usageMetadata;

    return {
        content: response.text(),
        tokensUsed: {
            prompt: usage?.promptTokenCount ?? 0,
            completion: usage?.candidatesTokenCount ?? 0,
            total: usage?.totalTokenCount ?? 0,
        },
    };
}
```

### 6.3 System Prompts

```typescript
// src/constants/prompts.ts

export const IMPROVE_IDEA_PROMPT = `You are a Senior Full Stack Engineer and Product Architect with 15+ years of experience.

Your task is to take a raw product idea and enhance it into a clear, well-structured system description. 

Rules:
- Keep the original intent and vision intact
- Add technical precision and clarity
- Structure the description with clear sections
- Identify the core problem being solved
- Suggest the most appropriate tech approach
- Keep it concise but comprehensive (300-500 words)
- Write in professional but accessible language
- Do NOT add implementation details yet — focus on the "what" and "why"

Output format: Plain text, well-structured paragraphs with clear headers.`;

export const GENERATE_PRD_PROMPT = `You are a Senior Product Manager creating an MVP PRD (Product Requirements Document).

Based on the system idea provided, generate a Simplified PRD in structured Markdown format.

Required sections (use exact headers):

# Product Overview
Brief description of the product, the problem it solves, and the value proposition.

# Target Users
Define 2-3 primary user personas with their key characteristics and needs.

# Core Features (MVP)
List ONLY the essential features needed for a Minimum Viable Product. 
For each feature include: name, description, acceptance criteria.
Maximum 5-7 features.

# Technical Considerations
Recommended tech stack, architecture notes, key integrations.
Include suggested color palette (5 colors with hex codes) and UI style direction.

# Non-Goals
Explicitly list what is OUT OF SCOPE for the MVP.

# Success Metrics
3-5 measurable KPIs to evaluate MVP success.

Rules:
- Be specific, not generic
- Focus on MVP — the smallest version that delivers value
- Include realistic technical recommendations
- Keep the document actionable and development-ready
- Total length: 800-1200 words`;

export const GENERATE_ANTIGRAVITY_PROMPT = `You are an expert prompt engineer specializing in AI-assisted development.

Transform the provided PRD into TWO outputs:

## OUTPUT 1: Build-Ready Markdown
A structured, implementation-ready document that a developer can follow step-by-step. Include:
- Project setup instructions
- File/folder structure
- Component breakdown
- Database schema (if applicable)
- API endpoints (if applicable)
- Step-by-step implementation order

## OUTPUT 2: Antigravity Prompt
A specialized prompt formatted for the Antigravity AI coding assistant. Structure:
- Role definition
- Project context
- Specific implementation instructions
- Code style preferences
- Testing requirements
- Deliverables checklist

Rules:
- Be extremely specific and actionable
- Include actual code patterns where helpful
- Reference modern best practices
- Make it copy-paste ready
- Separate the two outputs clearly with "---SPLIT---" marker

The prompt should enable a developer (or AI) to build the complete MVP in one session.`;
```

### 6.4 Rate Limiter

```typescript
// src/lib/rate-limiter.ts

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfter?: number;
}

export async function rateLimit(
    userId: string,
    action: string,
    maxRequests: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
        return { allowed: true, remaining: maxRequests - 1 };
    }

    if (entry.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        };
    }

    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count };
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        if (now > entry.resetAt) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);
```

---

## 7. Wizard UI Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    WIZARD SHELL                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ● Step 1    ○ Step 2    ○ Step 3    ○ Step 4         │  │
│  │  Idea Input  Gen PRD    Edit PRD    Prompts           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │              [ACTIVE STEP CONTENT]                     │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ← Previous                          Next / Generate → │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Step Transitions & Validation

```
Step 1 (Idea Input)
├── [Continue] → idea.length >= 50 chars → Go to Step 2
├── [Improve with AI] → Stream enhanced idea → Replace textarea
│   └── Save version: { type: 'original_idea', content: original }
│   └── Save version: { type: 'improved_idea', content: improved }
└── Auto-save draft every 30 seconds

Step 2 (Generate PRD)
├── Auto-trigger generation on entry (if no PRD exists)
├── [Regenerate] → New Gemini call → Replace PRD
│   └── Save version: { type: 'generated_prd', version: n+1 }
└── [Continue] → Go to Step 3

Step 3 (Edit PRD)
├── Split view: Markdown editor | Live preview
├── Color palette widget (editable)
├── [Save Changes] → Save to project + version history
│   └── Save version: { type: 'edited_prd', version: n+1 }
└── [Continue] → Go to Step 4

Step 4 (Prompt Generation)
├── Auto-generate on entry
├── Two output tabs: "Build Markdown" | "Antigravity Prompt"
├── [Download .md] → Download build-ready markdown
├── [Download Prompt] → Download Antigravity prompt as .txt
├── [Copy to Clipboard] → Copy active tab content
├── [Save to Profile] → Persist to generated_prompts table
└── [Back to Dashboard] → Redirect with success toast
```

---

## 8. State Management Strategy

### Zustand Wizard Store

```typescript
// src/hooks/use-wizard-store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WizardState {
    // Current state
    projectId: string | null;
    currentStep: number;
    
    // Step 1
    originalIdea: string;
    improvedIdea: string | null;
    isImprovingIdea: boolean;
    
    // Step 2
    generatedPrd: string | null;
    isGeneratingPrd: boolean;
    
    // Step 3
    editedPrd: string | null;
    colorPalette: ColorPalette | null;
    uiGuidelines: string | null;
    appStructure: string | null;
    
    // Step 4
    finalMarkdown: string | null;
    finalPrompt: string | null;
    isGeneratingPrompt: boolean;
    
    // Actions
    setProjectId: (id: string) => void;
    setStep: (step: number) => void;
    setOriginalIdea: (idea: string) => void;
    setImprovedIdea: (idea: string | null) => void;
    setGeneratedPrd: (prd: string | null) => void;
    setEditedPrd: (prd: string | null) => void;
    setColorPalette: (palette: ColorPalette | null) => void;
    setFinalMarkdown: (md: string | null) => void;
    setFinalPrompt: (prompt: string | null) => void;
    setLoading: (key: 'isImprovingIdea' | 'isGeneratingPrd' | 'isGeneratingPrompt', value: boolean) => void;
    reset: () => void;
    
    // Computed
    canProceedToStep: (step: number) => boolean;
}

interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
}

const initialState = {
    projectId: null,
    currentStep: 1,
    originalIdea: '',
    improvedIdea: null,
    isImprovingIdea: false,
    generatedPrd: null,
    isGeneratingPrd: false,
    editedPrd: null,
    colorPalette: null,
    uiGuidelines: null,
    appStructure: null,
    finalMarkdown: null,
    finalPrompt: null,
    isGeneratingPrompt: false,
};

export const useWizardStore = create<WizardState>()(
    persist(
        (set, get) => ({
            ...initialState,
            
            setProjectId: (id) => set({ projectId: id }),
            setStep: (step) => set({ currentStep: step }),
            setOriginalIdea: (idea) => set({ originalIdea: idea }),
            setImprovedIdea: (idea) => set({ improvedIdea: idea }),
            setGeneratedPrd: (prd) => set({ generatedPrd: prd }),
            setEditedPrd: (prd) => set({ editedPrd: prd }),
            setColorPalette: (palette) => set({ colorPalette: palette }),
            setFinalMarkdown: (md) => set({ finalMarkdown: md }),
            setFinalPrompt: (prompt) => set({ finalPrompt: prompt }),
            setLoading: (key, value) => set({ [key]: value }),
            reset: () => set(initialState),
            
            canProceedToStep: (step: number) => {
                const state = get();
                switch (step) {
                    case 2: return (state.improvedIdea || state.originalIdea).length >= 50;
                    case 3: return !!state.generatedPrd;
                    case 4: return !!(state.editedPrd || state.generatedPrd);
                    default: return true;
                }
            },
        }),
        {
            name: 'wizard-draft',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                projectId: state.projectId,
                currentStep: state.currentStep,
                originalIdea: state.originalIdea,
                improvedIdea: state.improvedIdea,
                editedPrd: state.editedPrd,
            }),
        }
    )
);
```

### Server Cache Strategy (React Query / SWR)

```typescript
// Data fetching pattern for dashboard

// src/hooks/use-projects.ts
import useSWR from 'swr';
import { createBrowserClient } from '@/lib/supabase/client';

export function useProjects() {
    return useSWR('projects', async () => {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }, {
        revalidateOnFocus: false,
        dedupingInterval: 5000,
    });
}
```

---

## 9. Security Considerations

### 9.1 Authentication & Authorization

| Layer | Implementation |
|-------|---------------|
| **Auth Gate** | `middleware.ts` checks Supabase session on every `/dashboard/*` route |
| **Session Management** | Supabase manages JWTs with automatic refresh via `@supabase/ssr` |
| **RLS** | All database queries enforce user-level isolation |
| **API Auth** | Every API route validates session before processing |

### 9.2 API Key Security

```
User Input (plaintext key)
    │
    ▼
API Route (/api/api-keys POST)
    │
    ├── Validate format (starts with "AI...")
    ├── Test key against Gemini API (list models)
    ├── Encrypt with AES-256-GCM
    │   ├── Key: ENCRYPTION_KEY env var (32 bytes, hex)
    │   ├── IV: Random 16 bytes per encryption
    │   └── Auth Tag: GCM integrity verification
    ├── Store: encrypted_key, iv, auth_tag → api_keys table
    ├── Store hint: "...xK9m" for UI display
    └── Key NEVER stored in plaintext, NEVER sent to client

Decryption flow (server-side only):
    API Route → Admin client (service role) → Read encrypted_key → Decrypt → Use → Discard
```

### 9.3 Environment Variables

```bash
# .env.local (NEVER committed)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Server-only, bypasses RLS

# Encryption
ENCRYPTION_KEY=64-char-hex-string          # openssl rand -hex 32

# App
NEXT_PUBLIC_APP_URL=https://prd-wizard.vercel.app
```

### 9.4 Security Checklist

- [x] API keys encrypted at rest (AES-256-GCM)
- [x] API keys decrypted only in server-side API routes
- [x] `SUPABASE_SERVICE_ROLE_KEY` never exposed to client
- [x] `ENCRYPTION_KEY` never exposed to client
- [x] All `NEXT_PUBLIC_*` vars are safe for browser exposure
- [x] RLS policies on every table ensure user isolation
- [x] Rate limiting on all AI endpoints
- [x] Input validation with Zod on all API routes
- [x] CSRF protection via SameSite cookies (Supabase default)
- [x] XSS prevention: Markdown rendered with sanitization (`rehype-sanitize`)
- [x] No `eval()` or `dangerouslySetInnerHTML` without sanitization

---

## 10. Deployment Checklist (Vercel)

### Pre-Deployment

```bash
# 1. Initialize Next.js project
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

# 2. Install dependencies
npm install @supabase/supabase-js @supabase/ssr @google/generative-ai zustand swr zod
npm install react-markdown remark-gfm rehype-sanitize rehype-highlight
npm install lucide-react clsx tailwind-merge
npm install -D supabase @types/node

# 3. Generate Supabase types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Vercel Configuration

```json
// vercel.json
{
    "framework": "nextjs",
    "regions": ["iad1"],
    "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
        "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
        "ENCRYPTION_KEY": "@encryption-key"
    },
    "headers": [
        {
            "source": "/api/(.*)",
            "headers": [
                { "key": "X-Content-Type-Options", "value": "nosniff" },
                { "key": "X-Frame-Options", "value": "DENY" },
                { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
            ]
        }
    ]
}
```

### Deployment Steps

1. **Supabase Setup**
   - Create project at `supabase.com`
   - Run all migrations in order
   - Enable Email/Password auth provider
   - Set site URL to `https://your-domain.vercel.app`
   - Add redirect URLs: `https://your-domain.vercel.app/auth/callback`

2. **Vercel Setup**
   - Connect GitHub repository
   - Add all environment variables (use Vercel Secrets for sensitive values)
   - Set Node.js version to 20.x
   - Deploy

3. **Post-Deployment Verification**
   - [ ] Auth signup/login flow works
   - [ ] Profile auto-creates on signup
   - [ ] API key storage and encryption works
   - [ ] AI endpoints return streamed responses
   - [ ] RLS prevents cross-user data access
   - [ ] Rate limiting functional
   - [ ] Download endpoints generate valid .md files
   - [ ] All pages responsive on mobile

### Middleware Configuration

```typescript
// middleware.ts

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Protected routes
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages
    if (user && (
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register')
    )) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
```

---

## 11. Future Scalability Improvements

### Phase 2 — Near Term
| Feature | Description |
|---------|-------------|
| **Multi-model Support** | Add OpenAI, Anthropic, Mistral as BYOK options |
| **Team Workspaces** | Shared projects with role-based permissions (Viewer/Editor/Admin) |
| **Template Library** | Pre-built PRD templates for common app types (SaaS, E-commerce, Mobile) |
| **Export Formats** | PDF export, Notion integration, Linear import |
| **Prompt Marketplace** | Community-shared Antigravity prompts with ratings |

### Phase 3 — Medium Term
| Feature | Description |
|---------|-------------|
| **Real-time Collaboration** | Supabase Realtime for live co-editing PRDs |
| **AI Chat Refinement** | Conversational PRD refinement within each step |
| **Version Diffing** | Visual diff between PRD versions (like GitHub) |
| **Analytics Dashboard** | Track prompt quality, generation patterns, popular features |
| **Webhook Integrations** | Auto-create GitHub issues/Jira tickets from PRD features |

### Infrastructure Scaling
| Concern | Solution |
|---------|----------|
| **Rate Limiting** | Migrate from in-memory Map → Upstash Redis (`@upstash/ratelimit`) |
| **Key Encryption** | Migrate to Supabase Vault (`pgsodium`) for HSM-backed encryption |
| **File Storage** | Supabase Storage for generated .md files instead of on-the-fly generation |
| **Edge Caching** | Vercel KV for caching frequent dashboard queries |
| **Monitoring** | Sentry for error tracking, Vercel Analytics for performance |
| **CI/CD** | GitHub Actions: lint → type-check → test → deploy preview → production |

### Database Optimization
```sql
-- Materialized view for dashboard stats
CREATE MATERIALIZED VIEW user_stats AS
SELECT
    p.id AS user_id,
    COUNT(DISTINCT pr.id) AS total_projects,
    COUNT(DISTINCT gp.id) AS total_prompts,
    COUNT(DISTINCT CASE WHEN pr.status = 'completed' THEN pr.id END) AS completed_projects,
    MAX(pr.updated_at) AS last_activity
FROM profiles p
LEFT JOIN projects pr ON pr.user_id = p.id
LEFT JOIN generated_prompts gp ON gp.user_id = p.id
GROUP BY p.id;

-- Refresh periodically
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## Appendix: Validation Schemas

```typescript
// src/lib/validators.ts

import { z } from 'zod';

export const improveIdeaSchema = z.object({
    idea: z.string().min(20, 'Idea must be at least 20 characters').max(5000),
    projectId: z.string().uuid(),
});

export const generatePrdSchema = z.object({
    idea: z.string().min(50).max(10000),
    projectId: z.string().uuid(),
});

export const generatePromptSchema = z.object({
    prd: z.string().min(100).max(50000),
    projectId: z.string().uuid(),
});

export const createProjectSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
});

export const updateProjectSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional(),
    status: z.enum([
        'draft', 'idea_complete', 'prd_generated',
        'prd_edited', 'prompt_generated', 'completed'
    ]).optional(),
    original_idea: z.string().optional(),
    improved_idea: z.string().optional(),
    generated_prd: z.string().optional(),
    edited_prd: z.string().optional(),
    color_palette: z.object({
        primary: z.string(),
        secondary: z.string(),
        accent: z.string(),
        background: z.string(),
        text: z.string(),
    }).optional(),
    final_markdown: z.string().optional(),
    final_prompt: z.string().optional(),
});

export const apiKeySchema = z.object({
    apiKey: z.string()
        .min(10, 'Invalid API key format')
        .max(100, 'Invalid API key format')
        .regex(/^AI/, 'Gemini API keys must start with "AI"'),
});
```
