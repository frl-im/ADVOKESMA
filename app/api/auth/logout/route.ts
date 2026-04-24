import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    const cookieStore = await cookies();
    cookieStore.delete('session-token');
    cookieStore.delete('user-info');
    return NextResponse.redirect(new URL('/login', req.url));
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    cookieStore.delete('session-token');
    cookieStore.delete('user-info');
    
    // POST from a form requires returning a 303 Redirect for Browsers to properly navigate
    return NextResponse.redirect(new URL('/login', req.url), { status: 303 });
}
