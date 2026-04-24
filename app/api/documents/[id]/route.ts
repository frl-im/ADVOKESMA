import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('session-token')?.value;

        if (!sessionToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const userId = sessionToken.split(':')[0];
        const isAdmin = sessionToken.includes('admin');
        const isAdvocacy = sessionToken.includes('advocacy');

        if (!isAdmin && !isAdvocacy) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const doc = await db.advocacyDocument.findUnique({ where: { id } });

        if (!doc) {
            return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
        }

        if (!isAdmin && doc.uploaderId !== userId) {
            return NextResponse.json({ error: 'Anda tidak berhak menghapus dokumen ini' }, { status: 403 });
        }

        // Delete from DB first
        await db.advocacyDocument.delete({ where: { id } });

        // Then delete physical file
        try {
            const filepath = path.join(process.cwd(), 'public', doc.fileUrl.replace(/^\//, ''));
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        } catch (fileErr) {
            console.error("Gagal menghapus file fisik:", fileErr);
            // Non-fatal error, continue
        }

        return NextResponse.json({ message: 'OK' }, { status: 200 });
    } catch (err: any) {
        console.error("Delete document error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
