'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [nim, setNim] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nim, password }),
            });

            let data;
            const text = await res.text();
            try { data = JSON.parse(text); } catch {
                throw new Error('Server error. Pastikan server berjalan di folder yang benar.');
            }

            if (!res.ok) throw new Error(data?.error || 'Login gagal.');

            if (data.role === 'ADMIN') {
                router.push('/admin');
            } else if (data.role === 'ADVOCACY_CHAIR') {
                router.push('/recap');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="center-screen student-theme">
            <div className="login-wrap">
                <div className="login-card">
                    {/* Header */}
                    <div className="login-header">
                        <div className="login-logo">U</div>
                        <h1>Portal Aspirasi Mahasiswa</h1>
                        <p>Kementrian Advokesma — Sistem Aspirasi Digital</p>
                    </div>

                    {/* Body */}
                    <div className="login-body">
                        {error && (
                            <div className="alert alert-error">
                                ⚠ {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="nim">NIM / Kode Pengguna <span>*</span></label>
                                <input
                                    id="nim"
                                    className="form-input"
                                    type="text"
                                    value={nim}
                                    onChange={(e) => setNim(e.target.value)}
                                    placeholder="Contoh: 12345678"
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="password">Password <span>*</span></label>
                                <input
                                    id="password"
                                    className="form-input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password Anda"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-full mt-4"
                                disabled={isLoading}
                                style={{ padding: '0.75rem' }}
                            >
                                {isLoading ? 'Memverifikasi...' : 'Masuk'}
                            </button>
                        </form>


                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                    © 2026 Kementrian Advokesma — Portal Aspirasi Mahasiswa
                </p>
            </div>
        </div>
    );
}
