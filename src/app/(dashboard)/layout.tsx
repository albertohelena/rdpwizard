import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

interface Profile {
    id: string;
    full_name: string | null;
    has_api_key: boolean;
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch profile — cast since we don't have generated Supabase types
    const { data } = await supabase
        .from('profiles' as never)
        .select('*')
        .eq('id' as never, user.id as never)
        .single();
    const profile = data as unknown as Profile | null;

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar
                user={{
                    email: user.email || '',
                    fullName: profile?.full_name || user.email?.split('@')[0] || 'User',
                    hasApiKey: profile?.has_api_key || false,
                }}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar
                    user={{
                        email: user.email || '',
                        fullName: profile?.full_name || user.email?.split('@')[0] || 'User',
                    }}
                />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
