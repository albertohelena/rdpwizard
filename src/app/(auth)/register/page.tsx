'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                },
            });

            if (signUpError) {
                setError(signUpError.message);
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
                        We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
                        Click the link to activate your account.
                    </p>
                </div>
                <Card className="glass text-center">
                    <p className="text-sm text-muted mb-4">
                        Didn&apos;t receive the email? Check your spam folder or try again.
                    </p>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setSuccess(false);
                            setError(null);
                        }}
                    >
                        Try Again
                    </Button>
                </Card>
                <p className="text-center text-sm text-muted">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Logo */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                <p className="text-muted text-sm">Start generating PRDs with AI</p>
            </div>

            {/* Register Form */}
            <Card className="glass">
                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                            {error}
                        </div>
                    )}

                    <Input
                        id="register-name"
                        label="Full Name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoComplete="name"
                        autoFocus
                    />

                    <Input
                        id="register-email"
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />

                    <Input
                        id="register-password"
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        hint="Must be at least 8 characters"
                    />

                    <Input
                        id="register-confirm-password"
                        label="Confirm Password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={isLoading}
                    >
                        Create Account
                    </Button>
                </form>
            </Card>

            {/* Login Link */}
            <p className="text-center text-sm text-muted">
                Already have an account?{' '}
                <Link
                    href="/login"
                    className="text-primary hover:text-primary-hover font-medium transition-colors"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}
