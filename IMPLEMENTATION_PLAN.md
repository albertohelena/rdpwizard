# Implementation Plan — PRD Generator Wizard

## Phase 1: Foundation (Days 1–2)

### 1.1 Project Initialization
- [ ] Run `npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
- [ ] Install dependencies:
  ```bash
  npm install @supabase/supabase-js @supabase/ssr @google/generative-ai zustand swr zod
  npm install react-markdown remark-gfm rehype-sanitize rehype-highlight
  npm install lucide-react clsx tailwind-merge
  npm install -D supabase @types/node
  ```
- [ ] Configure `.env.local` from `.env.example`
- [ ] Set up TailwindCSS with custom design tokens

### 1.2 Supabase Setup
- [ ] Create Supabase project
- [ ] Run all 6 migrations in order
- [ ] Enable Email/Password auth
- [ ] Configure site URL and redirect URLs
- [ ] Generate TypeScript types: `npx supabase gen types typescript`

### 1.3 Core Library Layer
- [ ] `src/lib/supabase/client.ts` — Browser client
- [ ] `src/lib/supabase/server.ts` — Server client (App Router cookies)
- [ ] `src/lib/supabase/admin.ts` — Service role client
- [ ] `src/lib/supabase/middleware.ts` — Middleware helper
- [ ] `src/lib/crypto.ts` — AES-256-GCM encrypt/decrypt
- [ ] `src/lib/rate-limiter.ts` — Token bucket
- [ ] `src/lib/validators.ts` — Zod schemas
- [ ] `src/lib/utils.ts` — cn(), formatDate(), etc.
- [ ] `middleware.ts` — Auth guard

---

## Phase 2: Authentication (Day 2)

### 2.1 Auth Pages
- [ ] `(auth)/layout.tsx` — Centered card layout
- [ ] `(auth)/login/page.tsx` — Email + password login form
- [ ] `(auth)/register/page.tsx` — Registration form with full_name
- [ ] `(auth)/forgot-password/page.tsx` — Password reset
- [ ] `auth/callback/route.ts` — Supabase callback handler
- [ ] `auth/confirm/route.ts` — Email confirmation handler

### 2.2 Auth Flow Testing
- [ ] Sign up → auto-create profile → redirect to dashboard
- [ ] Login → session → redirect to dashboard
- [ ] Middleware blocks unauthenticated access to /dashboard
- [ ] Middleware redirects authenticated users away from /login

---

## Phase 3: Dashboard (Days 3–4)

### 3.1 Layout
- [ ] `(dashboard)/layout.tsx` — Sidebar + topbar shell
- [ ] `components/layout/sidebar.tsx`
- [ ] `components/layout/topbar.tsx`
- [ ] `components/layout/mobile-nav.tsx`
- [ ] `components/layout/user-menu.tsx`

### 3.2 Projects Dashboard
- [ ] `(dashboard)/dashboard/page.tsx` — Projects list (Server Component)
- [ ] `components/dashboard/project-card.tsx`
- [ ] `components/dashboard/project-list.tsx`
- [ ] `components/dashboard/create-project-dialog.tsx`
- [ ] `components/dashboard/empty-state.tsx`
- [ ] `components/dashboard/stats-overview.tsx`

### 3.3 Project CRUD API
- [ ] `api/projects/route.ts` — GET (list), POST (create)
- [ ] Project delete functionality
- [ ] Optimistic updates with SWR

---

## Phase 4: Settings & API Key (Day 4)

### 4.1 Settings Page
- [ ] `(dashboard)/settings/page.tsx`
- [ ] `components/settings/api-key-form.tsx`
- [ ] `components/settings/profile-form.tsx`
- [ ] `api/api-keys/route.ts` — POST (store), DELETE (remove)

### 4.2 API Key Flow
- [ ] User enters Gemini API key
- [ ] Server validates key (test call to Gemini)
- [ ] Server encrypts with AES-256-GCM
- [ ] Store encrypted_key, iv, auth_tag
- [ ] Display hint ("...xK9m") in UI
- [ ] Delete and replace flow

---

## Phase 5: Wizard — Steps 1 & 2 (Days 5–6)

### 5.1 Wizard Shell
- [ ] `(dashboard)/projects/[projectId]/wizard/page.tsx`
- [ ] `components/wizard/wizard-shell.tsx`
- [ ] `components/wizard/step-indicator.tsx`
- [ ] `hooks/use-wizard-store.ts` — Zustand store

### 5.2 Step 1: Idea Input
- [ ] `components/wizard/step-1-idea.tsx`
- [ ] Textarea with character count
- [ ] "Continue" button (validates min 50 chars)
- [ ] "Improve with AI" button → SSE stream
- [ ] Version history saving
- [ ] `api/ai/improve-idea/route.ts`

### 5.3 Step 2: Generate PRD
- [ ] `components/wizard/step-2-prd.tsx`
- [ ] Auto-generate on entry (if no PRD exists)
- [ ] Streaming markdown display
- [ ] "Regenerate" option
- [ ] `api/ai/generate-prd/route.ts`

### 5.4 Gemini Integration
- [ ] `lib/gemini/client.ts` — Streaming + non-streaming
- [ ] `lib/gemini/stream.ts` — SSE utilities
- [ ] `constants/prompts.ts` — System prompts
- [ ] `hooks/use-streaming.ts` — Client-side SSE hook

---

## Phase 6: Wizard — Steps 3 & 4 (Days 7–8)

### 6.1 Step 3: PRD Editor
- [ ] `components/wizard/step-3-editor.tsx`
- [ ] Split view: editor | live preview
- [ ] `components/wizard/markdown-preview.tsx`
- [ ] `components/wizard/color-palette.tsx`
- [ ] Version save on edit
- [ ] `components/wizard/version-history.tsx`

### 6.2 Step 4: Prompt Generation
- [ ] `components/wizard/step-4-prompt.tsx`
- [ ] Two-tab output (Build Markdown | Antigravity Prompt)
- [ ] `components/wizard/download-actions.tsx`
- [ ] Download .md file
- [ ] Download Antigravity prompt
- [ ] Copy to clipboard
- [ ] Save to profile (generated_prompts table)
- [ ] `api/ai/generate-prompt/route.ts`
- [ ] `api/download/route.ts`

---

## Phase 7: Polish & Testing (Days 9–10)

### 7.1 History & Views
- [ ] `(dashboard)/history/page.tsx` — Global prompt history
- [ ] `(dashboard)/projects/[projectId]/prompts/page.tsx` — Per-project history
- [ ] Prompt detail view with download options

### 7.2 UI Polish
- [ ] Loading skeletons for all data-fetching states
- [ ] Error boundaries with retry
- [ ] Toast notifications (success, error, info)
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Dark mode (if applicable)
- [ ] Animations and transitions

### 7.3 Testing
- [ ] Unit tests: crypto, validators, rate limiter
- [ ] Integration tests: API routes
- [ ] E2E tests: auth flow, wizard flow, dashboard CRUD

---

## Phase 8: Deployment (Day 10)

### 8.1 Vercel Setup
- [ ] Connect GitHub repo
- [ ] Configure environment variables (use Vercel Secrets)
- [ ] Set Node.js 20.x
- [ ] Configure custom domain (if applicable)
- [ ] Add vercel.json with security headers

### 8.2 Post-Deploy Verification
- [ ] Auth signup/login flow
- [ ] API key storage and encryption
- [ ] All 4 wizard steps function with streaming
- [ ] RLS prevents cross-user access
- [ ] Rate limiting works
- [ ] Downloads produce valid .md files
- [ ] Mobile responsive
- [ ] Performance: LCP < 2.5s, FID < 100ms

---

## Estimated Timeline: 10 working days

| Phase | Days | Focus |
|-------|------|-------|
| Foundation | 1–2 | Project setup, Supabase, core libs |
| Auth | 2 | Login, register, middleware |
| Dashboard | 3–4 | Layout, project CRUD |
| Settings | 4 | API key management |
| Wizard 1–2 | 5–6 | Idea input, PRD generation |
| Wizard 3–4 | 7–8 | PRD editor, prompt generation |
| Polish | 9–10 | History, UI, testing |
| Deploy | 10 | Vercel, verification |
