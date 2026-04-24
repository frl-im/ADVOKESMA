import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import RecapCharts from './RecapCharts';
import YearFilter from './YearFilter';
import DocumentManager from './DocumentManager';

interface PageProps {
    searchParams: Promise<{ year?: string }>;
}

export default async function RecapPage({ searchParams }: PageProps) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken || !sessionToken.includes('advocacy')) redirect('/login');

    const userId = sessionToken.split(':')[0];
    const { year: yearParam } = await searchParams;
    const selectedYear = yearParam ? parseInt(yearParam, 10) : null;

    const chair = await db.user.findUnique({
        where: { id: userId },
        include: { prodi: { include: { faculty: { include: { university: true } } } }, ukm: true }
    });

    if (!chair || chair.role !== 'ADVOCACY_CHAIR') redirect('/login');

    async function archiveAspiration(formData: FormData) {
        "use server"
        const id = formData.get('id') as string;
        await db.aspiration.update({ where: { id }, data: { isArchived: true } });
        revalidatePath('/recap');
    }

    const chairAny = chair as any;
    const scope: string = chairAny.advocacyScope ?? 'UNIVERSITY';
    const prodiId = chair.prodi?.id ?? null;
    const facultyId = chair.prodi?.faculty?.id ?? null;
    const ukmId = chair.ukm?.id ?? null;

    const settings = await db.systemSettings.findUnique({ where: { id: "GLOBAL" } });

    // ── SCOPE FILTER & VISIBILITY TOGGLES ────────────────────────────
    let whereClause: any = {};
    if (scope === 'PRODI') {
        const orConditions: any[] = [{ level: 'PRODI', prodiId }];
        if (settings?.prodiCanSeeFaculty && facultyId) orConditions.push({ level: 'FACULTY', facultyId });
        if (settings?.prodiCanSeeUniversity) orConditions.push({ level: 'UNIVERSITY' });
        whereClause = { OR: orConditions };
    } else if (scope === 'FACULTY') {
        const orConditions: any[] = [{ level: 'FACULTY', facultyId }];
        if (settings?.facultyCanSeeProdi) orConditions.push({ level: 'PRODI', prodi: { facultyId } });
        if (settings?.facultyCanSeeUniversity) orConditions.push({ level: 'UNIVERSITY' });
        whereClause = { OR: orConditions };
    } else if (scope === 'UNIVERSITY') {
        const orConditions: any[] = [{ level: 'UNIVERSITY' }];
        if (settings?.universityCanSeeFaculty) orConditions.push({ level: 'FACULTY' });
        if (settings?.universityCanSeeProdi) orConditions.push({ level: 'PRODI' });
        whereClause = { OR: orConditions };
    } else if (scope === 'UKM') {
        whereClause = { level: 'UKM', ukmId };
    }

    // ── FETCH ALL (for archive year detection) ────────────────────────
    const allAspirations = await db.aspiration.findMany({
        where: whereClause,
        select: { createdAt: true },
    });

    // Available years derived from all data
    const yearSet = new Set(allAspirations.map((a: any) => new Date(a.createdAt).getFullYear()));
    const availableYears = Array.from(yearSet).sort((a, b) => b - a) as number[];

    // ── YEAR-FILTERED QUERY ───────────────────────────────────────────
    let finalWhere: any = { ...whereClause };
    if (selectedYear) {
        const start = new Date(selectedYear, 0, 1);
        const end = new Date(selectedYear + 1, 0, 1);
        finalWhere = { 
            AND: [
                { createdAt: { gte: start, lt: end } },
                whereClause
            ]
        };
    }

    const aspirations = await db.aspiration.findMany({
        where: finalWhere,
        orderBy: { createdAt: 'desc' },
        take: 500, // cap for performance
        include: {
            student: { include: { prodi: true } },
            prodi: true,
            faculty: true,
            university: true,
            ukm: true
        }
    });

    const myDocuments = await db.advocacyDocument.findMany({
        where: { uploaderId: userId },
        orderBy: { createdAt: 'desc' }
    });

    // ── AGGREGATE STATS ───────────────────────────────────────────────
    const levelCounts = { PRODI: 0, FACULTY: 0, UNIVERSITY: 0, UKM: 0 };
    aspirations.forEach((a: any) => {
        if (a.level in levelCounts) levelCounts[a.level as keyof typeof levelCounts]++;
    });

    // Most active prodi (or UKM if in UKM mode)
    const prodiMap: Record<string, number> = {};
    aspirations.forEach((a: any) => {
        const name = scope === 'UKM' ? (a.ukm?.name || 'Unknown UKM') : (a.prodi?.name ?? a.student?.prodi?.name ?? null);
        if (name) prodiMap[name] = (prodiMap[name] ?? 0) + 1;
    });
    const topProdi = Object.entries(prodiMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

    // Most recent a.k.a this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentCount = aspirations.filter((a: any) => new Date(a.createdAt) >= oneWeekAgo).length;

    // By month for chart
    const now = new Date();
    const monthMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        monthMap[key] = 0;
    }
    aspirations.forEach((a: any) => {
        const key = new Date(a.createdAt).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        if (key in monthMap) monthMap[key]++;
    });

    const byLevel = [
        { name: 'Prodi', total: levelCounts.PRODI, color: '#1a3a6b' },
        { name: 'Fakultas', total: levelCounts.FACULTY, color: '#7c3aed' },
        { name: 'Universitas', total: levelCounts.UNIVERSITY, color: '#e8a020' },
        { name: 'UKM', total: levelCounts.UKM, color: '#0ea5e9' }
    ].filter(l => l.total > 0);
    
    const byMonth = Object.entries(monthMap).map(([bulan, total]) => ({ bulan, total }));
    const byProdi = Object.entries(prodiMap)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

    const titleMap: Record<string, number> = {};
    aspirations.forEach((a: any) => {
        const t = a.title.trim();
        titleMap[t] = (titleMap[t] || 0) + 1;
    });
    const top10 = Object.entries(titleMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([title, count]) => ({ title, count }));

    const chartData = { byLevel, byMonth, byProdi, top10 };

    // ── GROUPING FOR TABLE ───────────────────────────────────────────
    let groupedAspirations: { groupName: string; items: any[] }[] = [];
    if (scope === 'UKM') {
        groupedAspirations = [{ groupName: `Data Khusus UKM: ${chair.ukm?.name}`, items: aspirations }];
    } else {
        const groups: Record<string, any[]> = {};
        aspirations.forEach((a: any) => {
            let groupName = 'Aspirasi Tidak Terklasifikasi';
            if (a.level === 'PRODI') groupName = a.prodi?.name || a.student?.prodi?.name || groupName;
            if (a.level === 'FACULTY') groupName = a.faculty?.name || a.student?.prodi?.faculty?.name || groupName;
            if (a.level === 'UNIVERSITY') groupName = 'Aspirasi Tingkat Universitas';
            if (a.level === 'UKM') groupName = a.ukm?.name || 'Aspirasi UKM';

            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(a);
        });
        groupedAspirations = Object.entries(groups).map(([name, items]) => ({ groupName: name, items }));
    }
    groupedAspirations.sort((a, b) => a.groupName.localeCompare(b.groupName));

    const scopeLabel: Record<string, string> = {
        PRODI: `Program Studi: ${chair.prodi?.name ?? '—'}`,
        FACULTY: `Fakultas: ${chair.prodi?.faculty?.name ?? '—'}`,
        UNIVERSITY: 'Seluruh Universitas',
        UKM: `Unit Kegiatan Mahasiswa: ${chair.ukm?.name ?? '—'}`,
    };

    const roleName = scope === 'PRODI' ? 'Ketua Advokasi Prodi'
        : scope === 'FACULTY' ? 'Ketua Advokasi Fakultas'
            : scope === 'UKM' ? 'Pengurus Internal UKM'
            : 'Kementrian Advokesma';

    return (
        <>
            <nav className="top-nav">
                <div className="nav-logo">
                    <div className="nav-logo-icon">U</div>
                    <div className="nav-logo-text">
                        <span className="nav-logo-title">Portal Aspirasi</span>
                        <span className="nav-logo-subtitle">kementrian Advokesma</span>
                    </div>
                </div>
                <div className="nav-right">
                    <div className="nav-user-info">
                        <div className="nav-user-name">{chair.nim}</div>
                        <div className="nav-user-role">{roleName}</div>
                    </div>
                    <a href="/api/auth/logout" className="btn btn-secondary">Keluar</a>
                </div>
            </nav>

            <main className="container page-main student-theme">
                <div className="page-header">
                    <h1>Rekapitulasi Aspirasi</h1>
                    <p>Pantau dan analisis aspirasi berdasarkan peran & visibilitas.</p>
                </div>

                <div className="scope-banner">
                    <span>Lingkup akses:</span>
                    <strong>{scopeLabel[scope]}</strong>
                    <span className="badge badge-scope" style={{ marginLeft: 'auto' }}>{roleName}</span>
                </div>

                <DocumentManager initialDocuments={myDocuments.map(d => ({
                    id: d.id,
                    title: d.title,
                    fileUrl: d.fileUrl,
                    createdAt: d.createdAt.toISOString()
                }))} />

                <div className="card mb-6">
                    <div className="card-header">
                        <h2 style={{ marginBottom: 0 }}>📋 Ringkasan Aspirasi</h2>
                        <span style={{ fontSize: '0.78rem', color: '#8a95b0' }}>
                            {selectedYear ? `Tahun ${selectedYear}` : 'Semua Tahun'}
                        </span>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ textAlign: 'center', padding: '1rem', background: '#f0f4ff', borderRadius: 8 }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1a3a6b' }}>{aspirations.length}</div>
                                <div style={{ fontSize: '0.75rem', color: '#5a6480', marginTop: '0.25rem', textTransform: 'uppercase' }}>Total Aspirasi</div>
                            </div>
                            
                            {levelCounts.PRODI > 0 && (
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#eef2ff', borderRadius: 8 }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1a3a6b' }}>{levelCounts.PRODI}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#5a6480', marginTop: '0.25rem', textTransform: 'uppercase' }}>Level Prodi</div>
                                </div>
                            )}
                            {levelCounts.FACULTY > 0 && (
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#f5f3ff', borderRadius: 8 }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7c3aed' }}>{levelCounts.FACULTY}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#5a6480', marginTop: '0.25rem', textTransform: 'uppercase' }}>Level Fakultas</div>
                                </div>
                            )}
                            {levelCounts.UNIVERSITY > 0 && (
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#fffbeb', borderRadius: 8 }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#e8a020' }}>{levelCounts.UNIVERSITY}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#5a6480', marginTop: '0.25rem', textTransform: 'uppercase' }}>Level Universitas</div>
                                </div>
                            )}
                            {levelCounts.UKM > 0 && (
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#f0f9ff', borderRadius: 8 }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0ea5e9' }}>{levelCounts.UKM}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#5a6480', marginTop: '0.25rem', textTransform: 'uppercase' }}>Level UKM</div>
                                </div>
                            )}
                            <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: 8 }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a' }}>{recentCount}</div>
                                <div style={{ fontSize: '0.75rem', color: '#5a6480', marginTop: '0.25rem', textTransform: 'uppercase' }}>7 Hari Terakhir</div>
                            </div>
                        </div>

                        {topProdi.length > 0 && (
                            <div>
                                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5a6480', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                                    {scope === 'UKM' ? 'UKM Teraktif' : 'Entitas Teraktif'}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {topProdi.map((item, i) => {
                                        const pct = aspirations.length > 0 ? Math.round((item.count / aspirations.length) * 100) : 0;
                                        return (
                                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a3a6b', width: 16 }}>#{i + 1}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                                                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                                                        <span style={{ color: '#5a6480' }}>{item.count} aspirasi ({pct}%)</span>
                                                    </div>
                                                    <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${pct}%`, background: '#1a3a6b', borderRadius: 3, transition: 'width 0.4s ease' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {aspirations.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#8a95b0', padding: '1rem', fontSize: '0.875rem' }}>
                                Tidak ada data aspirasi {selectedYear ? `untuk tahun ${selectedYear}` : ''} yang tersedia.
                            </p>
                        )}
                    </div>
                </div>

                 <div className="card mb-6">
                    <div className="card-header">
                        <h2 style={{ marginBottom: 0 }}>🗂 Arsip per Tahun</h2>
                    </div>
                    <div className="card-body">
                        {availableYears.length === 0 ? (
                            <p style={{ color: '#8a95b0', fontSize: '0.875rem' }}>Belum ada data untuk diarsipkan.</p>
                        ) : (
                            <YearFilter years={availableYears} selectedYear={selectedYear} />
                        )}
                    </div>
                </div>

                <div className="card mb-6">
                    <div className="card-header">
                        <h2 style={{ marginBottom: 0 }}>Daftar Aspirasi</h2>
                        <span className="badge badge-success">{aspirations.length} entri{selectedYear ? ` — ${selectedYear}` : ''}</span>
                    </div>
                    {aspirations.length === 0 ? (
                         <div className="empty-state" style={{ margin: '2rem 0' }}>
                            <div className="empty-state-icon">📭</div>
                            <p>Tidak ada daftar aspirasi.</p>
                        </div>
                    ) : (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '1.5rem' }}>
                            {groupedAspirations.map((group) => (
                                <div key={group.groupName} className="table-group-block">
                                    <h3 style={{ fontSize: '1.1rem', color: '#1a3a6b', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #eef2ff', fontWeight: 700 }}>
                                        📁 {group.groupName}
                                        <span style={{ fontSize: '0.85rem', color: '#8a95b0', fontWeight: 'normal', marginLeft: '0.75rem', background: '#f8faff', padding: '2px 8px', borderRadius: 12 }}>
                                            {group.items.length} aspirasi
                                        </span>
                                    </h3>
                                    <div className="table-wrap" style={{ margin: 0, border: '1px solid #eef2ff' }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Tanggal</th>
                                                    <th>Nim Mahasiswa</th>
                                                    <th>Status</th>
                                                    <th>Level</th>
                                                    <th>Ditujukan Ke</th>
                                                    <th>Judul Aspirasi</th>
                                                    <th>Isi (Ringkas)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.items.map((asp: any) => (
                                                    <tr key={asp.id}>
                                                        <td className="td-date">
                                                            {new Date(asp.createdAt).toLocaleDateString('id-ID', {
                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                            })}
                                                        </td>
                                                        <td className="td-nim">{asp.student?.nim || '—'}</td>
                                                        <td>
                                                            {asp.isArchived ? (
                                                                <span className="badge" style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px' }}>Disimpan</span>
                                                            ) : (
                                                                <form action={archiveAspiration}>
                                                                    <input type="hidden" name="id" value={asp.id} />
                                                                    <button type="submit" className="badge" style={{ background: '#fef08a', color: '#854d0e', border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Arsipkan</button>
                                                                </form>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-${asp.level.toLowerCase()}`}>
                                                                {asp.level === 'PRODI' ? 'Prodi' : asp.level === 'FACULTY' ? 'Fakultas' : asp.level === 'UKM' ? 'UKM' : 'Universitas'}
                                                            </span>
                                                        </td>
                                                        <td className="td-context">
                                                            {asp.level === 'PRODI' && (asp.prodi?.name || '—')}
                                                            {asp.level === 'FACULTY' && (asp.faculty?.name || '—')}
                                                            {asp.level === 'UNIVERSITY' && (asp.university?.name || '—')}
                                                            {asp.level === 'UKM' && (asp.ukm?.name || '—')}
                                                        </td>
                                                        <td className="td-title">{asp.title}</td>
                                                        <td className="td-content">
                                                            {asp.content.length > 80
                                                                ? `${asp.content.substring(0, 80)}…`
                                                                : asp.content}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                         </div>
                    )}
                </div>

                <div className="mt-6">
                    <h2 className="mb-4" style={{ fontSize: '1rem', color: '#5a6480', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        📊 Visualisasi Data Aspirasi
                    </h2>
                    <RecapCharts data={chartData} scope={scope} />
                </div>
            </main>

            <footer className="page-footer">
                © 2026 Portal Aspirasi Mahasiswa
            </footer>
        </>
    );
}
