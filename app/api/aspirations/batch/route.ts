import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aspirationSubmissionSchema } from '@/lib/validations/aspiration';

// POST /api/aspirations/batch — submit multiple aspirations at once
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { aspirations } = body;

        if (!Array.isArray(aspirations) || aspirations.length === 0) {
            return NextResponse.json({ error: 'Minimal 1 aspirasi harus diisi.' }, { status: 400 });
        }

        if (aspirations.length > 10) {
            return NextResponse.json({ error: 'Maksimal 10 aspirasi per pengiriman.' }, { status: 400 });
        }

        // Validate all items first
        const validated = [];
        for (let i = 0; i < aspirations.length; i++) {
            const result = aspirationSubmissionSchema.safeParse(aspirations[i]);
            if (!result.success) {
                const firstError = (result.error as any).errors?.[0]?.message || 'Input tidak valid';
                return NextResponse.json({
                    error: `Aspirasi #${i + 1} tidak valid: ${firstError}`,
                }, { status: 422 });
            }
            const d = result.data;
            validated.push({
                title: d.title,
                content: d.content,
                level: d.level as string,
                studentId: d.studentId,
                prodiId: d.prodiId ?? null,
                facultyId: d.facultyId ?? null,
                universityId: d.universityId ?? null,
                ukmId: d.ukmId ?? null,
                evidenceUrl: d.evidenceUrl ?? null,
            });
        }

        // Batch insert
        const created = await db.$transaction(
            validated.map((data) => db.aspiration.create({ data }))
        );

        return NextResponse.json({
            message: `${created.length} aspirasi berhasil dikirim!`,
            count: created.length,
        }, { status: 201 });

    } catch (err: any) {
        console.error('POST /api/aspirations/batch error:', err?.message);
        return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
    }
}
