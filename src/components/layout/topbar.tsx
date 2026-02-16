'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
    Menu,
    X,
    LogOut,
    Settings,
    LayoutDashboard,
    History,
    Sparkles,
} from 'lucide-react';

interface TopbarProps {
    user: {
        email: string;
        fullName: string;
    };
}

const mobileNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/history', label: 'History', icon: History },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Topbar({ user }: TopbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    return (
        <>
            <header className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-6 shrink-0">
                {/* Mobile menu button */}
                <button
                    className="lg:hidden p-2 rounded-lg hover:bg-card-hover transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? (
                        <X className="w-5 h-5" />
                    ) : (
                        <Menu className="w-5 h-5" />
                    )}
                </button>

                {/* Mobile logo */}
                <div className="lg:hidden flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="font-bold">PRD Wizard</span>
                </div>

                {/* Desktop: Page title area */}
                <div className="hidden lg:block" />

                {/* User menu */}
                <div className="relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-card-hover transition-colors"
                        aria-label="User menu"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                                {user.fullName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span className="hidden md:block text-sm font-medium">{user.fullName}</span>
                    </button>

                    {/* Dropdown */}
                    {userMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setUserMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                                <div className="p-3 border-b border-border">
                                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                                    <p className="text-xs text-muted truncate">{user.email}</p>
                                </div>
                                <div className="p-1">
                                    <Link
                                        href="/dashboard/settings"
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-card-hover transition-colors"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <Settings className="w-4 h-4 text-muted" />
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-danger/10 text-danger transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Mobile Nav Overlay */}
            {mobileMenuOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="lg:hidden fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 animate-slide-in">
                        <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-bold text-lg">PRD Wizard</span>
                        </div>
                        <nav className="p-4 space-y-1">
                            {mobileNavItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
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
                    </div>
                </>
            )}
        </>
    );
}
