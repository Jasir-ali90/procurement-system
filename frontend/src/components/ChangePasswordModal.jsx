import { useState, useContext } from 'react';
import { X, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function ChangePasswordModal({ isOpen, onClose }) {
    const { changePassword } = useContext(AuthContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            setSuccess('Password updated successfully!');
            setTimeout(() => {
                onClose();
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setSuccess('');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--plum-50)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                            background: 'var(--plum-100)',
                            color: 'var(--plum-700)',
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Lock size={18} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--plum-950)' }}>
                                Change Password
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Enhance your account security
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.3rem',
                            display: 'flex'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: 'var(--danger-bg)',
                            color: 'var(--danger-text)',
                            border: '1px solid var(--danger-border)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem',
                            fontSize: '0.8125rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: 'var(--success-bg)',
                            color: 'var(--success-text)',
                            border: '1px solid var(--success-border)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem',
                            fontSize: '0.8125rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <CheckCircle2 size={16} />
                            {success}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input
                            type="password"
                            required
                            className="form-input"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            placeholder="Enter your current password"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="form-input"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="form-input"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your new password"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Saving...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
