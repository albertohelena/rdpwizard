'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { KeyRound, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
            });

            if (resetError) {
                setError(resetError.message);
                return;
            }

            setSuccess(true);
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 border border-success/20 mb-2">
                        <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
                    <p className="text-muted text-sm max-w-sm mx-auto">
                        If an account exists for <strong className="text-foreground">{email}</strong>,
                        you&apos;ll receive a password reset link.
                    </p>
                </div>
                <p className="text-center text-sm text-muted">
                    <Link href="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                        Back to sign in
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-2">
                    <KeyRound className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
                <p className="text-muted text-sm">Enter your email and we&apos;ll send you a reset link</p>
            </div>

            <Card className="glass">
                <form onSubmit={handleReset} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}

                    <Input
                        id="forgot-email"
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        autoFocus
                    />

                    <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                        Send Reset Link
                    </Button>
                </form>
            </Card>

            <p className="text-center text-sm text-muted">
                Remember your password?{' '}
                <Link href="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
