import { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Building2,
    Layers,
    FileCheck2,
    Truck,
    Star,
    BarChart3,
    Users,
    FolderKanban,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Settings,
    Shield
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Logo from './Logo';

export default function Sidebar({ isOpen, onToggle, onOpenProfile }) {
    const { user, logout, isAdmin, isProcurement } = useContext(AuthContext);
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    if (!user) return null;

    const sections = [
        {
            title: 'OPERATIONS',
            links: [
                { path: '/', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/purchase-requests', label: 'Purchase Requests', icon: FileText }
            ]
        },
        ...(isAdmin || isProcurement ? [
            {
                title: 'SOURCING & ORDERS',
                links: [
                    { path: '/vendors', label: 'Vendors Directory', icon: Building2 },
                    { path: '/rfqs', label: 'RFQs & Bids', icon: Layers },
                    { path: '/purchase-orders', label: 'Purchase Orders', icon: FileCheck2 },
                    { path: '/goods-receipt', label: 'Goods Receipt', icon: Truck },
                    { path: '/ratings', label: 'Vendor Ratings', icon: Star }
                ]
            }
        ] : []),
        {
            title: 'INTELLIGENCE',
            links: [
                { path: '/reports', label: 'Spend & Reports', icon: BarChart3 }
            ]
        },
        ...(isAdmin ? [
            {
                title: 'ADMINISTRATION',
                links: [
                    { path: '/admin/users', label: 'User Directory', icon: Users },
                    { path: '/admin/departments', label: 'Departments', icon: FolderKanban }
                ]
            }
        ] : [])
    ];

    const getInitials = (n) => {
        if (!n) return 'U';
        return n.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <aside
            style={{
                width: collapsed ? '78px' : '260px',
                minWidth: collapsed ? '78px' : '260px',
                height: '100vh',
                position: 'sticky',
                top: 0,
                zIndex: 950,
                background: 'linear-gradient(180deg, #1C0623 0%, #2A0936 50%, #17041D 100%)',
                borderRight: '1px solid rgba(255, 126, 95, 0.15)',
                boxShadow: '4px 0 24px rgba(28, 6, 35, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                userSelect: 'none'
            }}
            className={`app-sidebar ${isOpen ? 'mobile-open' : ''}`}
        >
            {/* Top Brand Header */}
            <div>
                <div style={{
                    padding: collapsed ? '1.25rem 0.75rem' : '1.25rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)'
                }}>
                    <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        <Logo
                            size={collapsed ? 36 : 34}
                            variant={collapsed ? 'iconOnly' : 'full'}
                            textColor="white"
                        />
                    </NavLink>

                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            title="Collapse Sidebar"
                            style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255, 239, 234, 0.8)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            className="hide-on-mobile"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    )}
                </div>

                {collapsed && (
                    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                        <button
                            onClick={() => setCollapsed(false)}
                            title="Expand Sidebar"
                            style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                width: '28px',
                                height: '28px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255, 239, 234, 0.8)',
                                cursor: 'pointer'
                            }}
                            className="hide-on-mobile"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {/* Nav Links List */}
                <div style={{ padding: '0.85rem 0.65rem', overflowY: 'auto', maxHeight: 'calc(100vh - 170px)' }}>
                    {sections.map((section, sIdx) => (
                        <div key={sIdx} style={{ marginBottom: '1.25rem' }}>
                            {!collapsed && (
                                <div style={{
                                    fontSize: '0.675rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.1em',
                                    color: 'rgba(255, 126, 95, 0.75)',
                                    padding: '0.35rem 0.75rem',
                                    textTransform: 'uppercase'
                                }}>
                                    {section.title}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {section.links.map(({ path, label, icon: Icon }) => (
                                    <NavLink
                                        key={path}
                                        to={path}
                                        title={collapsed ? label : undefined}
                                        style={({ isActive }) => ({
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: collapsed ? '0.75rem 0' : '0.65rem 0.85rem',
                                            justifyContent: collapsed ? 'center' : 'flex-start',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.825rem',
                                            fontWeight: isActive ? 700 : 500,
                                            textDecoration: 'none',
                                            color: isActive ? '#FFFFFF' : 'rgba(255, 239, 234, 0.72)',
                                            background: isActive
                                                ? 'linear-gradient(90deg, rgba(255, 126, 95, 0.22) 0%, rgba(138, 43, 170, 0.2) 100%)'
                                                : 'transparent',
                                            borderLeft: isActive ? '3px solid #FF7E5F' : '3px solid transparent',
                                            boxShadow: isActive ? '0 2px 10px rgba(255, 126, 95, 0.15)' : 'none',
                                            transition: 'all 0.15s ease'
                                        })}
                                        onMouseEnter={(e) => {
                                            if (!e.currentTarget.classList.contains('active')) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                                e.currentTarget.style.color = '#FFFFFF';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!e.currentTarget.classList.contains('active')) {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'rgba(255, 239, 234, 0.72)';
                                            }
                                        }}
                                    >
                                        <Icon size={18} style={{ flexShrink: 0, color: '#FF7E5F' }} />
                                        {!collapsed && <span>{label}</span>}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom User Card */}
            <div style={{
                padding: collapsed ? '0.75rem 0.5rem' : '0.85rem 1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(0, 0, 0, 0.2)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    gap: '0.65rem'
                }}>
                    {/* User Avatar & Info */}
                    <div
                        onClick={onOpenProfile}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            cursor: 'pointer',
                            flex: 1,
                            overflow: 'hidden'
                        }}
                        title="Click to view & edit profile"
                    >
                        {user.avatar ? (
                            <img
                                src={`http://localhost:5000${user.avatar}`}
                                alt={user.name}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid #FF7E5F',
                                    flexShrink: 0
                                }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        ) : (
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #FF7E5F, #8F32AE)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(255, 126, 95, 0.3)'
                            }}>
                                {getInitials(user.name)}
                            </div>
                        )}

                        {!collapsed && (
                            <div style={{ overflow: 'hidden', lineHeight: 1.2 }}>
                                <div style={{
                                    fontSize: '0.825rem',
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {user.name}
                                </div>
                                <div style={{
                                    fontSize: '0.68rem',
                                    color: '#FFA088',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {user.role}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Settings & Sign out */}
                    {!collapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                                onClick={onOpenProfile}
                                title="Profile Settings"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255, 239, 234, 0.75)',
                                    cursor: 'pointer',
                                    padding: '0.35rem',
                                    borderRadius: '6px'
                                }}
                            >
                                <Settings size={16} />
                            </button>
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                title="Sign Out"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#EF4444',
                                    cursor: 'pointer',
                                    padding: '0.35rem',
                                    borderRadius: '6px'
                                }}
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
