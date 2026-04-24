import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import '../admin.css';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const userInfoCookie = cookieStore.get('user-info')?.value;
    
    if (!userInfoCookie) {
        redirect('/login');
    }

    const user = JSON.parse(userInfoCookie);
    if (user.role !== 'ADMIN') {
        redirect('/unauthorized');
    }

    // Menggunakan tag styles dan id murni tanpa bergantung pada compiler Tailwind
    return (
        <div id="admin-root">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <div className="admin-sidebar-logo">A</div>
                    <h1 className="admin-sidebar-title">PORTAL Aspirasi</h1>
                </div>

                <div className="admin-sidebar-menu">
                    <div>
                        <div className="admin-menu-label">Administrator</div>
                        <nav className="admin-menu-list">
                            <Link href="/admin/users" className="admin-menu-item">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                Data Pengguna
                            </Link>
                            <Link href="/admin/settings" className="admin-menu-item">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                Pengaturan Sistem
                            </Link>
                        </nav>
                    </div>

                    <div style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                        <form action="/api/auth/logout" method="POST">
                            <button type="submit" className="admin-logout-btn">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                Keluar Aplikasi
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            <div className="admin-main-wrapper">
                <header className="admin-topbar">
                    <div className="admin-user-profile">
                        <div className="admin-user-text">
                            <h2 className="admin-user-name">Admin Utama</h2>
                            <p className="admin-user-role">Sistem Pusat</p>
                        </div>
                        <div className="admin-user-avatar">AU</div>
                    </div>
                </header>

                <main className="admin-content">
                    <div className="admin-container">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
