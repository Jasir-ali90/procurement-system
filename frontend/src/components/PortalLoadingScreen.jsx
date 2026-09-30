import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import Logo from './Logo';
import API from '../api/axios';

export default function PortalLoadingScreen({ user, onComplete }) {
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);

    const statusMessages = [
        { title: 'Verifying Security Tokens', desc: `Authenticating ${user?.email || 'credentials'} & session tokens...` },
        { title: 'Synchronizing Departmental Budgets', desc: `Loading ${user?.department?.name || 'organization'} financial limits & approval matrices...` },
        { title: 'Pre-fetching Procurement Catalogs', desc: 'Caching active Purchase Requisitions, open RFQs, and vendor ratings...' },
        { title: 'Applying Enterprise Access Policies', desc: `Establishing security profile for role: ${user?.role || 'User'}...` },
        { title: 'Workspace Ready', desc: 'Welcome to e-Procurement Enterprise Suite!' }
    ];

    useEffect(() => {
        // Pre-warm data in background while loader runs
        Promise.all([
            API.get('/analytics/dashboard').catch(() => {}),
            API.get('/purchase-requests').catch(() => {}),
            API.get('/notifications').catch(() => {})
        ]);

        const durationMs = 10000; // 10 seconds
        const intervalMs = 50; // update every 50ms
        const totalSteps = durationMs / intervalMs;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const pct = Math.min(100, Math.round((step / totalSteps) * 100));
            setProgress(pct);

            const nextIndex = Math.min(
                statusMessages.length - 1,
                Math.floor((pct / 100) * statusMessages.length)
            );
            setStatusIndex(nextIndex);

            if (step >= totalSteps) {
                clearInterval(timer);
                setTimeout(() => {
                    onComplete();
                }, 400);
            }
        }, intervalMs);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'radial-gradient(circle at 50% 35%, #350D44 0%, #1D0624 60%, #120317 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            padding: '2rem',
            userSelect: 'none'
        }}>
            {/* Ambient Background Glow Orbs */}
            <div style={{
                position: 'absolute',
                width: '450px',
                height: '450px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 126, 95, 0.15) 0%, rgba(87, 28, 107, 0) 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none'
            }} />

            {/* Center Content Box */}
            <div style={{
                maxWidth: '520px',
                width: '100%',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10
            }}>
                {/* Logo & Glow */}
                <div style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        padding: '1.25rem',
                        borderRadius: '24px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 126, 95, 0.25)',
                        boxShadow: '0 8px 32px rgba(255, 126, 95, 0.2)',
                        marginBottom: '1rem',
                        animation: 'pulse 3s infinite ease-in-out'
                    }}>
                        <Logo size={58} variant="iconOnly" />
                    </div>

                    <h1 style={{
                        fontSize: '1.85rem',
                        fontWeight: 800,
                        letterSpacing: '-0.025em',
                        color: '#FFFFFF',
                        marginBottom: '0.25rem'
                    }}>
                        <span style={{ color: '#FF7E5F', fontStyle: 'italic' }}>e-</span>Procurement
                    </h1>
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 239, 234, 0.75)',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        fontWeight: 700
                    }}>
                        Enterprise Management Portal
                    </div>
                </div>

                {/* Progress Bar Container */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-full)',
                    height: '10px',
                    width: '100%',
                    padding: '2px',
                    position: 'relative',
                    marginBottom: '1.5rem',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{
                        height: '100%',
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(90deg, #7B1E8B 0%, #E05375 60%, #FF7E5F 100%)',
                        width: `${progress}%`,
                        transition: 'width 0.06s linear',
                        boxShadow: '0 0 16px rgba(255, 126, 95, 0.7)'
                    }} />
                </div>

                {/* Status Indicator */}
                <div style={{
                    minHeight: '75px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.925rem',
                        fontWeight: 700,
                        color: '#FFA088',
                        marginBottom: '0.3rem'
                    }}>
                        <ShieldCheck size={16} style={{ color: '#FF7E5F' }} />
                        {statusMessages[statusIndex].title} ({progress}%)
                    </div>
                    <div style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        lineHeight: 1.4
                    }}>
                        {statusMessages[statusIndex].desc}
                    </div>
                </div>

                {/* Skip Option */}
                <div style={{ marginTop: '2rem' }}>
                    <button
                        onClick={onComplete}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 'var(--radius-full)',
                            padding: '0.45rem 1.25rem',
                            color: 'rgba(255, 239, 234, 0.8)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 126, 95, 0.18)';
                            e.currentTarget.style.borderColor = '#FF7E5F';
                            e.currentTarget.style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                            e.currentTarget.style.color = 'rgba(255, 239, 234, 0.8)';
                        }}
                    >
                        Skip & Enter Workspace
                        <ArrowRight size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}
