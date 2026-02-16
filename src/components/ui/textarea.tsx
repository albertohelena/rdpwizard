import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
    charCount?: { current: number; max: number };
}

export function Textarea({
    label,
    error,
    hint,
    charCount,
    className,
    id,
    ...props
}: TextareaProps) {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1.5">
            {(label || charCount) && (
                <div className="flex items-center justify-between">
                    {label && (
                        <label
                            htmlFor={textareaId}
                            className="block text-sm font-medium text-foreground"
                        >
                            {label}
                        </label>
                    )}
                    {charCount && (
                        <span
                            className={cn(
                                'text-xs',
                                charCount.current > charCount.max
                                    ? 'text-danger'
                                    : charCount.current > charCount.max * 0.9
                                        ? 'text-warning'
                                        : 'text-muted'
                            )}
                        >
                            {charCount.current.toLocaleString()} / {charCount.max.toLocaleString()}
                        </span>
                    )}
                </div>
            )}
            <textarea
                id={textareaId}
                className={cn(
                    'w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted',
                    'transition-all duration-200 resize-y min-h-[120px]',
                    'hover:border-border-hover',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                    error && 'border-danger focus:ring-danger/50 focus:border-danger',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-sm text-danger">{error}</p>
            )}
            {hint && !error && (
                <p className="text-sm text-muted">{hint}</p>
            )}
        </div>
    );
}
