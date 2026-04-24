import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aspirationSubmissionSchema } from '@/lib/validations/aspiration';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validated = aspirationSubmissionSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validated.error.flatten() },
                { status: 422 }
            );
        }

        const { title, content, level, studentId, prodiId, facultyId, universityId, ukmId, evidenceUrl } = validated.data;

        const aspiration = await db.aspiration.create({
            data: {
                title,
                content,
                level: level as any,
                studentId,
                prodiId: prodiId ?? null,
                facultyId: facultyId ?? null,
                universityId: universityId ?? null,
                ukmId: ukmId ?? null,
                evidenceUrl: evidenceUrl ?? null,
            },
        });

        return NextResponse.json(
            { message: 'Aspiration submitted successfully!', aspirationId: aspiration.id },
            { status: 201 }
        );

    } catch (err: any) {
        console.error('POST /api/aspirations error:', err?.message);
        return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
    }
}
