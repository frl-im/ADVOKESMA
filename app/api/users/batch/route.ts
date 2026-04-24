import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const userInfo = cookieStore.get('user-info')?.value;
        if (!userInfo) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const user = JSON.parse(userInfo);
        if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const { users } = body;

        if (!Array.isArray(users)) {
            return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 });
        }

        // We will insert them one by one to properly hash the passwords
        let successCount = 0;
        let failCount = 0;

        for (const data of users) {
             try {
                if (!data.nim || !data.password) continue;
                
                const hashedPassword = await hash(data.password, 10);
                
                await db.user.create({
                    data: {
                        nim: data.nim,
                        password: hashedPassword,
                        role: 'STUDENT',
                        prodiId: data.prodiId || null,
                    }
                });
                successCount++;
             } catch (e) {
                 failCount++;
                 console.error('Failed indexing user ' + data.nim, e);
             }
        }

        return NextResponse.json({ 
            message: 'Batch process complete', 
            success: successCount, 
            failed: failCount 
        }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Gagal mengeksekusi batch upload' }, { status: 500 });
    }
}
