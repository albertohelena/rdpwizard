'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FolderOpen,
    Settings,
    Sparkles,
    Key,
} from 'lucide-react';

interface SidebarProps {
    user: {
        email: string;
        fullName: string;
        hasApiKey: boolean;
    };
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 min-h-screen">
            {/* Logo */}
            <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="font-bold text-lg">PRD Wizard</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-muted hover:text-foreground hover:bg-card-hover'
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* API Key Status */}
            {!user.hasApiKey && (
                <div className="p-4">
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20 text-sm text-warning hover:bg-warning/10 transition-colors"
                    >
                        <Key className="w-4 h-4 shrink-0" />
                        <div>
                            <p className="font-medium">Add API Key</p>
                            <p className="text-xs text-warning/70">Required for AI features</p>
                        </div>
                    </Link>
                </div>
            )}

            {/* User info */}
            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                            {user.fullName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{user.fullName}</p>
                        <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
