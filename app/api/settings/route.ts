import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as z from 'zod';

const settingsSchema = z.object({
    prodiCanSeeFaculty: z.boolean(),
    prodiCanSeeUniversity: z.boolean(),
    facultyCanSeeProdi: z.boolean(),
    facultyCanSeeUniversity: z.boolean(),
    universityCanSeeProdi: z.boolean(),
    universityCanSeeFaculty: z.boolean(),
});

export async function GET() {
    try {
        const settings = await db.systemSettings.findUnique({
            where: { id: "GLOBAL" }
        });
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const data = settingsSchema.parse(body);

        const updatedSettings = await db.systemSettings.update({
            where: { id: "GLOBAL" },
            data
        });

        return NextResponse.json(updatedSettings);
    } catch (error) {
         return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
    }
}
