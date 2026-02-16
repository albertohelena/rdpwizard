import { z } from 'zod';

// ========================
// AI Endpoints
// ========================

export const improveIdeaSchema = z.object({
    idea: z.string().min(20, 'Idea must be at least 20 characters').max(5000, 'Idea must be under 5000 characters'),
    projectId: z.string().uuid('Invalid project ID'),
});

export const generatePrdSchema = z.object({
    idea: z.string().min(50, 'Idea must be at least 50 characters').max(10000),
    projectId: z.string().uuid('Invalid project ID'),
});

export const generatePromptSchema = z.object({
    prd: z.string().min(100, 'PRD must be at least 100 characters').max(50000),
    projectId: z.string().uuid('Invalid project ID'),
    projectTitle: z.string().min(1).max(200),
});

// ========================
// Projects
// ========================

export const createProjectSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be under 100 characters'),
    description: z.string().max(500, 'Description must be under 500 characters').optional(),
});

export const updateProjectSchema = z.object({
    id: z.string().uuid('Invalid project ID'),
    title: z.string().min(3).max(100).optional(),
    description: z.string().max(500).optional(),
    status: z.enum([
        'draft',
        'idea_complete',
        'prd_generated',
        'prd_edited',
        'prompt_generated',
        'completed',
    ]).optional(),
    current_step: z.number().int().min(1).max(4).optional(),
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
    ui_guidelines: z.string().optional(),
    app_structure: z.string().optional(),
    final_markdown: z.string().optional(),
    final_prompt: z.string().optional(),
});

export const deleteProjectSchema = z.object({
    id: z.string().uuid('Invalid project ID'),
});

// ========================
// API Keys
// ========================

export const apiKeySchema = z.object({
    apiKey: z
        .string()
        .min(10, 'Invalid API key format')
        .max(100, 'Invalid API key format'),
});

// ========================
// Type Exports
// ========================

export type ImproveIdeaInput = z.infer<typeof improveIdeaSchema>;
export type GeneratePrdInput = z.infer<typeof generatePrdSchema>;
export type GeneratePromptInput = z.infer<typeof generatePromptSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ApiKeyInput = z.infer<typeof apiKeySchema>;
