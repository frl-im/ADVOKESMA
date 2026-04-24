"use client";

import { useEffect, useState } from 'react';

type SystemSettings = {
    prodiCanSeeFaculty: boolean;
    prodiCanSeeUniversity: boolean;
    facultyCanSeeProdi: boolean;
    facultyCanSeeUniversity: boolean;
    universityCanSeeProdi: boolean;
    universityCanSeeFaculty: boolean;
};

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    const toggleSetting = (key: keyof SystemSettings) => {
        if (!settings) return;
        setSettings({ ...settings, [key]: !settings[key] });
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            alert("✅ Konfigurasi visibilitas tersimpan!");
        } catch (err) {
            alert("❌ Gagal menyimpan konfigurasi.");
        } finally {
            setIsSaving(false);
        }
    };

    const resetAspirations = async () => {
        if (!confirm("⚠️ PERINGATAN KRITIKAL! Data aspirasi publik (yang tidak diarsipkan oleh petugas) beserta seluruh akun mahasiswa standar akan dilenyapkan. Lanjutkan operasi ini?")) {
            return;
        }

        setIsResetting(true);
        try {
            const res = await fetch('/api/aspirations/reset', { method: 'DELETE' });
            if (res.ok) {
                alert("Operasi pembersihan sistem selesai. Data yang tak diarsip terhapus permanen.");
            } else {
                alert("Operasi gagal dieksekusi di pangkalan data.");
            }
        } catch (err) {
            alert("Koneksi gagal saat proses formating.");
        } finally {
            setIsResetting(false);
        }
    };

    if (isLoading) return (
        <div className="admin-card" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>Menyelaraskan node pengaturan...</div>
        </div>
    );
    if (!settings) return <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px', background: '#fef2f2', borderRadius: '12px' }}>Galat komunikasi server.</div>;

    const CustomToggle = ({ title, desc, stateKey }: { title: string, desc: string, stateKey: keyof SystemSettings }) => (
        <div className="admin-toggle-row">
            <div className="admin-toggle-text">
                <h4>{title}</h4>
                <p>{desc}</p>
            </div>
            <button 
                onClick={() => toggleSetting(stateKey)}
                className={`admin-toggle-btn ${settings[stateKey] ? 'admin-toggle-on' : 'admin-toggle-off'}`}
            >
                <span className={`admin-toggle-dot ${settings[stateKey] ? 'admin-toggle-dot-on' : 'admin-toggle-dot-off'}`} />
            </button>
        </div>
    );

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h2 className="admin-page-title">Pusat Otoritas & Visibilitas</h2>
                    <p className="admin-page-subtitle">Atur hak persilangan data antardewan dari layar sentral ini.</p>
                </div>
                <button 
                    onClick={saveSettings} 
                    disabled={isSaving}
                    className="admin-btn admin-btn-primary"
                >
                    {isSaving ? 'Sedang menulis...' : 'Terapkan Perubahan'}
                </button>
            </div>

            <div className="admin-card">
                <div style={{ padding: '24px 32px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Matrix Peraturan Lintas Institusi</h3>
                    <div style={{ borderTop: '1px solid #f1f5f9' }}>
                        <CustomToggle 
                            title="Penyerahan Hak Baca Fakultas" 
                            desc="Memperbolehkan tingkat Prodi untuk dapat melihat rekapitulasi pada tingkat Fakultas."
                            stateKey="prodiCanSeeFaculty" 
                        />
                        <CustomToggle 
                            title="Penyerahan Hak Baca Rektorat ke Prodi" 
                            desc="Memperbolehkan mahasiswa tingkat Prodi memantau aspirasi pusat universitas."
                            stateKey="prodiCanSeeUniversity" 
                        />
                        <CustomToggle 
                            title="Supervisi Top-Down (Fakutas ke Prodi)" 
                            desc="BEM Fakultas berhak menelusuri laporan individual himpunan jurusan."
                            stateKey="facultyCanSeeProdi" 
                        />
                        <CustomToggle 
                            title="Transparansi Pusat (Fakultas ke Universitas)" 
                            desc="Memperbolehkan Fakultas menelisik data pusat pelaporan Universitas."
                            stateKey="facultyCanSeeUniversity" 
                        />
                        <CustomToggle 
                            title="Audit Sentral Atas Institusi Basis (Prodi)" 
                            desc="Rektorat diberikan bypass utuh mengevaluasi jurusan secara langsung."
                            stateKey="universityCanSeeProdi" 
                        />
                        <CustomToggle 
                            title="Audit Sentral Atas Institusi Madya (Fakultas)" 
                            desc="Pusat advokasi diberi wewenang akses read-all pada fakultas mana pun."
                            stateKey="universityCanSeeFaculty" 
                        />
                    </div>
                </div>
            </div>

            <div className="admin-card" style={{ borderTop: '4px solid #ef4444' }}>
                <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ maxWidth: '600px' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            Penghancur Siklus Data Akademik (Khusus Admin)
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c', lineHeight: 1.6 }}>
                            Telah terintegrasi proteksi pintar. Tombol ini akan mereset portal sepenuhnya dengan menyikat seluruh <strong>Aspirasi Non-Arsip</strong> dan <strong>Akun Mahasiswa</strong>. Catatan yang telah diselamatkan oleh Ketua Advokasi tidak akan tersentuh. 
                        </p>
                    </div>
                    <button 
                        onClick={resetAspirations}
                        disabled={isResetting}
                        className="admin-btn admin-btn-danger"
                    >
                        {isResetting ? 'Membongkar pangkalan...' : 'Siklus Reset Ekstrim'}
                    </button>
                </div>
            </div>
        </div>
    );
}
