import { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Menu,
    LogOut,
    KeyRound,
    User,
    ChevronDown,
    Settings,
    Shield,
    Sparkles
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import ProfileSettingsModal from './ProfileSettingsModal';
import ChangePasswordModal from './ChangePasswordModal';

export default function Navbar({ onToggleSidebar }) {
    const { user, logout } = useContext(AuthContext);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const userMenuRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    const getInitials = (n) => {
        if (!n) return 'U';
        return n.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <>
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 900,
                background: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--border-subtle)',
                boxShadow: '0 2px 12px rgba(44, 14, 54, 0.04)'
            }}>
                <div style={{
                    padding: '0.75rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    {/* Left: Mobile Toggle & Page Context */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <button
                            onClick={onToggleSidebar}
                            style={{
                                background: 'var(--plum-50)',
                                border: '1px solid var(--plum-200)',
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--plum-900)',
                                cursor: 'pointer'
                            }}
                            className="show-on-mobile"
                            title="Toggle Sidebar Menu"
                        >
                            <Menu size={20} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#FF7E5F',
                                boxShadow: '0 0 10px #FF7E5F'
                            }} />
                            <span style={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: 'var(--plum-950)',
                                letterSpacing: '-0.01em'
                            }}>
                                e-Procurement Enterprise Workspace
                            </span>
                            {user.department?.code && (
                                <span className="badge" style={{
                                    background: 'var(--plum-100)',
                                    color: 'var(--plum-900)',
                                    fontSize: '0.7rem',
                                    fontWeight: 700
                                }}>
                                    {user.department.code}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Notifications & User Profile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <NotificationDropdown />

                        {/* User Profile Pill */}
                        <div ref={userMenuRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.65rem',
                                    background: userMenuOpen ? 'var(--plum-50)' : '#FFFFFF',
                                    border: '1px solid ' + (userMenuOpen ? 'var(--plum-400)' : 'var(--border-subtle)'),
                                    borderRadius: 'var(--radius-full)',
                                    padding: '0.25rem 0.75rem 0.25rem 0.25rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                {user.avatar ? (
                                    <img
                                        src={`http://localhost:5000${user.avatar}`}
                                        alt={user.name}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '2px solid var(--peach-500)'
                                        }}
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--plum-800), var(--peach-500))',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.78rem'
                                    }}>
                                        {getInitials(user.name)}
                                    </div>
                                )}

                                <div style={{ textAlign: 'left', lineHeight: 1.2 }} className="hide-on-mobile">
                                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--plum-950)' }}>
                                        {user.name.split(' ')[0]}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                        {user.role}
                                    </div>
                                </div>
                                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                            </button>

                            {/* Dropdown Popover */}
                            {userMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: 'calc(100% + 8px)',
                                    width: '280px',
                                    background: '#FFFFFF',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-lg)',
                                    boxShadow: 'var(--shadow-xl)',
                                    zIndex: 999,
                                    overflow: 'hidden',
                                    animation: 'slideUp 0.15s ease'
                                }}>
                                    <div style={{
                                        padding: '1.1rem 1.25rem',
                                        background: 'linear-gradient(135deg, var(--plum-50) 0%, rgba(255, 126, 95, 0.08) 100%)',
                                        borderBottom: '1px solid var(--border-subtle)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                                            {user.avatar ? (
                                                <img
                                                    src={`http://localhost:5000${user.avatar}`}
                                                    alt={user.name}
                                                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, var(--plum-800), var(--peach-500))',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 800,
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {getInitials(user.name)}
                                                </div>
                                            )}
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--plum-950)' }}>
                                                    {user.name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                            <span className="badge badge-draft" style={{ fontSize: '0.7rem' }}>
                                                {user.role}
                                            </span>
                                            {user.department?.name && (
                                                <span className="badge" style={{ background: '#EDE9FE', color: '#5B21B6', border: '1px solid #DDD6FE', fontSize: '0.7rem' }}>
                                                    {user.department.code || user.department.name}
                                                </span>
                                            )}
                                        </div>

                                        {user.approvalLimit > 0 && (
                                            <div style={{
                                                marginTop: '0.65rem',
                                                padding: '0.35rem 0.6rem',
                                                background: '#FFFFFF',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-subtle)',
                                                fontSize: '0.75rem',
                                                color: 'var(--text-body)'
                                            }}>
                                                Approval Limit: <strong>${user.approvalLimit.toLocaleString()}</strong>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                setProfileModalOpen(true);
                                            }}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '0.65rem 0.85rem',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.65rem',
                                                fontSize: '0.8125rem',
                                                fontWeight: 600,
                                                color: 'var(--text-body)',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--plum-50)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <User size={16} style={{ color: 'var(--plum-700)' }} />
                                            Profile & Photo Settings
                                        </button>

                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                setPasswordModalOpen(true);
                                            }}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '0.65rem 0.85rem',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.65rem',
                                                fontSize: '0.8125rem',
                                                fontWeight: 600,
                                                color: 'var(--text-body)',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--plum-50)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <KeyRound size={16} style={{ color: 'var(--peach-600)' }} />
                                            Change Password
                                        </button>

                                        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.35rem 0' }} />

                                        <button
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                logout();
                                                navigate('/login');
                                            }}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '0.65rem 0.85rem',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.65rem',
                                                fontSize: '0.8125rem',
                                                fontWeight: 600,
                                                color: 'var(--danger)',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Profile Settings Modal */}
            <ProfileSettingsModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
            />

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
            />
        </>
    );
}