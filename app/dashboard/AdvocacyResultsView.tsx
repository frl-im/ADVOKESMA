'use client';

interface Document {
    id: string;
    title: string;
    fileUrl: string;
    createdAt: string;
    level: string;
    uploader: { nim: string };
}

interface Props {
    documents: Document[];
}

export default function AdvocacyResultsView({ documents }: Props) {
    if (documents.length === 0) return null;

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2 className="mb-4">📜 Hasil Advokasi (Dokumen & MoU)</h2>
            <div className="card">
                <div className="card-header">
                    <h3 style={{ marginBottom: 0, fontSize: '1.1rem' }}>Dokumen Tersedia</h3>
                </div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {documents.map(doc => (
                            <div key={doc.id} style={{ border: '1px solid #eef2ff', borderRadius: 8, padding: '1rem', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span className={`badge badge-${doc.level.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                                            {doc.level === 'PRODI' ? 'Prodi' : doc.level === 'FACULTY' ? 'Fakultas' : doc.level === 'UKM' ? 'UKM' : 'Universitas'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#8a95b0' }}>
                                            {new Date(doc.createdAt).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#1a3a6b', fontSize: '0.95rem', lineHeight: 1.4 }}>
                                        {doc.title}
                                    </h4>
                                    <p style={{ fontSize: '0.8rem', color: '#5a6480', margin: 0 }}>
                                        Diunggah oleh: {doc.uploader.nim}
                                    </p>
                                </div>
                                <a 
                                    href={doc.fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="btn btn-secondary" 
                                    style={{ marginTop: '1rem', display: 'block', textAlign: 'center', padding: '0.5rem' }}
                                >
                                    📥 Unduh / Buka PDF
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
