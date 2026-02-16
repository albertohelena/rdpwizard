import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    glow?: boolean;
    onClick?: () => void;
}

export function Card({ children, className, hover = false, glow = false, onClick }: CardProps) {
    return (
        <div
            className={cn(
                'bg-card border border-border rounded-xl p-6',
                hover && 'transition-all duration-300 hover:border-border-hover hover:bg-card-hover cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20',
                glow && 'animate-pulse-glow',
                className
            )}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('mb-4', className)}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <h3 className={cn('text-lg font-semibold text-foreground', className)}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <p className={cn('text-sm text-muted mt-1', className)}>
            {children}
        </p>
    );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(className)}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('mt-4 pt-4 border-t border-border flex items-center', className)}>
            {children}
        </div>
    );
}
