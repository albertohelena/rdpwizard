'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { Project } from '@/types/database';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function fetchProjects(): Promise<Project[]> {
    const supabase = createClient() as any;
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Project[];
}

async function fetchProject(projectId: string): Promise<Project | null> {
    const supabase = createClient() as any;
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (error) throw error;
    return data as Project | null;
}

/**
 * SWR hook for fetching the user's project list.
 */
export function useProjects() {
    const { data, error, isLoading, mutate } = useSWR<Project[]>(
        'projects',
        fetchProjects,
        {
            revalidateOnFocus: false,
            dedupingInterval: 5000,
        }
    );

    return {
        projects: data || [],
        isLoading,
        error,
        mutate,
    };
}

/**
 * SWR hook for fetching a single project by ID.
 */
export function useProject(projectId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<Project | null>(
        projectId ? `project-${projectId}` : null,
        () => (projectId ? fetchProject(projectId) : null),
        {
            revalidateOnFocus: false,
        }
    );

    return {
        project: data || null,
        isLoading,
        error,
        mutate,
    };
}

/**
 * Create a new project and optimistically update the project list.
 */
export async function createProject(
    title: string,
    description?: string
): Promise<Project> {
    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create project');
    }

    const result = await response.json();
    return result.data;
}

/**
 * Delete a project.
 */
export async function deleteProject(projectId: string): Promise<void> {
    const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete project');
    }
}

/**
 * Update a project.
 */
export async function updateProject(
    projectId: string,
    updates: Partial<Project>
): Promise<Project> {
    const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, ...updates }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update project');
    }

    const result = await response.json();
    return result.data;
}
