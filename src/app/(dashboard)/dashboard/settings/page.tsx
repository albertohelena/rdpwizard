'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
    Key,
    Check,
    Trash2,
    Shield,
    AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Current key status
    const [keyInfo, setKeyInfo] = useState<{
        hasKey: boolean;
        hint?: string;
        isValid?: boolean;
        lastUsedAt?: string;
    } | null>(null);
    const [loadingKey, setLoadingKey] = useState(true);

    // Fetch current key status
    useEffect(() => {
        async function fetchKeyStatus() {
            try {
                const res = await fetch('/api/api-keys');
                const data = await res.json();
                setKeyInfo({
                    hasKey: data.hasKey,
                    hint: data.data?.key_hint,
                    isValid: data.data?.is_valid,
                    lastUsedAt: data.data?.last_used_at,
                });
            } catch {
                console.error('Failed to fetch API key status');
            } finally {
                setLoadingKey(false);
            }
        }
        fetchKeyStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('/api/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to save API key');
                return;
            }

            setSuccess('API key saved and validated successfully!');
            setKeyInfo({
                hasKey: true,
                hint: data.data.hint,
                isValid: true,
            });
            setApiKey('');
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('/api/api-keys', { method: 'DELETE' });

            if (!res.ok) {
                setError('Failed to delete API key');
                return;
            }

            setSuccess('API key removed successfully');
            setKeyInfo({ hasKey: false });
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted text-sm mt-1">Manage your account and API key</p>
            </div>

            {/* API Key Section */}
            <Card>
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Key className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle>OpenAI API Key</CardTitle>
                        <CardDescription>
                            Required for AI features. Your key is encrypted with AES-256-GCM.
                        </CardDescription>
                    </div>
                </div>

                {loadingKey ? (
                    <div className="flex items-center gap-2 text-muted text-sm">
                        <LoadingSpinner size="sm" /> Checking key status...
                    </div>
                ) : keyInfo?.hasKey ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-success/5 border border-success/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-success" />
                                <div>
                                    <p className="text-sm font-medium">API Key configured</p>
                                    <p className="text-xs text-muted">
                                        Key ending in: <code className="text-success">{keyInfo.hint}</code>
                                    </p>
                                </div>
                            </div>
                            <Badge variant="success">Active</Badge>
                        </div>

                        <div className="flex items-center gap-3">
                            <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
                                <Input
                                    id="replace-api-key"
                                    type="password"
                                    placeholder="Replace with new key..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" isLoading={isSubmitting} disabled={!apiKey.trim()}>
                                    Replace
                                </Button>
                            </form>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                isLoading={isDeleting}
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-warning">No API key configured</p>
                                <p className="text-muted mt-1">
                                    You need an OpenAI API key to use AI features.
                                    Get one at{' '}
                                    <a
                                        href="https://platform.openai.com/account/api-keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary-hover underline"
                                    >
                                        platform.openai.com
                                    </a>
                                </p>
                            </div>
                        </div>

                        <Input
                            id="new-api-key"
                            label="OpenAI API Key"
                            type="password"
                            placeholder="Paste your API key here..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            required
                        />

                        <Button type="submit" isLoading={isSubmitting} disabled={!apiKey.trim()}>
                            <Shield className="w-4 h-4" /> Save & Validate Key
                        </Button>
                    </form>
                )}

                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
                        {success}
                    </div>
                )}
            </Card>

            {/* Security Info */}
            <Card>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>How we protect your API key</CardDescription>
                    </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                    <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>Encrypted at rest using AES-256-GCM with unique initialization vectors</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>Decrypted only in server-side API routes — never sent to browsers</span>
                    </li>
                        <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>Validated against OpenAI before storage</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>Row Level Security ensures only you can access your key metadata</span>
                    </li>
                </ul>
            </Card>
        </div>
    );
}
