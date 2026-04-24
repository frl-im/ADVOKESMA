"use client";

import { useEffect, useState } from 'react';

type UserData = {
    id: string;
    nim: string;
    role: string;
    advocacyScope: string | null;
    prodi?: { id: string, name: string } | null;
    ukm?: { id: string, name: string } | null;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [metadata, setMetadata] = useState<any>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    
    // File upload
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        nim: '',
        password: '',
        role: 'STUDENT',
        advocacyScope: 'PRODI',
        prodiId: '',
        ukmId: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, metaRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/metadata')
            ]);
            setUsers(await usersRes.json());
            setMetadata(await metaRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string, nim: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus pengguna dengan NIM ${nim}?`)) return;
        try {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (e) {
            alert('Gagal menghapus user');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nim: formData.nim,
                    password: formData.password,
                    role: formData.role,
                    advocacyScope: formData.role === 'ADVOCACY_CHAIR' ? formData.advocacyScope : null,
                    prodiId: formData.advocacyScope !== 'UKM' && formData.role !== 'ADMIN' ? formData.prodiId : null,
                    ukmId: formData.advocacyScope === 'UKM' && formData.role === 'ADVOCACY_CHAIR' ? formData.ukmId : null
                })
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Gagal membuat user');
                return;
            }

            setIsModalOpen(false);
            setFormData({ nim: '', password: '', role: 'STUDENT', advocacyScope: 'PRODI', prodiId: '', ukmId: '' });
            fetchData();
        } catch (e) {
            alert('Gagal membuat');
        }
    };

    const handleCsvUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvFile) return;

        setIsUploading(true);
        try {
            const fileReader = new FileReader();
            fileReader.onload = async (event) => {
                const text = event.target?.result as string;
                if (!text) return;
                
                // Parse extremely basic CSV: nim,password,prodi_id
                const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.toLowerCase().includes('nim'));
                
                const payloads = lines.map(line => {
                    const [nim, password, prodiId] = line.split(',');
                    return { nim, password, prodiId: prodiId || null };
                });

                // Batch API Endpoint is assumed to be ready
                const res = await fetch('/api/users/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ users: payloads })
                });

                if (res.ok) {
                    alert('Data mahasiswa berhasil diimpor!');
                    setIsUploadModalOpen(false);
                    fetchData();
                } else {
                    const r = await res.json();
                    alert(`Gagal impor: ${r.error}`);
                }
                setIsUploading(false);
            };
            fileReader.readAsText(csvFile);
        } catch(e) {
            alert('Terjadi kesalahan baca file CSV.');
            setIsUploading(false);
        }
    };

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Pengguna Sistem</h2>
                    <p className="admin-page-subtitle">Kelola akses, peran, dan delegasi dari database pengguna.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setIsUploadModalOpen(true)} className="admin-btn admin-btn-secondary">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        Impor CSV
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="admin-btn admin-btn-primary">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Tambah Manual
                    </button>
                </div>
            </div>

            <div className="admin-card">
                {isLoading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Memuat database...</div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Kredensial Login</th>
                                    <th>Role Akses</th>
                                    <th>Afiliasi / Scope</th>
                                    <th style={{ textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, idx) => (
                                    <tr key={user.id}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{user.nim}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{user.id.substring(0, 8)}...</div>
                                        </td>
                                        <td>
                                            {user.role === 'ADMIN' && <span className="admin-badge admin-badge-admin">Admin Pusat</span>}
                                            {user.role === 'ADVOCACY_CHAIR' && (
                                                <span className="admin-badge admin-badge-petugas">
                                                    {user.advocacyScope === 'UNIVERSITY' ? 'Kementrian Advokesma' :
                                                     user.advocacyScope === 'FACULTY' ? 'Petugas BEM Fakultas' :
                                                     user.advocacyScope === 'PRODI' ? 'Petugas HMJ' :
                                                     user.advocacyScope === 'UKM' ? 'Petugas UKM' : 'Petugas BEM'}
                                                </span>
                                            )}
                                            {user.role === 'STUDENT' && <span className="admin-badge admin-badge-mahasiswa">Mahasiswa</span>}
                                        </td>
                                        <td>
                                            {user.role === 'ADMIN' ? (
                                                <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Sistem Global</span>
                                            ) : user.advocacyScope === 'UKM' ? (
                                                user.ukm?.name
                                            ) : (
                                                user.prodi?.name || 'Seluruh Universitas'
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {user.role !== 'ADMIN' && (
                                                <button 
                                                    onClick={() => handleDelete(user.id, user.nim)}
                                                    className="admin-btn-icon"
                                                    title="Hapus Pengguna"
                                                >
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                            Pangkalan data masih kosong.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Tambah Manual */}
            {isModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="admin-modal-header">
                            <h3 className="admin-modal-title">Pendaftaran Manual</h3>
                            <button className="admin-btn-icon" onClick={() => setIsModalOpen(false)}>
                                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="admin-form-group">
                                    <label className="admin-label">NIM Terdaftar</label>
                                    <input required type="text" value={formData.nim} onChange={e => setFormData({...formData, nim: e.target.value})} className="admin-input" placeholder="Masukkan NIM..." />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">Kata Sandi</label>
                                    <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="admin-input" />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">Jabatan (Role)</label>
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="admin-input" style={{ cursor: 'pointer' }}>
                                        <option value="STUDENT">Mahasiswa Standar</option>
                                        <option value="ADVOCACY_CHAIR">Petugas / Advokasi</option>
                                        <option value="ADMIN">Superuser Admin</option>
                                    </select>
                                </div>

                                {formData.role === 'ADVOCACY_CHAIR' && (
                                    <div className="admin-form-group">
                                        <label className="admin-label">Domain Scope</label>
                                        <select value={formData.advocacyScope} onChange={e => setFormData({...formData, advocacyScope: e.target.value})} className="admin-input" style={{ cursor: 'pointer' }}>
                                            <option value="PRODI">Himpunan Program Studi</option>
                                            <option value="FACULTY">BEM Fakultas</option>
                                            <option value="UNIVERSITY">BEM Universitas</option>
                                            <option value="UKM">Unit Kegiatan Mahasiswa</option>
                                        </select>
                                    </div>
                                )}

                                {(formData.role === 'STUDENT' || (formData.role === 'ADVOCACY_CHAIR' && formData.advocacyScope !== 'UKM')) && metadata?.prodis && (
                                    <div className="admin-form-group">
                                        <label className="admin-label">Program Studi</label>
                                        <select value={formData.prodiId} onChange={e => setFormData({...formData, prodiId: e.target.value})} className="admin-input" style={{ cursor: 'pointer' }}>
                                            <option value="">-- Tetapkan Prodi --</option>
                                            {metadata.prodis.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {formData.role === 'ADVOCACY_CHAIR' && formData.advocacyScope === 'UKM' && metadata?.ukms && (
                                    <div className="admin-form-group">
                                        <label className="admin-label">Nama Organisasi UKM</label>
                                        <select value={formData.ukmId} onChange={e => setFormData({...formData, ukmId: e.target.value})} className="admin-input" style={{ cursor: 'pointer' }}>
                                            <option value="">-- Pilih Organisasi --</option>
                                            {metadata.ukms.map((u: any) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="admin-modal-actions">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn admin-btn-secondary">Batalkan</button>
                                    <button type="submit" className="admin-btn admin-btn-primary">Daftarkan Entitas</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Impor CSV */}
            {isUploadModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="admin-modal-header">
                            <h3 className="admin-modal-title">Impor Data Massal (Excel/CSV)</h3>
                            <button className="admin-btn-icon" onClick={() => setIsUploadModalOpen(false)}>
                                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            <form onSubmit={handleCsvUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                                    Unggah file CSV dengan format kolom murni (tanpa header tabel). 
                                </div>
                                <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                                    <strong style={{ color: '#0f172a' }}>Format Wajib: </strong><br/>
                                    <code>NIM, Kata Sandi, ID_Prodi(Opsional)</code><br/>
                                    <span style={{ color: '#94a3b8' }}>Contoh: 1111222, rahasia1, f55ab1c...</span>
                                </div>
                                
                                <label className="admin-importer-box">
                                    <svg width="32" height="32" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" style={{ margin: '0 auto 12px auto' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                    <div style={{ fontWeight: 600, color: '#334155' }}>
                                        Klik &amp; Jelajahi File CSV
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Maksimum rekaman: 500 akun.</div>
                                    <input 
                                        type="file" 
                                        accept=".csv" 
                                        onChange={e => setCsvFile(e.target.files?.[0] || null)}
                                        style={{ display: 'none' }} 
                                    />
                                </label>
                                
                                {csvFile && (
                                    <div style={{ color: '#16a34a', fontSize: '14px', fontWeight: 500 }}>
                                        File terpilih: {csvFile.name}
                                    </div>
                                )}

                                <div className="admin-modal-actions">
                                    <button type="button" onClick={() => setIsUploadModalOpen(false)} className="admin-btn admin-btn-secondary">Batalkan</button>
                                    <button type="submit" disabled={!csvFile || isUploading} className="admin-btn admin-btn-primary">
                                        {isUploading ? 'Menyuntikkan Sistem...' : 'Mulai Eksekusi Data'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
