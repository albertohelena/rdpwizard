/**
 * Supabase Database Types
 * 
 * In production, generate these automatically with:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 * 
 * This file provides manual type definitions matching our schema.
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type ProjectStatus =
    | 'draft'
    | 'idea_complete'
    | 'prd_generated'
    | 'prd_edited'
    | 'prompt_generated'
    | 'completed';

export type VersionType =
    | 'original_idea'
    | 'improved_idea'
    | 'generated_prd'
    | 'edited_prd'
    | 'final_markdown'
    | 'final_prompt';

export type PromptType =
    | 'build_markdown'
    | 'antigravity_prompt';

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
}

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string | null;
                    avatar_url: string | null;
                    has_api_key: boolean;
                    projects_count: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    has_api_key?: boolean;
                    projects_count?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    has_api_key?: boolean;
                    projects_count?: number;
                    updated_at?: string;
                };
            };
            projects: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    description: string | null;
                    status: ProjectStatus;
                    current_step: number;
                    original_idea: string | null;
                    improved_idea: string | null;
                    generated_prd: string | null;
                    edited_prd: string | null;
                    color_palette: ColorPalette | null;
                    ui_guidelines: string | null;
                    app_structure: string | null;
                    final_markdown: string | null;
                    final_prompt: string | null;
                    metadata: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    description?: string | null;
                    status?: ProjectStatus;
                    current_step?: number;
                    original_idea?: string | null;
                    improved_idea?: string | null;
                    generated_prd?: string | null;
                    edited_prd?: string | null;
                    color_palette?: ColorPalette | null;
                    ui_guidelines?: string | null;
                    app_structure?: string | null;
                    final_markdown?: string | null;
                    final_prompt?: string | null;
                    metadata?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    title?: string;
                    description?: string | null;
                    status?: ProjectStatus;
                    current_step?: number;
                    original_idea?: string | null;
                    improved_idea?: string | null;
                    generated_prd?: string | null;
                    edited_prd?: string | null;
                    color_palette?: ColorPalette | null;
                    ui_guidelines?: string | null;
                    app_structure?: string | null;
                    final_markdown?: string | null;
                    final_prompt?: string | null;
                    metadata?: Json;
                    updated_at?: string;
                };
            };
            project_versions: {
                Row: {
                    id: string;
                    project_id: string;
                    user_id: string;
                    version_type: VersionType;
                    version_number: number;
                    content: string;
                    metadata: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    user_id: string;
                    version_type: VersionType;
                    version_number?: number;
                    content: string;
                    metadata?: Json;
                    created_at?: string;
                };
                Update: never; // Immutable table
            };
            generated_prompts: {
                Row: {
                    id: string;
                    project_id: string;
                    user_id: string;
                    prompt_type: PromptType;
                    title: string;
                    content: string;
                    token_count: number | null;
                    model_used: string;
                    is_favorite: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    user_id: string;
                    prompt_type: PromptType;
                    title: string;
                    content: string;
                    token_count?: number | null;
                    model_used?: string;
                    is_favorite?: boolean;
                    created_at?: string;
                };
                Update: {
                    title?: string;
                    is_favorite?: boolean;
                };
            };
            api_keys: {
                Row: {
                    id: string;
                    user_id: string;
                    encrypted_key: string;
                    key_hint: string | null;
                    iv: string;
                    auth_tag: string;
                    is_valid: boolean;
                    last_used_at: string | null;
                    last_validated_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    encrypted_key: string;
                    key_hint?: string | null;
                    iv: string;
                    auth_tag: string;
                    is_valid?: boolean;
                    last_used_at?: string | null;
                    last_validated_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    encrypted_key?: string;
                    key_hint?: string | null;
                    iv?: string;
                    auth_tag?: string;
                    is_valid?: boolean;
                    last_used_at?: string | null;
                    last_validated_at?: string | null;
                    updated_at?: string;
                };
            };
        };
        Enums: {
            project_status: ProjectStatus;
            version_type: VersionType;
            prompt_type: PromptType;
        };
    };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectVersion = Database['public']['Tables']['project_versions']['Row'];
export type GeneratedPrompt = Database['public']['Tables']['generated_prompts']['Row'];
export type ApiKey = Database['public']['Tables']['api_keys']['Row'];
