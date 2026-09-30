import { useState, useEffect, useContext } from 'react';
import {
    Users,
    UserPlus,
    Search,
    Shield,
    KeyRound,
    UserCheck,
    UserX,
    Edit2,
    DollarSign,
    Building2,
    AlertCircle,
    CheckCircle2,
    X,
    RefreshCw,
    Lock
} from 'lucide-react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function AdminUsers() {
    const { user: currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');

    // Create User Modal
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Department User',
        department: '',
        approvalLimit: 0
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // Edit User Modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        role: 'Department User',
        department: '',
        approvalLimit: 0,
        isActive: true
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Reset Password Modal
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [targetUser, setTargetUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState('');
    const [resetError, setResetError] = useState('');

    // Notification toast
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4000);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, deptsRes] = await Promise.all([
                API.get('/users'),
                API.get('/departments')
            ]);
            setUsers(usersRes.data || []);
            setDepartments(deptsRes.data || []);
        } catch (err) {
            console.error('Failed to load users/departments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Create User Submit
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreateError('');
        if (!createForm.name || !createForm.email || !createForm.password) {
            setCreateError('Please provide name, email, and initial password.');
            return;
        }

        try {
            setCreateLoading(true);
            const res = await API.post('/users', createForm);
            setUsers([res.data, ...users]);
            setCreateModalOpen(false);
            setCreateForm({
                name: '',
                email: '',
                password: '',
                role: 'Department User',
                department: '',
                approvalLimit: 0
            });
            showToast(`User account created successfully for ${res.data.name}`);
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setCreateLoading(false);
        }
    };

    // Open Edit Modal
    const openEditModal = (u) => {
        setEditingUser(u);
        setEditForm({
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            role: u.role,
            department: u.department?._id || '',
            approvalLimit: u.approvalLimit || 0,
            isActive: u.isActive
        });
        setEditError('');
        setEditModalOpen(true);
    };

    // Edit User Submit
    const handleEditUser = async (e) => {
        e.preventDefault();
        setEditError('');
        try {
            setEditLoading(true);
            const roleChanged = editForm.role !== editingUser.role;
            const res = await API.put(`/users/${editingUser._id}`, editForm);
            setUsers(users.map(u => u._id === editingUser._id ? res.data : u));
            setEditModalOpen(false);
            if (roleChanged) {
                showToast(`Role changed to "${res.data.role}". A system notification has been dispatched to ${res.data.name}!`);
            } else {
                showToast(`User ${res.data.name} updated successfully`);
            }
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update user');
        } finally {
            setEditLoading(false);
        }
    };

    // Toggle Active / Inactive
    const handleToggleStatus = async (target) => {
        if (target._id === currentUser?._id) {
            alert('Cannot deactivate your own active admin account.');
            return;
        }

        const confirmMsg = target.isActive
            ? `Are you sure you want to deactivate ${target.name}? They will lose access immediately.`
            : `Reactivate account for ${target.name}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await API.patch(`/users/${target._id}/toggle-status`);
            setUsers(users.map(u => u._id === target._id ? { ...u, isActive: res.data.user.isActive } : u));
            showToast(res.data.message);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to toggle user status');
        }
    };

    // Open Reset Password Modal
    const openResetModal = (u) => {
        setTargetUser(u);
        setNewPassword('');
        setResetSuccess('');
        setResetError('');
        setResetModalOpen(true);
    };

    // Submit Password Reset
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetSuccess('');

        if (!newPassword || newPassword.length < 6) {
            setResetError('Password must be at least 6 characters.');
            return;
        }

        try {
            setResetLoading(true);
            const res = await API.put(`/users/${targetUser._id}/reset-password`, { newPassword });
            setResetSuccess(res.data.message);
            setTimeout(() => {
                setResetModalOpen(false);
            }, 1500);
        } catch (err) {
            setResetError(err.response?.data?.message || 'Password reset failed');
        } finally {
            setResetLoading(false);
        }
    };

    // Filtered Users List
    const filteredUsers = users.filter(u => {
        const matchesSearch = !searchQuery ||
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'All' || u.role === roleFilter;
        const matchesDept = deptFilter === 'All' || (u.department?._id === deptFilter);
        return matchesSearch && matchesRole && matchesDept;
    });

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'Admin':
                return { background: 'var(--plum-100)', color: 'var(--plum-900)', border: '1px solid var(--plum-300)' };
            case 'Procurement Manager':
                return { background: '#FFF1EB', color: 'var(--peach-700)', border: '1px solid #FFD6C9' };
            default:
                return { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' };
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            {/* Toast notification */}
            {toastMessage && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    background: 'var(--plum-950)',
                    color: '#FFFFFF',
                    padding: '0.85rem 1.4rem',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    animation: 'slideUp 0.2s ease'
                }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--peach-400)' }} />
                    {toastMessage}
                </div>
            )}

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.75rem'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, var(--plum-800), var(--peach-500))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF'
                        }}>
                            <Shield size={20} />
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                            User Administration & Roles
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Manage enterprise user credentials, department assignments, and financial approval thresholds.
                    </p>
                </div>

                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="btn btn-primary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, var(--plum-800), var(--peach-600))',
                        boxShadow: '0 4px 14px rgba(87, 28, 107, 0.25)'
                    }}
                >
                    <UserPlus size={16} />
                    Add New User
                </button>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.75rem'
            }}>
                <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL USERS</span>
                        <Users size={18} style={{ color: 'var(--plum-600)' }} />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                        {users.length}
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVE ACCOUNTS</span>
                        <UserCheck size={18} style={{ color: '#059669' }} />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                        {users.filter(u => u.isActive).length}
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>PROCUREMENT OFFICERS</span>
                        <Shield size={18} style={{ color: 'var(--peach-600)' }} />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                        {users.filter(u => u.role === 'Procurement Manager').length}
                    </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>SYSTEM ADMINS</span>
                        <Lock size={18} style={{ color: 'var(--plum-700)' }} />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                        {users.filter(u => u.role === 'Admin').length}
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="form-control"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2.35rem' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Role Filter */}
                    <select
                        className="form-control"
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        style={{ minWidth: '180px' }}
                    >
                        <option value="All">All Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="Procurement Manager">Procurement Manager</option>
                        <option value="Department User">Department User</option>
                    </select>

                    {/* Department Filter */}
                    <select
                        className="form-control"
                        value={deptFilter}
                        onChange={e => setDeptFilter(e.target.value)}
                        style={{ minWidth: '180px' }}
                    >
                        <option value="All">All Departments</option>
                        {departments.map(d => (
                            <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="card" style={{ overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <RefreshCw size={28} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--plum-600)' }} />
                        <p style={{ fontWeight: 600 }}>Loading users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Users size={36} style={{ color: 'var(--plum-300)', margin: '0 auto 1rem' }} />
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--plum-950)', marginBottom: '0.25rem' }}>
                            No users found
                        </h4>
                        <p style={{ fontSize: '0.875rem' }}>
                            No users matched your search or role filter.
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F8F7FA', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>USER</th>
                                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>ROLE</th>
                                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>DEPARTMENT</th>
                                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>APPROVAL LIMIT</th>
                                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>STATUS</th>
                                    <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                        {/* Avatar & User Details */}
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, var(--plum-700), var(--peach-500))',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    flexShrink: 0
                                                }}>
                                                    {getInitials(u.name)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--plum-950)', fontSize: '0.9rem' }}>
                                                        {u.name}
                                                        {u._id === currentUser?._id && (
                                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: 'var(--plum-600)', background: 'var(--plum-50)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                                                (You)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        {u.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <span style={{
                                                padding: '0.3rem 0.65rem',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                display: 'inline-block',
                                                ...getRoleBadgeStyle(u.role)
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>

                                        {/* Department */}
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            {u.department ? (
                                                <span className="badge" style={{ background: '#EDE9FE', color: '#5B21B6', border: '1px solid #DDD6FE' }}>
                                                    {u.department.name} ({u.department.code})
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>
                                            )}
                                        </td>

                                        {/* Approval Limit */}
                                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 700, color: u.approvalLimit > 0 ? 'var(--plum-900)' : 'var(--text-muted)' }}>
                                            {u.approvalLimit > 0 ? `$${u.approvalLimit.toLocaleString()}` : '$0'}
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.25rem 0.65rem',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: u.isActive ? '#ECFDF5' : '#FEF2F2',
                                                color: u.isActive ? '#059669' : '#DC2626',
                                                border: `1px solid ${u.isActive ? '#A7F3D0' : '#FECACA'}`
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.isActive ? '#059669' : '#DC2626' }} />
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    title="Edit User Details"
                                                    style={{
                                                        padding: '0.45rem',
                                                        background: 'var(--plum-50)',
                                                        border: '1px solid var(--plum-200)',
                                                        borderRadius: '6px',
                                                        color: 'var(--plum-800)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                </button>

                                                <button
                                                    onClick={() => openResetModal(u)}
                                                    title="Reset User Password"
                                                    style={{
                                                        padding: '0.45rem',
                                                        background: '#FFF5EB',
                                                        border: '1px solid #FFD6C9',
                                                        borderRadius: '6px',
                                                        color: 'var(--peach-700)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <KeyRound size={14} />
                                                </button>

                                                {u._id !== currentUser?._id && (
                                                    <button
                                                        onClick={() => handleToggleStatus(u)}
                                                        title={u.isActive ? 'Deactivate User' : 'Activate User'}
                                                        style={{
                                                            padding: '0.45rem',
                                                            background: u.isActive ? '#FEF2F2' : '#ECFDF5',
                                                            border: `1px solid ${u.isActive ? '#FECACA' : '#A7F3D0'}`,
                                                            borderRadius: '6px',
                                                            color: u.isActive ? '#DC2626' : '#059669',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE USER MODAL */}
            {createModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '520px', animation: 'slideUp 0.2s ease' }}>
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
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'var(--plum-800)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff'
                                }}>
                                    <UserPlus size={16} />
                                </div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    Create User Account
                                </h3>
                            </div>
                            <button onClick={() => setCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} style={{ padding: '1.5rem' }}>
                            {createError && (
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
                                    {createError}
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="form-control"
                                    placeholder="e.g. Johnathan Doe"
                                    value={createForm.name}
                                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="form-control"
                                    placeholder="john@company.com"
                                    value={createForm.email}
                                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                    Initial Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="form-control"
                                    placeholder="Minimum 6 characters"
                                    value={createForm.password}
                                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                        Role *
                                    </label>
                                    <select
                                        className="form-control"
                                        value={createForm.role}
                                        onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                                    >
                                        <option value="Department User">Department User</option>
                                        <option value="Procurement Manager">Procurement Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                        Department
                                    </label>
                                    <select
                                        className="form-control"
                                        value={createForm.department}
                                        onChange={e => setCreateForm({ ...createForm, department: e.target.value })}
                                    >
                                        <option value="">No Department</option>
                                        {departments.map(d => (
                                            <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                    Approval Limit ($)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    className="form-control"
                                    placeholder="0 for unrestricted / standard"
                                    value={createForm.approvalLimit}
                                    onChange={e => setCreateForm({ ...createForm, approvalLimit: e.target.value })}
                                />
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                    Applies when approving Purchase Requests (Separation of duties & limit checks).
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="btn btn-primary"
                                    style={{ background: 'linear-gradient(135deg, var(--plum-800), var(--peach-600))' }}
                                >
                                    {createLoading ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {editModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '520px', animation: 'slideUp 0.2s ease' }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--plum-50)'
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    Edit User Profile
                                </h3>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {editingUser?.email}
                                </div>
                            </div>
                            <button onClick={() => setEditModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditUser} style={{ padding: '1.5rem' }}>
                            {editError && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    borderRadius: '8px',
                                    color: '#DC2626',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.25rem'
                                }}>
                                    {editError}
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="form-control"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className="form-control"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="+1 555-0100"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                        Role
                                    </label>
                                    <select
                                        className="form-control"
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    >
                                        <option value="Department User">Department User</option>
                                        <option value="Procurement Manager">Procurement Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                    <span style={{ fontSize: '0.7rem', color: '#D84A28', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>
                                        Role changes will trigger instant notifications to the user.
                                    </span>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                        Department
                                    </label>
                                    <select
                                        className="form-control"
                                        value={editForm.department}
                                        onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                    >
                                        <option value="">No Department</option>
                                        {departments.map(d => (
                                            <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                    Approval Limit ($)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    className="form-control"
                                    value={editForm.approvalLimit}
                                    onChange={e => setEditForm({ ...editForm, approvalLimit: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <input
                                    type="checkbox"
                                    id="isActiveCheckbox"
                                    checked={editForm.isActive}
                                    onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--plum-800)', cursor: 'pointer' }}
                                />
                                <label htmlFor="isActiveCheckbox" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                                    Account is Active (Allow system sign-in)
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setEditModalOpen(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="btn btn-primary"
                                    style={{ background: 'linear-gradient(135deg, var(--plum-800), var(--peach-600))' }}
                                >
                                    {editLoading ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL */}
            {resetModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '440px', animation: 'slideUp 0.2s ease' }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#FFF5EB'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'var(--peach-600)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff'
                                }}>
                                    <KeyRound size={16} />
                                </div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    Reset Password
                                </h3>
                            </div>
                            <button onClick={() => setResetModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleResetPassword} style={{ padding: '1.5rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                Specify a new password for <strong>{targetUser?.name}</strong> ({targetUser?.email}).
                            </p>

                            {resetSuccess && (
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
                                    {resetSuccess}
                                </div>
                            )}

                            {resetError && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    borderRadius: '8px',
                                    color: '#DC2626',
                                    fontSize: '0.85rem',
                                    marginBottom: '1.25rem'
                                }}>
                                    {resetError}
                                </div>
                            )}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                    New Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="form-control"
                                    placeholder="Enter at least 6 characters"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" onClick={() => setResetModalOpen(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="btn btn-primary"
                                    style={{ background: 'var(--plum-800)' }}
                                >
                                    {resetLoading ? 'Resetting...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
