import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session-token')?.value;

        if (!sessionToken || !sessionToken.includes('advocacy')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const userId = sessionToken.split(':')[0];
        
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { prodi: { include: { faculty: true } } }
        });

        if (!user || user.role !== 'ADVOCACY_CHAIR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Batas maksimal 10 dokumen per Ketua Advo
        const currentCount = await db.advocacyDocument.count({ where: { uploaderId: userId } });
        if (currentCount >= 10) {
            return NextResponse.json({ error: 'Batas maksimal 10 dokumen telah tercapai. Anda harus menghapus dokumen lama terlebih dahulu.' }, { status: 400 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string | null;

        if (!file || !title) {
            return NextResponse.json({ error: 'File dan Judul dokumen wajib diisi.' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Hanya file PDF yang diperbolehkan.' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return NextResponse.json({ error: 'Ukuran file terlalu besar. Maksimal 5MB.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64String = buffer.toString('base64');
        const fileUrl = `data:${file.type};base64,${base64String}`;
        
        const scope = user.advocacyScope ?? 'UNIVERSITY';
        
        const doc = await db.advocacyDocument.create({
            data: {
                title,
                fileUrl: fileUrl,
                uploaderId: user.id,
                level: scope === 'UKM' ? 'UKM' : scope,
                prodiId: user.prodiId,
                facultyId: user.prodi?.facultyId ?? null,
                universityId: user.prodi?.faculty?.universityId ?? null,
                ukmId: user.ukmId,
            }
        });

        return NextResponse.json(doc, { status: 200 });
    } catch (err: any) {
        console.error("Upload error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
