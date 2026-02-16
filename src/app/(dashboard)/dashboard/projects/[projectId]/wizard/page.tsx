'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject, updateProject } from '@/hooks/use-projects';
import { useWizardStore } from '@/hooks/use-wizard-store';
import { useStreaming } from '@/hooks/use-streaming';
import { useDownload } from '@/hooks/use-download';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/shared/loading-spinner';
import { WIZARD_STEPS, MIN_IDEA_LENGTH, MAX_IDEA_LENGTH } from '@/constants/wizard-steps';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Lightbulb,
    FileText,
    Edit3,
    Rocket,
    Sparkles,
    ArrowLeft,
    ArrowRight,
    RefreshCw,
    Copy,
    Download,
    Check,
    Save,
} from 'lucide-react';

const stepIcons = { Lightbulb, FileText, Edit3, Rocket };

export default function WizardPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const { project, isLoading: projectLoading, mutate } = useProject(projectId);

    const store = useWizardStore();
    const { downloadMarkdown, copyToClipboard } = useDownload();
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Streaming hooks for each AI endpoint
    const improveStream = useStreaming();
    const prdStream = useStreaming();
    const promptStream = useStreaming();

    // Initialize store from project data
    useEffect(() => {
        if (project && !initialized) {
            store.setProjectId(project.id);
            store.loadFromProject(project);
            setInitialized(true);
        }
    }, [project, initialized, store]);

    // Save to database
    const saveProgress = async (updates: Record<string, unknown> = {}) => {
        if (!projectId) return;
        setSaving(true);
        try {
            await updateProject(projectId, {
                original_idea: store.originalIdea || undefined,
                improved_idea: store.improvedIdea || undefined,
                generated_prd: store.generatedPrd || undefined,
                edited_prd: store.editedPrd || undefined,
                final_markdown: store.finalMarkdown || undefined,
                final_prompt: store.finalPrompt || undefined,
                current_step: store.currentStep,
                ...updates,
            } as Record<string, string | number | undefined>);
            mutate();
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setSaving(false);
        }
    };

    // Step 1: Improve idea
    const handleImproveIdea = async () => {
        store.setLoading('isImprovingIdea', true);
        const result = await improveStream.startStream('/api/ai/improve-idea', {
            idea: store.originalIdea,
            projectId,
        });

        if (result) {
            store.setImprovedIdea(result);
            saveProgress({ improved_idea: result, status: 'idea_complete' });
        }
        store.setLoading('isImprovingIdea', false);
    };

    // Step 2: Generate PRD
    const handleGeneratePrd = async () => {
        store.setLoading('isGeneratingPrd', true);
        const idea = store.improvedIdea || store.originalIdea;
        const result = await prdStream.startStream('/api/ai/generate-prd', {
            idea,
            projectId,
        });

        if (result) {
            store.setGeneratedPrd(result);
            saveProgress({ generated_prd: result, status: 'prd_generated' });
        }
        store.setLoading('isGeneratingPrd', false);
    };

    // Step 3: Save edited PRD
    const handleSavePrd = async () => {
        await saveProgress({
            edited_prd: store.editedPrd || store.generatedPrd,
            status: 'prd_edited',
        });
    };

    // Step 4: Generate prompt
    const handleGeneratePrompt = async () => {
        store.setLoading('isGeneratingPrompt', true);
        const prd = store.editedPrd || store.generatedPrd || '';
        const result = await promptStream.startStream('/api/ai/generate-prompt', {
            prd,
            projectId,
            projectTitle: project?.title || 'Untitled',
        });

        if (result) {
            const parts = result.split('---SPLIT---');
            const markdown = parts[0]?.trim() || result;
            const antigravityPrompt = parts[1]?.trim() || '';

            store.setFinalMarkdown(markdown);
            store.setFinalPrompt(antigravityPrompt);
            saveProgress({
                final_markdown: markdown,
                final_prompt: antigravityPrompt,
                status: 'prompt_generated',
            });
        }
        store.setLoading('isGeneratingPrompt', false);
    };

    const handleCopy = async (text: string) => {
        await copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const goToStep = (step: number) => {
        if (store.canProceedToStep(step)) {
            store.setStep(step);
            saveProgress({ current_step: step });
        }
    };

    if (projectLoading || !initialized) {
        return <LoadingScreen message="Loading project..." />;
    }

    if (!project) {
        return (
            <div className="text-center py-16">
                <p className="text-muted mb-4">Project not found</p>
                <Button onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-muted hover:text-foreground text-sm flex items-center gap-1 mb-1 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <h1 className="text-xl font-bold">{project.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {saving && (
                        <Badge variant="info">
                            <Save className="w-3 h-3 mr-1" /> Saving...
                        </Badge>
                    )}
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2">
                {WIZARD_STEPS.map((step, index) => {
                    const IconComponent = stepIcons[step.icon as keyof typeof stepIcons];
                    const isActive = store.currentStep === step.id;
                    const isCompleted = store.currentStep > step.id;
                    const isAccessible = store.canProceedToStep(step.id);

                    return (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => isAccessible && goToStep(step.id)}
                                disabled={!isAccessible}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : isCompleted
                                            ? 'bg-success/10 text-success border border-success/20 cursor-pointer'
                                            : isAccessible
                                                ? 'bg-card text-muted border border-border hover:border-border-hover cursor-pointer'
                                                : 'bg-card/50 text-muted/50 border border-border/50 cursor-not-allowed'
                                )}
                            >
                                <IconComponent className="w-4 h-4" />
                                <span className="hidden sm:inline">{step.title}</span>
                            </button>
                            {index < WIZARD_STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        'h-px flex-1 max-w-8',
                                        isCompleted ? 'bg-success/40' : 'bg-border'
                                    )}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
                {/* ===== STEP 1: IDEA INPUT ===== */}
                {store.currentStep === 1 && (
                    <Card className="space-y-4 animate-fade-in">
                        <div>
                            <h2 className="text-lg font-semibold mb-1">Describe Your Idea</h2>
                            <p className="text-sm text-muted">
                                Write your system idea. Be as detailed as possible — or let AI improve it.
                            </p>
                        </div>

                        <Textarea
                            id="idea-input"
                            value={store.originalIdea}
                            onChange={(e) => store.setOriginalIdea(e.target.value)}
                            placeholder="Describe your product idea here... For example: A web application that helps teams manage their daily standups asynchronously..."
                            className="min-h-[200px] text-base"
                            charCount={{ current: store.originalIdea.length, max: MAX_IDEA_LENGTH }}
                        />

                        {/* Show improved idea if exists */}
                        {(store.improvedIdea || improveStream.streamedText) && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    AI-Enhanced Version
                                </h3>
                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                    {improveStream.isStreaming
                                        ? improveStream.streamedText
                                        : store.improvedIdea}
                                </div>
                            </div>
                        )}

                        {improveStream.error && (
                            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                                {improveStream.error}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                variant="secondary"
                                onClick={handleImproveIdea}
                                isLoading={store.isImprovingIdea}
                                disabled={store.originalIdea.length < 20}
                            >
                                <Sparkles className="w-4 h-4" /> Improve with AI
                            </Button>
                            <Button
                                onClick={() => goToStep(2)}
                                disabled={!store.canProceedToStep(2)}
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                )}

                {/* ===== STEP 2: GENERATE PRD ===== */}
                {store.currentStep === 2 && (
                    <Card className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold mb-1">MVP PRD</h2>
                                <p className="text-sm text-muted">
                                    AI generates a simplified Product Requirements Document
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleGeneratePrd}
                                isLoading={store.isGeneratingPrd}
                            >
                                <RefreshCw className="w-4 h-4" />
                                {store.generatedPrd ? 'Regenerate' : 'Generate'}
                            </Button>
                        </div>

                        {/* PRD Output */}
                        {(store.generatedPrd || prdStream.streamedText) ? (
                            <div className="prose prose-invert max-w-none markdown-preview bg-card-hover/30 border border-border rounded-lg p-6 max-h-[500px] overflow-y-auto">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {prdStream.isStreaming
                                        ? prdStream.streamedText
                                        : store.generatedPrd || ''}
                                </ReactMarkdown>
                            </div>
                        ) : !store.isGeneratingPrd ? (
                            <div className="text-center py-12 border border-dashed border-border rounded-lg">
                                <FileText className="w-12 h-12 text-muted mx-auto mb-3" />
                                <p className="text-muted mb-4">Click Generate to create your MVP PRD</p>
                                <Button onClick={handleGeneratePrd}>
                                    <Sparkles className="w-4 h-4" /> Generate PRD
                                </Button>
                            </div>
                        ) : null}

                        {prdStream.error && (
                            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                                {prdStream.error}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                            <Button variant="ghost" onClick={() => goToStep(1)}>
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Button>
                            <Button
                                onClick={() => goToStep(3)}
                                disabled={!store.canProceedToStep(3)}
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                )}

                {/* ===== STEP 3: EDIT PRD ===== */}
                {store.currentStep === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold mb-1">Edit Your PRD</h2>
                                <p className="text-sm text-muted">
                                    Review and customize before generating prompts
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleSavePrd}
                                isLoading={saving}
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </Button>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-4">
                            {/* Editor */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Markdown Editor</label>
                                <textarea
                                    value={store.editedPrd || store.generatedPrd || ''}
                                    onChange={(e) => store.setEditedPrd(e.target.value)}
                                    className="w-full h-[500px] px-4 py-3 bg-card border border-border rounded-lg text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                    placeholder="Your PRD content..."
                                />
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Live Preview</label>
                                <div className="h-[500px] overflow-y-auto bg-card border border-border rounded-lg p-6 markdown-preview">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {store.editedPrd || store.generatedPrd || ''}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Button variant="ghost" onClick={() => goToStep(2)}>
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Button>
                            <Button
                                onClick={() => goToStep(4)}
                                disabled={!store.canProceedToStep(4)}
                            >
                                Generate Prompts <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ===== STEP 4: PROMPT GENERATION ===== */}
                {store.currentStep === 4 && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold mb-1">Generated Prompts</h2>
                                <p className="text-sm text-muted">
                                    Build-ready markdown & Antigravity prompt
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleGeneratePrompt}
                                isLoading={store.isGeneratingPrompt}
                            >
                                <RefreshCw className="w-4 h-4" />
                                {store.finalMarkdown ? 'Regenerate' : 'Generate'}
                            </Button>
                        </div>

                        {(store.finalMarkdown || promptStream.streamedText) ? (
                            <div className="space-y-4">
                                {/* Tab: Build Markdown */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium">Build-Ready Markdown</h3>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopy(store.finalMarkdown || '')}
                                            >
                                                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    downloadMarkdown(
                                                        store.finalMarkdown || '',
                                                        `${project.title}-build.md`
                                                    )
                                                }
                                            >
                                                <Download className="w-4 h-4" /> Download .md
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-lg p-6 max-h-[400px] overflow-y-auto markdown-preview">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {promptStream.isStreaming
                                                ? promptStream.streamedText
                                                : store.finalMarkdown || ''}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {/* Tab: Antigravity Prompt */}
                                {store.finalPrompt && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-medium flex items-center gap-2">
                                                <Rocket className="w-4 h-4 text-secondary" />
                                                Antigravity Prompt
                                            </h3>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopy(store.finalPrompt || '')}
                                                >
                                                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                                    {copied ? 'Copied!' : 'Copy'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        downloadMarkdown(
                                                            store.finalPrompt || '',
                                                            `${project.title}-antigravity-prompt.md`
                                                        )
                                                    }
                                                >
                                                    <Download className="w-4 h-4" /> Download
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-6 max-h-[400px] overflow-y-auto">
                                            <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                                                {store.finalPrompt}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : !store.isGeneratingPrompt ? (
                            <div className="text-center py-12 border border-dashed border-border rounded-lg">
                                <Rocket className="w-12 h-12 text-muted mx-auto mb-3" />
                                <p className="text-muted mb-4">Click Generate to create your prompts</p>
                                <Button onClick={handleGeneratePrompt}>
                                    <Sparkles className="w-4 h-4" /> Generate Prompts
                                </Button>
                            </div>
                        ) : null}

                        {promptStream.error && (
                            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                                {promptStream.error}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                            <Button variant="ghost" onClick={() => goToStep(3)}>
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Button>
                            <Button
                                onClick={() => router.push('/dashboard')}
                                variant="secondary"
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
