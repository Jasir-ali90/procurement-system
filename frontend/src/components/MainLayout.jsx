import { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ProfileSettingsModal from './ProfileSettingsModal';
import { AuthContext } from '../context/AuthContext';

export default function MainLayout({ children }) {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);

    // Never render sidebar or navbar on the login page or if user is unauthenticated
    if (!user || location.pathname === '/login') {
        return <>{children}</>;
    }

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: 'var(--bg-page)',
            position: 'relative'
        }}>
            {/* Mobile Backdrop */}
            {mobileSidebarOpen && (
                <div
                    onClick={() => setMobileSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(29, 7, 36, 0.65)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 940
                    }}
                    className="show-on-mobile"
                />
            )}

            {/* Sidebar */}
            <Sidebar
                isOpen={mobileSidebarOpen}
                onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                onOpenProfile={() => setProfileModalOpen(true)}
            />

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                overflowX: 'hidden'
            }}>
                <Navbar onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
                <main style={{ flex: 1, paddingBottom: '2.5rem' }}>
                    {children}
                </main>
            </div>

            {/* Global Profile Modal from Sidebar */}
            <ProfileSettingsModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
            />
        </div>
    );
}
