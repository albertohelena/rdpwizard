'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProjects, deleteProject, createProject } from '@/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SkeletonList } from '@/components/ui/skeleton';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/constants/config';
import {
    Plus,
    Trash2,
    ArrowRight,
    FolderOpen,
    Sparkles,
    X,
} from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const { projects, isLoading, error, mutate } = useProjects();
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        setIsCreating(true);
        try {
            const project = await createProject(newTitle.trim(), newDescription.trim() || undefined);
            setShowCreateDialog(false);
            setNewTitle('');
            setNewDescription('');
            mutate();
            router.push(`/dashboard/projects/${project.id}/wizard`);
        } catch (err) {
            console.error('Failed to create project:', err);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (projectId: string) => {
        try {
            await deleteProject(projectId);
            setDeleteId(null);
            mutate();
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Projects</h1>
                    <p className="text-muted text-sm mt-1">
                        {projects.length} project{projects.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4" /> New Project
                </Button>
            </div>

            {/* Create Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setShowCreateDialog(false)} />
                    <div className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">New Project</h2>
                            <button
                                onClick={() => setShowCreateDialog(false)}
                                className="p-1 rounded-lg hover:bg-card-hover transition-colors"
                            >
                                <X className="w-5 h-5 text-muted" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <Input
                                id="project-title"
                                label="Project Title"
                                placeholder="My awesome app"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                required
                                autoFocus
                            />
                            <Input
                                id="project-description"
                                label="Description (optional)"
                                placeholder="Brief summary of the project"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                            />
                            <div className="flex gap-3 justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowCreateDialog(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={isCreating}>
                                    <Sparkles className="w-4 h-4" /> Create & Start
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Loading */}
            {isLoading && <SkeletonList count={6} />}

            {/* Error */}
            {error && (
                <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                    Failed to load projects. Please try again.
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && projects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
                        <FolderOpen className="w-8 h-8 text-muted" />
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="font-semibold text-lg">No projects yet</h3>
                        <p className="text-muted text-sm">
                            Create your first project to start generating PRDs
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="w-4 h-4" /> Create First Project
                    </Button>
                </div>
            )}

            {/* Project Grid */}
            {!isLoading && projects.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
                    {projects.map((project) => (
                        <Card key={project.id} hover className="flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold truncate">{project.title}</h3>
                                    {project.description && (
                                        <p className="text-sm text-muted mt-1">
                                            {truncate(project.description, 80)}
                                        </p>
                                    )}
                                </div>
                                <Badge
                                    className={PROJECT_STATUS_COLORS[project.status] || ''}
                                >
                                    {PROJECT_STATUS_LABELS[project.status] || project.status}
                                </Badge>
                            </div>

                            <div className="text-xs text-muted mb-2">
                                Step {project.current_step} of 4
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-card-hover rounded-full overflow-hidden mb-4">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                                    style={{ width: `${(project.current_step / 4) * 100}%` }}
                                />
                            </div>

                            <CardFooter className="justify-between mt-auto">
                                <span className="text-xs text-muted">
                                    {formatRelativeTime(project.updated_at)}
                                </span>
                                <div className="flex items-center gap-1">
                                    {deleteId === project.id ? (
                                        <>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(project.id)}
                                            >
                                                Confirm
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteId(null)}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteId(project.id);
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                                                aria-label="Delete project"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <Link href={`/dashboard/projects/${project.id}/wizard`}>
                                                <Button variant="ghost" size="sm">
                                                    Open <ArrowRight className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
