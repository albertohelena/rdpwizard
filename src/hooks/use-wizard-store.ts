'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
}

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
    setUiGuidelines: (guidelines: string | null) => void;
    setAppStructure: (structure: string | null) => void;
    setFinalMarkdown: (md: string | null) => void;
    setFinalPrompt: (prompt: string | null) => void;
    setLoading: (
        key: 'isImprovingIdea' | 'isGeneratingPrd' | 'isGeneratingPrompt',
        value: boolean
    ) => void;
    reset: () => void;
    loadFromProject: (project: {
        original_idea?: string | null;
        improved_idea?: string | null;
        generated_prd?: string | null;
        edited_prd?: string | null;
        color_palette?: ColorPalette | null;
        ui_guidelines?: string | null;
        app_structure?: string | null;
        final_markdown?: string | null;
        final_prompt?: string | null;
        current_step?: number;
    }) => void;

    // Computed
    canProceedToStep: (step: number) => boolean;
    activeIdea: () => string;
    activePrd: () => string | null;
}

const initialState = {
    projectId: null as string | null,
    currentStep: 1,
    originalIdea: '',
    improvedIdea: null as string | null,
    isImprovingIdea: false,
    generatedPrd: null as string | null,
    isGeneratingPrd: false,
    editedPrd: null as string | null,
    colorPalette: null as ColorPalette | null,
    uiGuidelines: null as string | null,
    appStructure: null as string | null,
    finalMarkdown: null as string | null,
    finalPrompt: null as string | null,
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
            setUiGuidelines: (guidelines) => set({ uiGuidelines: guidelines }),
            setAppStructure: (structure) => set({ appStructure: structure }),
            setFinalMarkdown: (md) => set({ finalMarkdown: md }),
            setFinalPrompt: (prompt) => set({ finalPrompt: prompt }),
            setLoading: (key, value) => set({ [key]: value }),
            reset: () => set(initialState),

            loadFromProject: (project) =>
                set({
                    originalIdea: project.original_idea || '',
                    improvedIdea: project.improved_idea || null,
                    generatedPrd: project.generated_prd || null,
                    editedPrd: project.edited_prd || null,
                    colorPalette: project.color_palette || null,
                    uiGuidelines: project.ui_guidelines || null,
                    appStructure: project.app_structure || null,
                    finalMarkdown: project.final_markdown || null,
                    finalPrompt: project.final_prompt || null,
                    currentStep: project.current_step || 1,
                }),

            canProceedToStep: (step: number) => {
                const state = get();
                switch (step) {
                    case 1:
                        return true;
                    case 2:
                        return (state.improvedIdea || state.originalIdea).length >= 50;
                    case 3:
                        return !!state.generatedPrd;
                    case 4:
                        return !!(state.editedPrd || state.generatedPrd);
                    default:
                        return false;
                }
            },

            activeIdea: () => {
                const state = get();
                return state.improvedIdea || state.originalIdea;
            },

            activePrd: () => {
                const state = get();
                return state.editedPrd || state.generatedPrd;
            },
        }),
        {
            name: 'wizard-draft',
            storage: createJSONStorage(() =>
                typeof window !== 'undefined' ? sessionStorage : ({
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                })
            ),
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
