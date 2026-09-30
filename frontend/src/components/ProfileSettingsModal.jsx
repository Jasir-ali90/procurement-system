import { useState, useContext, useRef, useEffect } from 'react';
import {
    User,
    Camera,
    Mail,
    Phone,
    Building2,
    Shield,
    DollarSign,
    KeyRound,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    Upload
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function ProfileSettingsModal({ isOpen, onClose }) {
    const { user, updateProfile, changePassword } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'

    // Profile state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');
    const fileInputRef = useRef(null);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
            setAvatarPreview(user.avatar ? `http://localhost:5000${user.avatar}` : '');
            setAvatarFile(null);
        }
        setProfileSuccess('');
        setProfileError('');
        setPasswordSuccess('');
        setPasswordError('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setProfileError('Avatar image must be under 5MB');
                return;
            }
            setAvatarFile(file);
            const objectUrl = URL.createObjectURL(file);
            setAvatarPreview(objectUrl);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');

        if (!name.trim()) {
            setProfileError('Full name cannot be empty');
            return;
        }

        try {
            setSavingProfile(true);
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('phone', phone.trim());
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            await updateProfile(formData);
            setProfileSuccess('Profile updated successfully!');
            setTimeout(() => setProfileSuccess(''), 3500);
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (!currentPassword || !newPassword) {
            setPasswordError('Please provide both current and new password');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirmation do not match');
            return;
        }

        try {
            setSavingPassword(true);
            await changePassword(currentPassword, newPassword);
            setPasswordSuccess('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(''), 3500);
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Password update failed');
        } finally {
            setSavingPassword(false);
        }
    };

    const getInitials = (n) => {
        if (!n) return 'U';
        return n.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ maxWidth: '580px', animation: 'slideUp 0.2s ease', padding: 0 }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'linear-gradient(135deg, var(--plum-950) 0%, var(--plum-800) 100%)',
                    color: '#FFFFFF',
                    borderTopLeftRadius: 'var(--radius-lg)',
                    borderTopRightRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(255, 126, 95, 0.2)',
                            border: '1px solid rgba(255, 126, 95, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FF7E5F'
                        }}>
                            <User size={22} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                                Account & Profile Settings
                            </h2>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255, 239, 234, 0.75)' }}>
                                Manage your personal credentials and avatar
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--plum-50)',
                    padding: '0 1.5rem'
                }}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                            padding: '0.85rem 1.25rem',
                            border: 'none',
                            background: 'transparent',
                            fontSize: '0.85rem',
                            fontWeight: activeTab === 'profile' ? 700 : 500,
                            color: activeTab === 'profile' ? 'var(--plum-900)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'profile' ? '3px solid var(--peach-500)' : '3px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <User size={16} />
                        Personal Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        style={{
                            padding: '0.85rem 1.25rem',
                            border: 'none',
                            background: 'transparent',
                            fontSize: '0.85rem',
                            fontWeight: activeTab === 'security' ? 700 : 500,
                            color: activeTab === 'security' ? 'var(--plum-900)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'security' ? '3px solid var(--peach-500)' : '3px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <KeyRound size={16} />
                        Security & Password
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileSubmit}>
                            {profileSuccess && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: '#ECFDF5',
                                    border: '1px solid #A7F3D0',
                                    borderRadius: '8px',
                                    color: '#059669',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <CheckCircle2 size={16} />
                                    {profileSuccess}
                                </div>
                            )}

                            {profileError && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    borderRadius: '8px',
                                    color: '#DC2626',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <AlertCircle size={16} />
                                    {profileError}
                                </div>
                            )}

                            {/* Avatar Upload Center */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.25rem',
                                padding: '1.25rem',
                                background: 'linear-gradient(135deg, var(--plum-50) 0%, rgba(255, 126, 95, 0.08) 100%)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--plum-200)',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ position: 'relative' }}>
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={user.name}
                                            style={{
                                                width: '76px',
                                                height: '76px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '3px solid #FFFFFF',
                                                boxShadow: '0 4px 14px rgba(44, 14, 54, 0.15)'
                                            }}
                                            onError={() => setAvatarPreview('')}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '76px',
                                            height: '76px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--plum-800), var(--peach-500))',
                                            color: '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.6rem',
                                            fontWeight: 800,
                                            boxShadow: '0 4px 14px rgba(44, 14, 54, 0.15)'
                                        }}>
                                            {getInitials(name || user.name)}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            position: 'absolute',
                                            bottom: '-2px',
                                            right: '-2px',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            background: 'var(--plum-800)',
                                            color: '#FFFFFF',
                                            border: '2px solid #FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}
                                    >
                                        <Camera size={14} />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--plum-950)', marginBottom: '0.2rem' }}>
                                        Profile Photo
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                                        Accepted formats: JPG, PNG, WEBP (Max 5MB)
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                        >
                                            <Upload size={13} style={{ marginRight: '0.35rem' }} />
                                            Upload Image
                                        </button>
                                        {avatarPreview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAvatarPreview('');
                                                    setAvatarFile(null);
                                                }}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: 'var(--danger)' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                                    Full Name *
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        required
                                        className="form-control"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        style={{ paddingLeft: '2.4rem' }}
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            </div>

                            {/* Email (Read-only) */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                    Email Address (Assigned by Administrator)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="email"
                                        disabled
                                        className="form-control"
                                        value={user.email}
                                        style={{ paddingLeft: '2.4rem', background: '#F8F7FA', cursor: 'not-allowed', color: 'var(--text-muted)' }}
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                                    Phone Number
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        style={{ paddingLeft: '2.4rem' }}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            {/* Role & Department Meta Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '0.75rem',
                                padding: '1rem',
                                background: '#F9F8FA',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-subtle)',
                                marginBottom: '1.5rem'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                                        Role
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--plum-900)', marginTop: '0.15rem' }}>
                                        {user.role}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                                        Department
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--plum-900)', marginTop: '0.15rem' }}>
                                        {user.department?.name || 'HQ / Unassigned'}
                                    </div>
                                </div>
                                {user.approvalLimit > 0 && (
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                                            Approval Limit
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#059669', marginTop: '0.15rem' }}>
                                            ${user.approvalLimit.toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" onClick={onClose} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="btn btn-primary"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--plum-800) 0%, var(--peach-600) 100%)',
                                        boxShadow: '0 4px 14px rgba(87, 28, 107, 0.25)'
                                    }}
                                >
                                    {savingProfile ? (
                                        <>
                                            <Loader2 size={16} className="spin" style={{ marginRight: '0.45rem' }} />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        'Save Profile'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handlePasswordSubmit}>
                            {passwordSuccess && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: '#ECFDF5',
                                    border: '1px solid #A7F3D0',
                                    borderRadius: '8px',
                                    color: '#059669',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <CheckCircle2 size={16} />
                                    {passwordSuccess}
                                </div>
                            )}

                            {passwordError && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    borderRadius: '8px',
                                    color: '#DC2626',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <AlertCircle size={16} />
                                    {passwordError}
                                </div>
                            )}

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                                    Current Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="form-control"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                                    New Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="form-control"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                                    Confirm New Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="form-control"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" onClick={onClose} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPassword}
                                    className="btn btn-primary"
                                    style={{ background: 'var(--plum-800)' }}
                                >
                                    {savingPassword ? (
                                        <>
                                            <Loader2 size={16} className="spin" style={{ marginRight: '0.45rem' }} />
                                            Updating Password...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
