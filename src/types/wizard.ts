import type { ProjectStatus } from './database';

export interface WizardStep {
    id: number;
    title: string;
    description: string;
    icon: string;
    requiredStatus?: ProjectStatus;
}

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
}

export interface StreamChunk {
    text?: string;
    done?: boolean;
    error?: string;
    tokensUsed?: {
        prompt: number;
        completion: number;
        total: number;
    };
}
