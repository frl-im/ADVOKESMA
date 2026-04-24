import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Menjalankan admin & ukm seed...\n')

    await prisma.systemSettings.upsert({
        where: { id: "GLOBAL" },
        update: {},
        create: {
            id: "GLOBAL",
            prodiCanSeeFaculty: false,
            prodiCanSeeUniversity: false,
            facultyCanSeeProdi: true,
            facultyCanSeeUniversity: false,
            universityCanSeeProdi: true,
            universityCanSeeFaculty: true,
        }
    })

    await prisma.user.upsert({
        where: { nim: 'admin' },
        update: {},
        create: {
            nim: 'admin',
            password: 'admin',
            role: 'ADMIN',
        }
    })

    const ukms = [
        'UKM Seni', 'UKM OR', 'UKM PSM', 'UKM TS', 'UKM HW', 
        'UKM Pramuka', 'UKM TQ', 'UKM KWU', 'UKM Mapala', 
        'UKOM', 'Gonimus', 'UKM Gema'
    ]
    
    for (const name of ukms) {
        const ukmName = name.toUpperCase()
        const ukm = await prisma.uKM.upsert({
            where: { name: ukmName },
            update: {},
            create: { name: ukmName }
        });
        
        const advNim = `ADV-${ukmName.replace(/\s+/g, '')}`;
        await prisma.user.upsert({
            where: { nim: advNim },
            update: {},
            create: {
                nim: advNim,
                password: 'securepassword',
                role: 'ADVOCACY_CHAIR',
                advocacyScope: 'UKM',
                ukmId: ukm.id
            }
        });
    }
    console.log(`✅ Data UKM & Ketua UKM berhasil dibuat.`)
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
