'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Props {
    years: number[];
    selectedYear: number | null;
}

function YearFilterInner({ years, selectedYear }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleChange = (year: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (year === 'all') {
            params.delete('year');
        } else {
            params.set('year', year);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    const currentValue = selectedYear ? String(selectedYear) : 'all';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5a6480' }}>🗂 Arsip Tahun:</span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => handleChange('all')}
                    className="btn"
                    style={{
                        padding: '0.3rem 0.85rem',
                        fontSize: '0.8rem',
                        background: currentValue === 'all' ? '#1a3a6b' : 'transparent',
                        color: currentValue === 'all' ? '#fff' : '#5a6480',
                        border: `1.5px solid ${currentValue === 'all' ? '#1a3a6b' : '#dce2ef'}`,
                        borderRadius: 6,
                    }}
                >
                    Semua
                </button>
                {years.map((y) => (
                    <button
                        key={y}
                        onClick={() => handleChange(String(y))}
                        className="btn"
                        style={{
                            padding: '0.3rem 0.85rem',
                            fontSize: '0.8rem',
                            background: currentValue === String(y) ? '#1a3a6b' : 'transparent',
                            color: currentValue === String(y) ? '#fff' : '#5a6480',
                            border: `1.5px solid ${currentValue === String(y) ? '#1a3a6b' : '#dce2ef'}`,
                            borderRadius: 6,
                        }}
                    >
                        {y}
                    </button>
                ))}
            </div>
            {selectedYear && (
                <span style={{
                    fontSize: '0.75rem', padding: '2px 8px',
                    background: '#fef3c7', color: '#92400e',
                    borderRadius: 20, fontWeight: 600
                }}>
                    Menampilkan: {selectedYear}
                </span>
            )}
        </div>
    );
}

export default function YearFilter(props: Props) {
    return (
        <Suspense fallback={<div />}>
            <YearFilterInner {...props} />
        </Suspense>
    );
}
