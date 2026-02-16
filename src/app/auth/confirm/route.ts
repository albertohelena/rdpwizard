import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    const token_hash = request.nextUrl.searchParams.get('token_hash');
    const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
    const next = request.nextUrl.searchParams.get('next') ?? '/dashboard';

    if (token_hash && type) {
        const supabase = await createClient();
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });

        if (!error) {
            return NextResponse.redirect(new URL(next, request.url));
        }
    }

    return NextResponse.redirect(new URL('/login?error=confirmation_failed', request.url));
}
