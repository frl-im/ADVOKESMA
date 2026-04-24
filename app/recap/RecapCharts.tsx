'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Cell
} from 'recharts';

interface ChartData {
    byLevel: { name: string; total: number; color: string }[];
    byMonth: { bulan: string; total: number }[];
    byProdi: { name: string; total: number }[];
    top10: { title: string; count: number }[];
}

interface Props {
    data: ChartData;
    scope: string;
}

const COLORS = ['#1a3a6b', '#7c3aed', '#e8a020', '#16a34a', '#dc2626', '#0891b2'];

const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#fff', border: '1px solid #dce2ef',
                borderRadius: 6, padding: '8px 12px', fontSize: '0.82rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>{label}</p>
                <p style={{ color: '#1a3a6b' }}>{payload[0].value} aspirasi</p>
            </div>
        );
    }
    return null;
};

export default function RecapCharts({ data, scope }: Props) {
    const isEmpty = data.byLevel.every(d => d.total === 0);

    if (isEmpty) {
        return (
            <div style={{
                textAlign: 'center', padding: '2.5rem', color: '#8a95b0',
                background: '#f8faff', borderRadius: 8, border: '1px dashed #dce2ef'
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <p>Belum ada data aspirasi untuk ditampilkan dalam grafik.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

            {/* ── Chart 1: By Level (Bar) ── */}
            <div className="card">
                <div className="card-header">
                    <h2 style={{ marginBottom: 0, fontSize: '0.95rem' }}>Aspirasi per Level</h2>
                </div>
                <div className="card-body" style={{ paddingTop: '0.75rem' }}>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.byLevel} barSize={36}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5a6480' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8a95b0' }} width={30} />
                            <Tooltip content={<CustomTooltipBar />} />
                            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                {data.byLevel.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {data.byLevel.map((item) => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                                <span style={{ color: '#5a6480' }}>{item.name}: <strong>{item.total}</strong></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Chart 2: Trend per Month (Line) ── */}
            <div className="card">
                <div className="card-header">
                    <h2 style={{ marginBottom: 0, fontSize: '0.95rem' }}>Tren per Bulan</h2>
                </div>
                <div className="card-body" style={{ paddingTop: '0.75rem' }}>
                    {data.byMonth.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data.byMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#5a6480' }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8a95b0' }} width={28} />
                                <Tooltip content={<CustomTooltipBar />} />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#1a3a6b"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#1a3a6b', r: 4 }}
                                    activeDot={{ r: 6, fill: '#e8a020' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#8a95b0', paddingTop: '3rem', fontSize: '0.85rem' }}>
                            Data tren belum tersedia
                        </div>
                    )}
                </div>
            </div>

            {/* ── Chart 3: By Prodi — Horizontal Bar (FACULTY/UNIVERSITY scope) ── */}
            {scope !== 'PRODI' && data.byProdi.length > 0 && (
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <div className="card-header">
                        <h2 style={{ marginBottom: 0, fontSize: '0.95rem' }}>Distribusi per Prodi</h2>
                        <span style={{ fontSize: '0.75rem', color: '#8a95b0' }}>Top {data.byProdi.length}</span>
                    </div>
                    <div className="card-body" style={{ paddingTop: '0.75rem' }}>
                        {/* Horizontal bar list — no label truncation issue */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            {data.byProdi.map((item, index) => {
                                const max = data.byProdi[0]?.total ?? 1;
                                const pct = Math.round((item.total / max) * 100);
                                return (
                                    <div key={item.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                                            <span style={{ fontWeight: 500, color: '#1a1e2e', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {item.name}
                                            </span>
                                            <span style={{ color: '#5a6480', flexShrink: 0 }}>{item.total} aspirasi</span>
                                        </div>
                                        <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${pct}%`,
                                                background: COLORS[index % COLORS.length],
                                                borderRadius: 4,
                                                transition: 'width 0.4s ease'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Chart 4: Top 10 Aspirations (All scopes) ── */}
            {data.top10.length > 0 && (
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <h2 style={{ marginBottom: 0, fontSize: '0.95rem' }}>Top {data.top10.length} Isu Aspirasi Terbanyak</h2>
                    </div>
                    <div className="card-body" style={{ paddingTop: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                            {data.top10.map((item, index) => {
                                const max = data.top10[0]?.count ?? 1;
                                const pct = Math.round((item.count / max) * 100);
                                return (
                                    <div key={index} style={{ padding: '0.75rem', background: '#f8faff', borderRadius: 8, border: '1px solid #eef2ff' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a3a6b', minWidth: 20 }}>#{index + 1}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#1a1e2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.title}>
                                                    {item.title}
                                                </h4>
                                                <div style={{ fontSize: '0.75rem', color: '#5a6480', marginTop: '0.1rem' }}>
                                                    {item.count} laporan
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${pct}%`,
                                                background: '#1a3a6b',
                                                borderRadius: 3,
                                                transition: 'width 0.4s ease'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
