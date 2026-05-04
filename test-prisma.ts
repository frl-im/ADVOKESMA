import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    try {
        console.log("Testing FACULTY query with null facultyId...");
        const settings = await db.systemSettings.findUnique({ where: { id: "GLOBAL" } });
        
        const facultyId = null;
        
        const orConditions: any[] = [{ level: 'FACULTY', facultyId }];
        if (settings?.facultyCanSeeProdi) orConditions.push({ level: 'PRODI', prodi: { facultyId } });
        if (settings?.facultyCanSeeUniversity) orConditions.push({ level: 'UNIVERSITY' });
        
        const whereClause = { OR: orConditions };
        console.log("whereClause:", JSON.stringify(whereClause, null, 2));
        
        const aspirations = await db.aspiration.findMany({
            where: whereClause,
            take: 1
        });
        
        console.log("Success:", aspirations.length);
    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        await db.$disconnect();
        process.exit();
    }
}

main();
