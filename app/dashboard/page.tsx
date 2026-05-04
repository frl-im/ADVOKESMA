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

                        <div className="info-card mb-4" style={{ padding: '1rem', background: '#f8faff', border: '1px solid #eef2ff', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#1a3a6b', display: 'flex', alignItems: 'center' }}>
                                <span className="badge badge-prodi" style={{ marginRight: '0.5rem' }}>Prodi</span>
                                Isu Program Studi
                            </h3>
                            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <li>Jadwal Kuliah, Kurikulum, Biaya Akademik, Sistem KRS dan KHS, pembimbing akademik</li>
                                <li>Praktik Laboratorium dan fasilitas prodi seperti alat lab, ketersediaan bahan praktikum, dll</li>
                                <li>Program pengembangan mahasiswa di Tingkat jurusan seperti seminar jurusan, workshop, dll</li>
                                <li>Isu-isu yang belum disebutkan tapi masih dalam cangkupan Tanggung jawab Prodi</li>
                            </ul>
                        </div>

                        <div className="info-card mb-4" style={{ padding: '1rem', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#7c3aed', display: 'flex', alignItems: 'center' }}>
                                <span className="badge badge-faculty" style={{ marginRight: '0.5rem' }}>Fakultas</span>
                                Isu Fakultas
                            </h3>
                            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <li>Sarana dan Prasarana Fakultas</li>
                                <li>Kebijakan Fakultas</li>
                                <li>Sistem administrasi</li>
                                <li>Isu-isu yang belum disebutkan tapi dalam cangkupan Tanggung jawab Fakultas</li>
                            </ul>
                        </div>

                        <div className="info-card mb-4" style={{ padding: '1rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#d97706', display: 'flex', alignItems: 'center' }}>
                                <span className="badge badge-university" style={{ marginRight: '0.5rem' }}>Universitas</span>
                                Isu Universitas
                            </h3>
                            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <li>Kebijakan Universitas</li>
                                <li>Perpustakaan Pusat</li>
                                <li>Sarana Olahraga</li>
                                <li>Layanan Kesehatan mahasiswa</li>
                                <li>Infrastruktur kampus yang mendukung kegiatan akademik</li>
                                <li>Isu-isu yang belum disebutkan tapi dalam cangkupan Tanggung jawab Universitas</li>
                            </ul>
                        </div>

                        <div className="info-card" style={{ padding: '1rem', background: '#f0f9ff', border: '1px solid #e0f2fe', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#0369a1', display: 'flex', alignItems: 'center' }}>
                                <span className="badge badge-ukm" style={{ marginRight: '0.5rem', background: '#bae6fd', color: '#0369a1' }}>UKM</span>
                                Isu UKM
                            </h3>
                            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <li>Sarana dan prasarana UKM</li>
                                <li>Kebijakan Universitas Mengenai UKM</li>
                                <li>Isu-isu yang belum disebutkan tapi dalam cangkupan UKM</li>
                            </ul>
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
