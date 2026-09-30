import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div style={{
                minHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                color: 'var(--plum-700)'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--plum-800), var(--peach-500))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    animation: 'pulse 1.5s infinite'
                }}>
                    <Sparkles size={24} />
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-body)' }}>
                    Verifying authorization...
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

    return children;
}