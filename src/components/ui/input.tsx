import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export function Input({
    label,
    error,
    hint,
    className,
    id,
    ...props
}: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-foreground"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={cn(
                    'w-full px-4 py-2.5 bg-card border border-border rounded-lg text-foreground placeholder-muted',
                    'transition-all duration-200',
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
