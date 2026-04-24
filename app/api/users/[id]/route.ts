import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15, params is a Promise
) {
    try {
        const id = (await params).id;
        
        // Cannot delete admin easily to prevent lockout, but assuming 'admin' is nim, maybe restrict deleting role ADMIN?
        const user = await db.user.findUnique({ where: { id } });
        if (user?.role === 'ADMIN') {
             return NextResponse.json({ error: 'Cannot delete an Admin.' }, { status: 403 });
        }

        // Must delete aspirations made by this student first, or cascade
        await db.aspiration.deleteMany({ where: { studentId: id } });
        await db.user.delete({ where: { id } });

        return NextResponse.json({ message: 'User deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
