import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import AdvocacyResultsView from './AdvocacyResultsView';
import { db } from '@/lib/db';

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken || sessionToken.includes('advocacy')) {
        redirect('/login');
    }

    const userId = sessionToken.split(':')[0];

    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            prodi: {
                include: {
                    faculty: {
                        include: { university: true }
                    }
                }
            }
        }
    });

    const ukms = await db.uKM.findMany({ select: { id: true, name: true } });

    if (!user || user.role !== 'STUDENT') redirect('/login');

    const prodiName = user.prodi?.name ?? null;
    const facultyName = user.prodi?.faculty?.name ?? null;
    const universityName = user.prodi?.faculty?.university?.name ?? null;

    const relevantDocs = await db.advocacyDocument.findMany({
        where: {
            OR: [
                { level: 'PRODI', prodiId: user.prodiId },
                { level: 'FACULTY', facultyId: user.prodi?.facultyId },
                { level: 'UNIVERSITY' },
                // If the user belongs to a UKM, also show UKM docs for that UKM
                ...(user.ukmId ? [{ level: 'UKM', ukmId: user.ukmId }] : [])
            ]
        },
        include: { uploader: { select: { nim: true } } },
        orderBy: { createdAt: 'desc' }
    });


    return (
        <>
            {/* Navbar */}
            <nav className="top-nav">
                <div className="nav-logo">
                    <div className="nav-logo-icon">U</div>
                    <div className="nav-logo-text">
                        <span className="nav-logo-title">Portal Aspirasi</span>
                        <span className="nav-logo-subtitle">Kementrian Advokesma</span>
                    </div>
                </div>
                <div className="nav-right">
                    <div className="nav-user-info">
                        <div className="nav-user-name">{user.nim}</div>
                        <div className="nav-user-role">Mahasiswa — {prodiName || '—'}</div>
                    </div>
                    <a href="/api/auth/logout" className="btn btn-secondary">Keluar</a>
                </div>
            </nav>

            <main className="container page-main">
                {/* Page Header */}
                <div className="page-header">
                    <h1>Dashboard Mahasiswa</h1>
                    <p>
                        Selamat datang! Anda terdaftar di <strong>{prodiName}</strong>,
                        {facultyName ? <> Fakultas <strong>{facultyName}</strong>,</> : null}
                        {universityName ? <> <strong>{universityName}</strong>.</> : '.'}
                    </p>
                </div>

                <div className="dashboard-grid">
                    {/* Guidelines */}
                    <div>
                        <h2 className="mb-4">Panduan Pengisian Aspirasi</h2>

                        <div className="info-card">
                            <h3>
                                <span className="badge badge-prodi" style={{ marginRight: '0.5rem' }}>Prodi</span>
                                Tingkat Program Studi
                            </h3>
                            <p>
                                Aspirasi spesifik terkait Himpunan Jurusan Anda (misal: Kurikulum prodi, kelengkapan alat Lab jurusan, atau kualitas pengajaran dosen program studi).
                            </p>
                        </div>

                        <div className="info-card faculty-card">
                            <h3>
                                <span className="badge badge-faculty" style={{ marginRight: '0.5rem' }}>Fakultas</span>
                                Tingkat Fakultas
                            </h3>
                            <p>
                                Aspirasi layanan BEM Fakultas secara luas. Contoh: fasilitas ruang bersama fakultas, sistem perizinan dekanat, atau anggaran himpunan.
                            </p>
                        </div>

                        <div className="info-card uni-card">
                            <h3>
                                <span className="badge badge-university" style={{ marginRight: '0.5rem' }}>Universitas</span>
                                Tingkat Universitas
                            </h3>
                            <p>
                                Aspirasi level teratas untuk Rektorat / BEM UNIMUS: Tagihan biaya UKT, kebijakan kampus secara umum, infrastruktur pusat, dan sistem akademik (SIA).
                            </p>
                        </div>
                    </div>

                    {/* Submission Form */}
                    <div className="card">
                        <div className="card-header">
                            <h2 style={{ marginBottom: 0 }}>Kirim Aspirasi Baru</h2>
                        </div>
                        <div className="card-body">
                            <DashboardClient
                                userId={user.id}
                                prodiId={user.prodi?.id}
                                facultyId={user.prodi?.facultyId}
                                universityId={user.prodi?.faculty?.universityId}
                                prodiName={prodiName}
                                facultyName={facultyName}
                                universityName={universityName}
                                ukms={ukms}
                            />
                        </div>
                    </div>
                </div>

                <AdvocacyResultsView documents={relevantDocs.map(d => ({
                    id: d.id,
                    title: d.title,
                    fileUrl: d.fileUrl,
                    createdAt: d.createdAt.toISOString(),
                    level: d.level,
                    uploader: { nim: d.uploader.nim }
                }))} />
            </main>

            <footer className="page-footer">
                © 2026 Portal Aspirasi Mahasiswa — Kementrian Advokesma
            </footer>
        </>
    );
}
