'use client';

import { useState } from 'react';

interface Document {
    id: string;
    title: string;
    fileUrl: string;
    createdAt: string;
}

interface Props {
    initialDocuments: Document[];
}

export default function DocumentManager({ initialDocuments }: Props) {
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        setMessage('');
        setError('');

        if (!title.trim()) {
            setError('Judul dokumen tidak boleh kosong.');
            setUploading(false);
            return;
        }

        if (!file) {
            setError('Pilih file PDF terlebih dahulu.');
            setUploading(false);
            return;
        }

        if (file.type !== 'application/pdf') {
            setError('Hanya format PDF yang diperbolehkan.');
            setUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);

        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload gagal');

            setDocuments(prev => [data, ...prev]);
            setMessage('Dokumen berhasil diunggah.');
            setTitle('');
            setFile(null);
            
            // Reset input file
            const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return;
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Gagal menghapus dokumen');
            }

            setDocuments(prev => prev.filter(d => d.id !== id));
            setMessage('Dokumen berhasil dihapus.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card mb-6">
            <div className="card-header">
                <h2 style={{ marginBottom: 0 }}>🗃️ Manajemen Dokumen Advokasi</h2>
                <span className="badge badge-primary">{documents.length}/3 Dokumen Terunggah</span>
            </div>
            <div className="card-body">
                <p style={{ color: '#5a6480', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Unggah hasil advokasi Anda (seperti MoU, Surat Edaran, atau rilis) agar dapat dilihat oleh mahasiswa (Maksimal 3 file berformat PDF, kapasitas tiap PDF max 5MB).
                </p>

                {error && <div className="alert alert-error mb-4">⚠ {error}</div>}
                {message && <div className="alert alert-success mb-4">{message}</div>}

                {/* Upload Form */}
                {documents.length < 3 ? (
                    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8faff', padding: '1rem', borderRadius: 8, border: '1px solid #eef2ff', marginBottom: '1.5rem' }}>
                        <div>
                            <label className="form-label">Judul Dokumen <span>*</span></label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Contoh: MoU Kenaikan UKT" 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required 
                            />
                        </div>
                        <div>
                            <label className="form-label">File PDF <span>*</span></label>
                            <input 
                                id="pdf-upload"
                                type="file" 
                                accept="application/pdf"
                                className="form-input" 
                                style={{ padding: '0.4rem' }}
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                required 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                            {uploading ? 'Mengunggah...' : 'Unggah Dokumen'}
                        </button>
                    </form>
                ) : (
                    <div className="alert alert-warning mb-4">
                         Anda telah mencapai batas maksimal 3 dokumen. Hapus dokumen lama untuk mengunggah yang baru.
                    </div>
                )}

                {/* Document List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {documents.map(doc => (
                        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #eef2ff', borderRadius: 8, background: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: '#fee2e2', color: '#ef4444', padding: '0.5rem', borderRadius: 8, fontWeight: 'bold' }}>
                                    PDF
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, color: '#1a3a6b', fontSize: '0.95rem' }}>{doc.title}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#8a95b0' }}>
                                        Diunggah pada {new Date(doc.createdAt).toLocaleDateString('id-ID')}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                                    Lihat
                                </a>
                                <button className="btn btn-secondary" onClick={() => handleDelete(doc.id)} disabled={loading} style={{ background: '#fee2e2', color: '#ef4444', borderColor: '#fca5a5', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                                    🗑️ Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                    {documents.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#8a95b0', padding: '2rem 0' }}>
                            Belum ada dokumen yang diunggah.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
