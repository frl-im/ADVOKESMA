import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Map the Himpunans into the realistic UNIMUS faculties
const FACULTY_DATA = [
    {
        name: 'FEB (Fakultas Ekonomi dan Bisnis)',
        prodis: ['himaaksi', 'hmjm']
    },
    {
        name: 'TEKNIK (Fakultas Teknik)',
        prodis: ['hmtm', 'hmti', 'hma', 'himadeka']
    },
    {
        name: 'ILKOMDIGI (Ilmu Komputer dan Digital)',
        prodis: ['hmik', 'himatikro']
    },
    {
        name: 'FSTP (Fakultas Sains dan Teknologi Pertanian)',
        prodis: ['himagri', 'himatepa', 'himafor', 'himadikmia', 'himatika', 'himasta', 'himasda']
    },
    {
        name: 'FIKKES (Fakultas Keperawatan dan Kesehatan)',
        prodis: ['himad3tlm', 'himastrtlm', 'himagi', 'himaraga', 'hmrs', 'himabidan']
    },
    {
        name: 'FK (Fakultas Kedokteran)',
        prodis: [] // If no explicit himpunan, leave empty to serve as faculty-only advocacy
    },
    {
        name: 'FKG (Fakultas Kedokteran Gigi)',
        prodis: []
    },
    {
        name: 'FIPH (Fakultas Ilmu Pendidikan dan Humaniora)',
        prodis: ['himapbi', 'himaprosa', 'himapersa']
    },
    {
        name: 'FKM (Fakultas Kesehatan Masyarakat)',
        prodis: ['himakesmas']
    }
]

function randomDate(startYear: number, endYear: number): Date {
    const start = new Date(startYear, 0, 1).getTime()
    const end = new Date(endYear, 11, 31).getTime()
    return new Date(start + Math.random() * (end - start))
}

const TITLES = [
    'Masalah Fasilitas Ruang Belajar', 'Dosen Pembimbing Akademik Sulit Ditemui', 'Koneksi WiFi Gedung Tidak Stabil', 
    'Akses Laboratorium Dibatasi Tanpa Alasan', 'Jadwal Kuliah Sering Berubah Mendadak', 'Buku Referensi Perpustakaan Kurang'
]

async function main() {
    console.log('🌱 Melakukan Seeding Data Asli Universitas Muhammadiyah Semarang...\n')

    const univ = await prisma.university.upsert({
        where: { name: 'Universitas Muhammadiyah Semarang' },
        update: {},
        create: { name: 'Universitas Muhammadiyah Semarang' },
    })

    // Advocacy Chair untuk Universitas / Kementrian Advokesma Pusat
    await prisma.user.upsert({
        where: { nim: 'BEM-UNIMUS' },
        update: {},
        create: {
            nim: 'BEM-UNIMUS',
            password: 'securepassword',
            role: 'ADVOCACY_CHAIR',
            advocacyScope: 'UNIVERSITY',
        },
    })
    console.log('✅ Ketua Advokasi BEM UNIMUS: BEM-UNIMUS')

    let prodiCounter = 0;

    for (let fi = 0; fi < FACULTY_DATA.length; fi++) {
        const fd = FACULTY_DATA[fi]
        const fId = `faculty-${fi + 1}`
        const faculty = await prisma.faculty.upsert({
            where: { id: fId },
            update: { name: fd.name },
            create: { id: fId, name: fd.name, universityId: univ.id },
        })

        // Advocacy Chair Fakultas (Gubernur Fakultas / Ketua Senat)
        const facNim = `BEM-${fd.name.split(' ')[0]}`
        await prisma.user.upsert({
            where: { nim: facNim },
            update: {},
            create: {
                nim: facNim,
                password: 'securepassword',
                role: 'ADVOCACY_CHAIR',
                advocacyScope: 'FACULTY',
                prodiId: null, // Connected dynamically via scope
            },
        })

        for (let pi = 0; pi < fd.prodis.length; pi++) {
            const pId = `prodi-${fi + 1}-${pi + 1}`
            const name = fd.prodis[pi].toUpperCase() // HIMAGRI, HMIK, etc.
            const prodi = await prisma.prodi.upsert({
                where: { id: pId },
                update: { name: name },
                create: { id: pId, name: name, facultyId: faculty.id },
            })

            // Akun Resmi Himpunan / Prodi (Ketua Advokasi, BUKAN Mahasiswa Umum)
            const advNim = name
            await prisma.user.upsert({
                where: { nim: advNim },
                update: {},
                create: {
                    nim: advNim,
                    password: 'securepassword',
                    role: 'ADVOCACY_CHAIR',
                    advocacyScope: 'PRODI',
                    prodiId: prodi.id,
                },
            })

            // Tambahkan satu dummy mahasiswa umum untuk prodi ini
            const studentNim = `MHS-${name}-001`
            const student = await prisma.user.upsert({
                where: { nim: studentNim },
                update: {},
                create: {
                    nim: studentNim,
                    password: 'password',
                    role: 'STUDENT',
                    prodiId: prodi.id,
                },
            })

            // Seed Aspirasi
            await prisma.aspiration.create({
                data: {
                    title: `[${prodi.name}] ${TITLES[Math.floor(Math.random()*TITLES.length)]}`,
                    content: `Kami mahasiswa ${prodi.name} melaporkan adanya kendala akademik yang perlu segera diberikan advokasi.`,
                    level: 'PRODI',
                    studentId: student.id,
                    prodiId: prodi.id,
                    createdAt: randomDate(2025, 2025),
                }
            })
            prodiCounter++
        }
    }

    console.log(`✅ Berhasil Mendaftarkan ${FACULTY_DATA.length} Fakultas dan ${prodiCounter} Himpunan Jurusan.`)
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
