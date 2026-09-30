import { useState, useEffect } from 'react';
import {
    FolderKanban,
    Plus,
    Building2,
    Edit2,
    CheckCircle2,
    AlertCircle,
    X,
    RefreshCw,
    Hash,
    Layers
} from 'lucide-react';
import API from '../api/axios';

export default function AdminDepartments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Modal
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', code: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // Edit Modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', code: '', isActive: true });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Toast
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4000);
    };

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await API.get('/departments');
            setDepartments(res.data || []);
        } catch (err) {
            console.error('Failed to load departments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    // Create Department
    const handleCreateDept = async (e) => {
        e.preventDefault();
        setCreateError('');
        if (!createForm.name || !createForm.code) {
            setCreateError('Please provide both department name and a short code.');
            return;
        }

        try {
            setCreateLoading(true);
            const res = await API.post('/departments', {
                name: createForm.name,
                code: createForm.code.toUpperCase()
            });
            setDepartments([...departments, res.data]);
            setCreateModalOpen(false);
            setCreateForm({ name: '', code: '' });
            showToast(`Department "${res.data.name}" created successfully`);
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Failed to create department');
        } finally {
            setCreateLoading(false);
        }
    };

    // Open Edit Modal
    const openEditModal = (dept) => {
        setEditingDept(dept);
        setEditForm({
            name: dept.name,
            code: dept.code,
            isActive: dept.isActive !== false
        });
        setEditError('');
        setEditModalOpen(true);
    };

    // Edit Department
    const handleEditDept = async (e) => {
        e.preventDefault();
        setEditError('');
        try {
            setEditLoading(true);
            const res = await API.put(`/departments/${editingDept._id}`, {
                name: editForm.name,
                code: editForm.code.toUpperCase(),
                isActive: editForm.isActive
            });
            setDepartments(departments.map(d => d._id === editingDept._id ? res.data : d));
            setEditModalOpen(false);
            showToast(`Department "${res.data.name}" updated successfully`);
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update department');
        } finally {
            setEditLoading(false);
        }
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
                            <FolderKanban size={20} />
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                            Department & Cost Center Management
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Configure enterprise departments to isolate purchase requisitions and structure organizational budgets.
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
                    <Plus size={16} />
                    New Department
                </button>
            </div>

            {/* KPI Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.75rem'
            }}>
                <div className="card" style={{ padding: '1.4rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>REGISTERED DEPARTMENTS</span>
                        <Building2 size={18} style={{ color: 'var(--plum-600)' }} />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                        {departments.length}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Organizational units active in procurement
                    </div>
                </div>

                <div className="card" style={{ padding: '1.4rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVE STATUS</span>
                        <CheckCircle2 size={18} style={{ color: '#059669' }} />
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                        {departments.filter(d => d.isActive !== false).length}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Eligible to raise purchase requisitions
                    </div>
                </div>
            </div>

            {/* Department Cards Grid */}
            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={28} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--plum-600)' }} />
                    <p style={{ fontWeight: 600 }}>Loading departments...</p>
                </div>
            ) : departments.length === 0 ? (
                <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Layers size={40} style={{ color: 'var(--plum-300)', margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--plum-950)', marginBottom: '0.4rem' }}>
                        No Departments Configured
                    </h3>
                    <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                        Create your first department or cost center to assign users and begin issuing requisitions.
                    </p>
                    <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary">
                        Create Department
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.25rem'
                }}>
                    {departments.map(dept => (
                        <div
                            key={dept._id}
                            className="card"
                            style={{
                                padding: '1.5rem',
                                border: '1px solid var(--border-subtle)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.3rem 0.65rem',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'linear-gradient(135deg, var(--plum-100), var(--plum-50))',
                                        color: 'var(--plum-900)',
                                        fontSize: '0.8125rem',
                                        fontWeight: 800,
                                        letterSpacing: '0.04em',
                                        border: '1px solid var(--plum-200)'
                                    }}>
                                        <Hash size={13} />
                                        {dept.code}
                                    </span>

                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.2rem 0.55rem',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        background: dept.isActive !== false ? '#ECFDF5' : '#FEF2F2',
                                        color: dept.isActive !== false ? '#059669' : '#DC2626',
                                        border: `1px solid ${dept.isActive !== false ? '#A7F3D0' : '#FECACA'}`
                                    }}>
                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dept.isActive !== false ? '#059669' : '#DC2626' }} />
                                        {dept.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--plum-950)', marginBottom: '0.4rem' }}>
                                    {dept.name}
                                </h3>

                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Created on {new Date(dept.createdAt || Date.now()).toLocaleDateString()}
                                </div>
                            </div>

                            <div style={{
                                marginTop: '1.5rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--border-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    onClick={() => openEditModal(dept)}
                                    className="btn btn-secondary"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.8125rem',
                                        padding: '0.45rem 0.85rem'
                                    }}
                                >
                                    <Edit2 size={13} />
                                    Edit Department
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE DEPARTMENT MODAL */}
            {createModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '460px', animation: 'slideUp 0.2s ease' }}>
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
                                    <Plus size={16} />
                                </div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    Add New Department
                                </h3>
                            </div>
                            <button onClick={() => setCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDept} style={{ padding: '1.5rem' }}>
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
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="form-control"
                                    placeholder="e.g. Information Technology & Systems"
                                    value={createForm.name}
                                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                    Department Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength="8"
                                    className="form-control"
                                    placeholder="e.g. IT, OPS, FIN, HR"
                                    value={createForm.code}
                                    onChange={e => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                                />
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                    Unique short code used in requisition tracking and departmental identification.
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
                                    {createLoading ? 'Saving...' : 'Create Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT DEPARTMENT MODAL */}
            {editModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '460px', animation: 'slideUp 0.2s ease' }}>
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
                                    Edit Department
                                </h3>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Code: {editingDept?.code}
                                </div>
                            </div>
                            <button onClick={() => setEditModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditDept} style={{ padding: '1.5rem' }}>
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
                                    Department Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="form-control"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                                    Department Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength="8"
                                    className="form-control"
                                    value={editForm.code}
                                    onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <input
                                    type="checkbox"
                                    id="deptActiveCheckbox"
                                    checked={editForm.isActive}
                                    onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--plum-800)', cursor: 'pointer' }}
                                />
                                <label htmlFor="deptActiveCheckbox" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                                    Department is Active (Allow new purchase requests)
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
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
