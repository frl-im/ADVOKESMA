import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const [prodis, ukms, faculties] = await Promise.all([
            db.prodi.findMany({ select: { id: true, name: true, faculty: { select: { name: true } } } }),
            db.uKM.findMany({ select: { id: true, name: true } }),
            db.faculty.findMany({ select: { id: true, name: true } })
        ]);
        
        return NextResponse.json({ prodis, ukms, faculties }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
