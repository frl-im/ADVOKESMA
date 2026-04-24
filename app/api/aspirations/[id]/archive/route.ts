import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        // Very basic auth check
        const cookieStore = await cookies();
        const userInfo = cookieStore.get('user-info')?.value;
        if (!userInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const user = JSON.parse(userInfo);
        if (user.role === 'STUDENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        await db.aspiration.update({
            where: { id },
            data: { isArchived: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to archive' }, { status: 500 });
    }
}
