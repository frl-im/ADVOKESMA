import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';

const userSchema = z.object({
    nim: z.string().min(3),
    password: z.string().min(4),
    role: z.enum(['STUDENT', 'ADVOCACY_CHAIR', 'ADMIN']),
    advocacyScope: z.enum(['PRODI', 'FACULTY', 'UNIVERSITY', 'UKM']).optional().nullable(),
    prodiId: z.string().optional().nullable(),
    ukmId: z.string().optional().nullable(),
});

export async function GET() {
    try {
        const users = await db.user.findMany({
            include: {
                prodi: true,
                ukm: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Hide passwords
        const safeUsers = users.map(({ password, ...rest }) => rest);
        
        return NextResponse.json(safeUsers, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = userSchema.parse(body);

        // Check duplicate NIM
        const existing = await db.user.findUnique({ where: { nim: data.nim } });
        if (existing) {
            return NextResponse.json({ error: 'NIM already exists' }, { status: 400 });
        }

        const newUser = await db.user.create({
            data: {
                nim: data.nim,
                password: data.password, // Ideally hashed
                role: data.role,
                advocacyScope: data.advocacyScope,
                prodiId: data.prodiId,
                ukmId: data.ukmId,
            }
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
