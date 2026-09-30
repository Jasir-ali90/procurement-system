import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Lock,
    Mail,
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    AlertCircle,
    Shield,
    Sparkles,
    MousePointerClick,
    RefreshCw
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Logo from '../components/Logo';
import PortalLoadingScreen from '../components/PortalLoadingScreen';
import ThreeDBackground from '../components/ThreeDBackground';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPortalLoader, setShowPortalLoader] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [activePill, setActivePill] = useState('');
    const [fillNotice, setFillNotice] = useState('');

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Quick Fill ONLY fills the input fields; user must click "Sign In" to proceed to loader
    const handleQuickFill = (userEmail, userPassword, roleName) => {
        setEmail(userEmail);
        setPassword(userPassword);
        setError('');
        setActivePill(roleName);
        setFillNotice(`Loaded ${roleName} credentials! Click "Sign In" below to enter.`);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setFillNotice('');
        setLoading(true);

        try {
            const data = await login(email, password);
            setLoggedInUser(data);
            // Trigger 10-second VIP portal loader as requested
            setShowPortalLoader(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid corporate email or password. Please verify credentials.');
            setLoading(false);
        }
    };

    const handleLoaderComplete = () => {
        navigate('/');
    };

    return (
        <>
            {/* 3D Animated Cosmos Canvas */}
            <ThreeDBackground />

            {/* 10-Second VIP Portal Loader */}
            {showPortalLoader && (
                <PortalLoadingScreen
                    user={loggedInUser}
                    onComplete={handleLoaderComplete}
                />
            )}

            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent', // Transparent so 3D background canvas shines through!
                padding: '1.5rem',
                position: 'relative',
                zIndex: 10,
                pointerEvents: 'none' // Allows canvas to receive mouse parallax movements
            }}>
                <div
                    style={{
                        width: '100%',
                        maxWidth: '1080px',
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(24px)',
                        borderRadius: '28px',
                        border: '1px solid rgba(255, 126, 95, 0.35)',
                        boxShadow: '0 30px 80px rgba(18, 2, 24, 0.65), 0 0 50px rgba(255, 126, 95, 0.22)',
                        overflow: 'hidden',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                        pointerEvents: 'auto' // Interactive form inside
                    }}
                >
                    {/* Left Brand Panel */}
                    <div style={{
                        background: 'linear-gradient(145deg, #1C0524 0%, #350D42 45%, #4C155E 75%, #D84A28 100%)',
                        color: '#FFFFFF',
                        padding: '3.25rem 2.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Ambient Glow Orbs */}
                        <div style={{
                            position: 'absolute',
                            top: '-60px',
                            right: '-60px',
                            width: '260px',
                            height: '260px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255, 126, 95, 0.45) 0%, transparent 70%)',
                            pointerEvents: 'none'
                        }} />

                        <div>
                            {/* Brand Header */}
                            <div style={{ marginBottom: '2.5rem' }}>
                                <Logo size={48} variant="full" textColor="white" />
                            </div>

                            <h2 style={{ fontSize: '1.95rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '1rem', color: '#fff' }}>
                                3D Intelligent Procurement & Vendor Management
                            </h2>
                            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 239, 234, 0.85)', lineHeight: 1.6, marginBottom: '2.25rem' }}>
                                Automated end-to-end procurement orchestration: department requisition approval matrices, side-by-side RFQ bidding, strict GRN non-overage validation, and executive spend intelligence.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {[
                                    'Role-Based Controls (Admin, Procurement & Department Users)',
                                    'Side-by-Side Quotation Comparison & Supplier Awards',
                                    'Strict Non-Overage Goods Receipt Note (GRN) Intake',
                                    'Gated Post-Delivery Vendor Performance Ratings (5★)',
                                    'Executive Spend Analytics & PDF / CSV Audit Exports'
                                ].map((feature, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.825rem', color: 'rgba(255, 255, 255, 0.95)' }}>
                                        <CheckCircle2 size={17} style={{ color: '#FF7E5F', flexShrink: 0 }} />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{
                            marginTop: '2.5rem',
                            paddingTop: '1.25rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'rgba(255, 239, 234, 0.7)'
                        }}>
                            <span>Enterprise Security Enabled</span>
                            <span style={{ color: '#FFA088', fontWeight: 700 }}>v2.4 Production</span>
                        </div>
                    </div>

                    {/* Right Login Form Panel */}
                    <div style={{ padding: '3.25rem 2.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ marginBottom: '1.75rem' }}>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.25rem 0.65rem',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--plum-100)',
                                color: 'var(--plum-900)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                marginBottom: '0.75rem'
                            }}>
                                <Shield size={13} style={{ color: 'var(--peach-600)' }} />
                                Single Sign-On Access
                            </span>
                            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--plum-950)', marginBottom: '0.35rem' }}>
                                Sign In to e-Procurement
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Click any demo role below to fill credentials, then click Sign In
                            </p>
                        </div>

                        {/* Fill Notice Banner */}
                        {fillNotice && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: '#FFF7ED',
                                border: '1px solid #FFEDD5',
                                borderRadius: 'var(--radius-md)',
                                color: '#C2410C',
                                fontSize: '0.825rem',
                                fontWeight: 600,
                                marginBottom: '1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                animation: 'fadeIn 0.2s ease'
                            }}>
                                <Sparkles size={16} style={{ color: '#FF7E5F', flexShrink: 0 }} />
                                <span>{fillNotice}</span>
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <div style={{
                                padding: '0.85rem 1rem',
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: 'var(--radius-md)',
                                color: '#DC2626',
                                fontSize: '0.85rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--plum-950)', marginBottom: '0.4rem' }}>
                                    Corporate Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="email"
                                        required
                                        className="form-control"
                                        placeholder="user@company.com"
                                        value={email}
                                        onChange={e => {
                                            setEmail(e.target.value);
                                            setActivePill('');
                                            setFillNotice('');
                                        }}
                                        style={{
                                            paddingLeft: '2.75rem',
                                            borderColor: activePill ? 'var(--peach-500)' : 'var(--border-subtle)',
                                            background: activePill ? '#FFF9F7' : '#FFFFFF',
                                            transition: 'all 0.2s ease'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--plum-950)' }}>
                                        Password
                                    </label>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="form-control"
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={e => {
                                            setPassword(e.target.value);
                                            setFillNotice('');
                                        }}
                                        style={{
                                            paddingLeft: '2.75rem',
                                            paddingRight: '2.75rem',
                                            borderColor: activePill ? 'var(--peach-500)' : 'var(--border-subtle)',
                                            background: activePill ? '#FFF9F7' : '#FFFFFF',
                                            transition: 'all 0.2s ease'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    background: 'linear-gradient(135deg, var(--plum-800) 0%, var(--peach-600) 100%)',
                                    boxShadow: activePill ? '0 6px 22px rgba(255, 126, 95, 0.45)' : '0 4px 18px rgba(87, 28, 107, 0.35)',
                                    cursor: 'pointer',
                                    transform: activePill ? 'scale(1.01)' : 'scale(1)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw size={18} className="spin" />
                                        Authenticating Corporate ID...
                                    </>
                                ) : (
                                    <>
                                        Sign In to e-Procurement
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Demo Pills: Click to Fill Inputs Only */}
                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '0.75rem'
                            }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--plum-900)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <MousePointerClick size={14} style={{ color: 'var(--peach-600)' }} />
                                    Click Role to Fill Credentials
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    (Click pill → then hit Sign In)
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                {[
                                    {
                                        role: 'System Admin',
                                        email: 'admin@local.com',
                                        badge: '#EDE9FE',
                                        badgeText: '#5B21B6'
                                    },
                                    {
                                        role: 'Procurement Officer',
                                        email: 'procurement@local.com',
                                        badge: '#FFF1EB',
                                        badgeText: '#D84A28'
                                    },
                                    {
                                        role: 'IT Dept Requester',
                                        email: 'user.it@local.com',
                                        badge: '#EFF6FF',
                                        badgeText: '#1D4ED8'
                                    },
                                    {
                                        role: 'Operations Requester',
                                        email: 'user.ops@local.com',
                                        badge: '#F3E8FF',
                                        badgeText: '#6B21A8'
                                    }
                                ].map((acc, idx) => {
                                    const isSelected = activePill === acc.role;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleQuickFill(acc.email, 'password123', acc.role)}
                                            disabled={loading}
                                            style={{
                                                padding: '0.65rem 0.75rem',
                                                background: isSelected ? 'var(--plum-50)' : '#FAF8FB',
                                                border: isSelected ? '2px solid var(--peach-500)' : '1px solid var(--plum-100)',
                                                borderRadius: 'var(--radius-md)',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={e => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = 'var(--peach-400)';
                                                    e.currentTarget.style.background = '#FFFFFF';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = 'var(--plum-100)';
                                                    e.currentTarget.style.background = '#FAF8FB';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                                    {acc.role}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.625rem',
                                                    fontWeight: 700,
                                                    padding: '0.1rem 0.35rem',
                                                    borderRadius: '4px',
                                                    background: isSelected ? 'var(--peach-500)' : acc.badge,
                                                    color: isSelected ? '#FFFFFF' : acc.badgeText
                                                }}>
                                                    {isSelected ? '✓ Loaded' : 'Fill'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                {acc.email}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}