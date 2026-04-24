'use client';

import { useState } from 'react';

interface Props {
    userId: string;
    prodiId?: string | null;
    facultyId?: string | null;
    universityId?: string | null;
    prodiName?: string | null;
    facultyName?: string | null;
    universityName?: string | null;
    ukms: { id: string, name: string }[];
}

interface AspirationItem {
    id: number;
    level: string;
    ukmId?: string;
    title: string;
    content: string;
    evidenceUrl?: string;
}

const emptyItem = (id: number): AspirationItem => ({ id, level: 'PRODI', ukmId: '', title: '', content: '', evidenceUrl: '' });

export default function DashboardClient({ userId, prodiId, facultyId, universityId, prodiName, facultyName, universityName, ukms }: Props) {
    const [items, setItems] = useState<AspirationItem[]>([emptyItem(1)]);
    const [nextId, setNextId] = useState(2);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const levelTarget: Record<string, string> = {
        PRODI: prodiName || 'Program Studi Anda',
        FACULTY: facultyName || 'Fakultas Anda',
        UNIVERSITY: universityName || 'Universitas',
    };

    const updateItem = (id: number, field: keyof AspirationItem, value: string) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addItem = () => {
        if (items.length >= 10) return;
        setItems(prev => [...prev, emptyItem(nextId)]);
        setNextId(n => n + 1);
    };

    const removeItem = (id: number) => {
        if (items.length <= 1) return;
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const aspirations = items.map(item => ({
                title: item.title,
                content: item.content,
                level: item.level,
                studentId: userId,
                prodiId: item.level === 'PRODI' ? prodiId : null,
                facultyId: item.level === 'FACULTY' ? facultyId : null,
                universityId: item.level === 'UNIVERSITY' ? universityId : null,
                ukmId: item.level === 'UKM' ? item.ukmId : null,
                evidenceUrl: item.evidenceUrl || null,
            }));

            const endpoint = items.length === 1 ? '/api/aspirations' : '/api/aspirations/batch';
            const body = items.length === 1 ? aspirations[0] : { aspirations };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            let data;
            const text = await res.text();
            try { data = JSON.parse(text); } catch { throw new Error('Respon server tidak valid.'); }
            if (!res.ok) throw new Error(data?.error || 'Pengiriman gagal.');

            setStatus('success');
            setMessage(items.length === 1
                ? '✅ Aspirasi berhasil dikirim!'
                : `✅ ${items.length} aspirasi berhasil dikirim sekaligus! Terima kasih.`
            );
            setItems([emptyItem(nextId)]);
            setNextId(n => n + 1);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {status === 'success' && <div className="alert alert-success">{message}</div>}
            {status === 'error' && <div className="alert alert-error">⚠ {message}</div>}

            {items.map((item, index) => (
                <div key={item.id} style={{
                    border: '1.5px solid #dce2ef',
                    borderRadius: 8,
                    padding: '1rem',
                    marginBottom: '1rem',
                    background: index > 0 ? '#fafbff' : 'transparent',
                    position: 'relative',
                }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{
                            fontSize: '0.78rem', fontWeight: 700, color: '#1a3a6b',
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            #{index + 1} — Aspirasi
                        </span>
                        {items.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                style={{
                                    background: 'none', border: '1px solid #fca5a5',
                                    borderRadius: 6, color: '#dc2626', cursor: 'pointer',
                                    fontSize: '0.75rem', padding: '2px 8px', lineHeight: 1.5,
                                }}
                            >
                                ✕ Hapus
                            </button>
                        )}
                    </div>

                    {/* Level */}
                    <div className="form-group">
                        <label className="form-label">Level <span>*</span></label>
                        <select
                            className="form-select"
                            value={item.level}
                            onChange={e => updateItem(item.id, 'level', e.target.value)}
                        >
                            <option value="PRODI">Prodi — {levelTarget.PRODI}</option>
                            <option value="FACULTY">Fakultas — {levelTarget.FACULTY}</option>
                            <option value="UNIVERSITY">Universitas — {levelTarget.UNIVERSITY}</option>
                            <option value="UKM">Unit Kegiatan Mahasiswa (UKM)</option>
                        </select>
                    </div>

                    {item.level === 'UKM' && (
                        <div className="form-group">
                            <label className="form-label">Pilih UKM <span>*</span></label>
                            <select
                                className="form-select"
                                value={item.ukmId || ''}
                                onChange={e => updateItem(item.id, 'ukmId', e.target.value)}
                                required={item.level === 'UKM'}
                            >
                                <option value="">-- Pilih UKM --</option>
                                {ukms.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Title */}
                    <div className="form-group">
                        <label className="form-label">Judul <span>*</span></label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Ringkasan singkat permasalahan atau usulan Anda"
                            value={item.title}
                            onChange={e => updateItem(item.id, 'title', e.target.value)}
                            required
                            minLength={5}
                            maxLength={100}
                        />
                        <p className="char-count">{item.title.length}/100</p>
                    </div>

                    {/* Content */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Isi & Penjelasan <span>*</span></label>
                        <textarea
                            className="form-textarea"
                            placeholder="Jelaskan secara detail: apa yang terjadi, dampaknya, dan usulan solusinya..."
                            value={item.content}
                            onChange={e => updateItem(item.id, 'content', e.target.value)}
                            required
                            minLength={20}
                            maxLength={2000}
                            style={{ minHeight: 100 }}
                        />
                        <p className="char-count">{item.content.length}/2000</p>
                    </div>

                    {/* Evidence Photo */}
                    <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                        <label className="form-label">Foto Bukti (Opsional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    if (file.size > 2 * 1024 * 1024) {
                                        alert('Ukuran foto maksimal 2MB.');
                                        e.target.value = '';
                                        return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        updateItem(item.id, 'evidenceUrl', event.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                } else {
                                    updateItem(item.id, 'evidenceUrl', '');
                                }
                            }}
                            style={{ 
                                display: 'block', width: '100%', padding: '0.4rem', border: '1px solid #dce2ef', 
                                borderRadius: '6px', fontSize: '0.85rem', color: '#5a6480', background: '#fff' 
                            }}
                        />
                        <p style={{ fontSize: '0.7rem', color: '#8a95b0', marginTop: '0.3rem' }}>Format gambar (.jpg, .png), maks 2MB.</p>
                        {item.evidenceUrl && (
                            <img src={item.evidenceUrl} alt="Preview Bukti" style={{ marginTop: '0.75rem', maxHeight: '120px', borderRadius: '6px', border: '1px solid #e2e8f0', objectFit: 'cover' }} />
                        )}
                    </div>
                </div>
            ))}

            {/* Add more button */}
            {items.length < 10 && (
                <button
                    type="button"
                    onClick={addItem}
                    style={{
                        width: '100%', padding: '0.6rem', marginBottom: '1rem',
                        background: 'transparent', border: '1.5px dashed #c7d5f5',
                        borderRadius: 8, color: '#1a3a6b', cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    + Tambah Aspirasi Lagi ({items.length}/10)
                </button>
            )}

            <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={status === 'loading'}
                style={{ padding: '0.75rem' }}
            >
                {status === 'loading'
                    ? 'Mengirim...'
                    : items.length === 1
                        ? 'Kirim Aspirasi'
                        : `Kirim ${items.length} Aspirasi Sekaligus`
                }
            </button>

            <p style={{ fontSize: '0.75rem', color: '#8a95b0', textAlign: 'center', marginTop: '0.5rem' }}>
                Maksimal 10 aspirasi per pengiriman
            </p>
        </form>
    );
}
