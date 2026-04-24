import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';
import { cookies } from 'next/headers';

const loginSchema = z.object({
    nim: z.string().min(3),
    password: z.string().min(4), // allow shorter passwords like 'admin'
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { nim, password } = loginSchema.parse(body);
        let rawNim = nim.trim();
        if (rawNim.toLowerCase() !== 'admin' && !rawNim.toLowerCase().startsWith('mhs-')) {
            rawNim = rawNim.toUpperCase();
        } else if (rawNim.toLowerCase().startsWith('mhs-')) {
            rawNim = rawNim.toUpperCase();
        }
        
        const user = await db.user.findUnique({
            where: { nim: rawNim },
            include: {
                prodi: true, // Fetch Prodi if student
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'NIM / User not found.' }, { status: 401 });
        }

        // In a real application, implement bcrypt.compare(password, user.password)
        if (user.password !== password) {
            return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
        }

        // Determine the mock token content (middleware expects strings to identify role)
        let token = user.id;
        if (user.role === 'ADMIN') {
            token = `${user.id}:admin`;
        } else if (user.role === 'ADVOCACY_CHAIR') {
            token = `${user.id}:advocacy`;
        } else {
            token = `${user.id}:student`;
        }

        // Keep token in standard session cookie
        const cookieStore = await cookies();
        cookieStore.set('session-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        // Also inject some base user info to another cookie for easy UI access without JWT decoding 
        // (In production, NextAuth or similar is better, but this fits the vanilla architectural approach).
        cookieStore.set('user-info', JSON.stringify({
            id: user.id,
            nim: user.nim,
            role: user.role,
            prodiId: user.prodiId,
            prodiName: user.prodi?.name,
            advocacyScope: user.advocacyScope,
            ukmId: user.ukmId
        }), {
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return NextResponse.json(
            { message: 'Login successful', role: user.role },
            { status: 200 }
        );

    } catch (err) {
        console.error("Login route error:", err);
        return NextResponse.json({ error: (err as any).message || 'Invalid Request.' }, { status: 400 });
    }
}
