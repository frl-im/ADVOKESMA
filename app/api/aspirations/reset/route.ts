import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE() {
    try {
        // DELETE ONLY non-archived aspirations
        await db.aspiration.deleteMany({
            where: { isArchived: false }
        });
        
        // DELETE ONLY STUDENT users
        await db.user.deleteMany({
            where: { role: 'STUDENT' }
        });
        
        return NextResponse.json({ message: 'Aspirations and student users reset successfully.' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to reset system data' }, { status: 500 });
    }
}
