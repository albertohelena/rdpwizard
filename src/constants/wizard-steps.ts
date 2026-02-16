import type { WizardStep } from '@/types/wizard';

export const WIZARD_STEPS: WizardStep[] = [
    {
        id: 1,
        title: 'Idea Input',
        description: 'Describe your system idea',
        icon: 'Lightbulb',
    },
    {
        id: 2,
        title: 'Generate PRD',
        description: 'AI generates an MVP PRD',
        icon: 'FileText',
    },
    {
        id: 3,
        title: 'Edit PRD',
        description: 'Review and customize your PRD',
        icon: 'Edit3',
    },
    {
        id: 4,
        title: 'Generate Prompt',
        description: 'Create build-ready prompts',
        icon: 'Rocket',
    },
];

export const MIN_IDEA_LENGTH = 50;
export const MAX_IDEA_LENGTH = 5000;
