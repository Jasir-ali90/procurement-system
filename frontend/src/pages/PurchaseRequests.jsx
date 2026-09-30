import { useEffect, useState, useContext } from 'react';
import {
    Plus,
    Search,
    Filter,
    FileText,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Trash2,
    Edit3,
    Eye,
    Clock,
    User,
    Building2,
    Calendar,
    AlertCircle,
    X,
    Send,
    DollarSign
} from 'lucide-react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function PurchaseRequests() {
    const { user, isAdmin, isProcurement } = useContext(AuthContext);
    const [prs, setPRs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [selectedPR, setSelectedPR] = useState(null);

    // Form state for creating/editing PR
    const initialItem = { description: '', quantity: 1, requiredDate: '', estimatedCost: 0 };
    const [formData, setFormData] = useState({
        priority: 'Medium',
        items: [initialItem]
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // Review form state
    const [reviewDecision, setReviewDecision] = useState('Approved');
    const [reviewComment, setReviewComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');

    const fetchPRs = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'All') params.status = statusFilter;
            if (priorityFilter !== 'All') params.priority = priorityFilter;
            if (search) params.search = search;

            const { data } = await API.get('/purchase-requests', { params });
            setPRs(data);
        } catch (err) {
            console.error('Failed to fetch purchase requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPRs();
    }, [statusFilter, priorityFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchPRs();
    };

    // Item row operations
    const addItemRow = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...initialItem }]
        }));
    };

    const removeItemRow = (index) => {
        if (formData.items.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const updateItemRow = (index, field, value) => {
        setFormData(prev => {
            const updated = [...prev.items];
            updated[index][field] = value;
            return { ...prev, items: updated };
        });
    };

    const calculateGrandTotal = (items) => {
        return items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.estimatedCost || 0)), 0);
    };

    // Create / Submit PR
    const handleSavePR = async (submitStatus) => {
        setFormError('');
        // Validate items
        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            if (!item.description?.trim()) {
                setFormError(`Item #${i + 1} description is required`);
                return;
            }
            if (!item.quantity || Number(item.quantity) < 1) {
                setFormError(`Item #${i + 1} quantity must be at least 1`);
                return;
            }
            if (!item.requiredDate) {
                setFormError(`Item #${i + 1} required delivery date is required`);
                return;
            }
            if (item.estimatedCost === undefined || Number(item.estimatedCost) < 0) {
                setFormError(`Item #${i + 1} estimated cost cannot be negative`);
                return;
            }
        }

        setFormLoading(true);
        try {
            if (isEditModalOpen && selectedPR) {
                await API.put(`/purchase-requests/${selectedPR._id}`, {
                    items: formData.items,
                    priority: formData.priority,
                    status: submitStatus
                });
                setIsEditModalOpen(false);
            } else {
                await API.post('/purchase-requests', {
                    items: formData.items,
                    priority: formData.priority,
                    status: submitStatus
                });
                setIsCreateModalOpen(false);
            }
            setFormData({ priority: 'Medium', items: [initialItem] });
            setSelectedPR(null);
            fetchPRs();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Operation failed');
        } finally {
            setFormLoading(false);
        }
    };

    // Review PR
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewError('');

        if (['Rejected', 'Returned for Correction'].includes(reviewDecision) && (!reviewComment || reviewComment.trim() === '')) {
            setReviewError('A written audit comment is mandatory for returns or rejections.');
            return;
        }

        setReviewLoading(true);
        try {
            await API.put(`/purchase-requests/${selectedPR._id}/review`, {
                decision: reviewDecision,
                comment: reviewComment
            });
            setIsReviewModalOpen(false);
            setReviewComment('');
            setSelectedPR(null);
            fetchPRs();
        } catch (err) {
            setReviewError(err.response?.data?.message || 'Review submission failed');
        } finally {
            setReviewLoading(false);
        }
    };

    // Delete Draft PR
    const handleDeleteDraft = async (id) => {
        if (!window.confirm('Are you sure you want to delete this draft purchase request?')) return;
        try {
            await API.delete(`/purchase-requests/${id}`);
            fetchPRs();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    // Open Edit Modal
    const openEditModal = (pr) => {
        setSelectedPR(pr);
        setFormData({
            priority: pr.priority,
            items: pr.items.map(i => ({
                description: i.description,
                quantity: i.quantity,
                requiredDate: i.requiredDate ? new Date(i.requiredDate).toISOString().split('T')[0] : '',
                estimatedCost: i.estimatedCost
            }))
        });
        setFormError('');
        setIsEditModalOpen(true);
    };

    // Open Review Modal
    const openReviewModal = (pr) => {
        setSelectedPR(pr);
        setReviewDecision('Approved');
        setReviewComment('');
        setReviewError('');
        setIsReviewModalOpen(true);
    };

    // Open Detail Modal
    const openDetailModal = (pr) => {
        setSelectedPR(pr);
        setIsDetailModalOpen(true);
    };

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '1.75rem'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--plum-950)', margin: 0 }}>
                        Purchase Requests (PR)
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
                        Manage requisition intake, multi-item estimates, approval limits, and audit history
                    </p>
                </div>

                <button
                    onClick={() => {
                        setFormData({ priority: 'Medium', items: [initialItem] });
                        setFormError('');
                        setIsCreateModalOpen(true);
                    }}
                    className="btn-peach"
                >
                    <Plus size={16} />
                    Create Purchase Request
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="aura-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '260px', maxWidth: '450px' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', height: '38px', fontSize: '0.8125rem' }}
                            placeholder="Search PR number or item description..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 0.9rem' }}>
                        Search
                    </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                        <select
                            className="form-select"
                            style={{ width: 'auto', padding: '0.4rem 0.75rem', height: '38px', fontSize: '0.8125rem' }}
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Draft">Draft</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Approved">Approved</option>
                            <option value="Returned for Correction">Returned</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Priority:</span>
                        <select
                            className="form-select"
                            style={{ width: 'auto', padding: '0.4rem 0.75rem', height: '38px', fontSize: '0.8125rem' }}
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value)}
                        >
                            <option value="All">All Priorities</option>
                            <option value="Urgent">Urgent</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* PRs Data Table */}
            <div className="aura-table-container">
                <table className="aura-table">
                    <thead>
                        <tr>
                            <th>PR Number</th>
                            <th>Department</th>
                            <th>Requester</th>
                            <th>Items & Qty</th>
                            <th>Est. Total</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Submitted Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--plum-600)' }}>
                                    Loading purchase requests...
                                </td>
                            </tr>
                        ) : prs.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                                    <FileText size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <p style={{ fontWeight: 600 }}>No purchase requests found matching filters</p>
                                </td>
                            </tr>
                        ) : (
                            prs.map((pr) => {
                                const isRequester = pr.requester?._id === user?._id;
                                const canReview = (isAdmin || isProcurement) && pr.status === 'Submitted';
                                const canEdit = isRequester && ['Draft', 'Returned for Correction'].includes(pr.status);
                                const canDelete = isRequester && pr.status === 'Draft';

                                return (
                                    <tr key={pr._id}>
                                        <td>
                                            <span
                                                onClick={() => openDetailModal(pr)}
                                                style={{ fontWeight: 700, color: 'var(--plum-700)', cursor: 'pointer' }}
                                            >
                                                {pr.prNumber}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                {pr.department?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td>{pr.requester?.name || 'N/A'}</td>
                                        <td>
                                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-body)' }}>
                                                {pr.items?.length || 0} line items
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--plum-950)' }}>
                                            ${pr.totalEstimatedCost?.toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${pr.priority?.toLowerCase()}`}>
                                                {pr.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${pr.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                {pr.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {new Date(pr.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                                {/* View / Audit Button */}
                                                <button
                                                    onClick={() => openDetailModal(pr)}
                                                    className="btn-outline"
                                                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                                    title="View Details & Audit History"
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>

                                                {/* Review Button for Procurement / Admin */}
                                                {canReview && (
                                                    <button
                                                        onClick={() => openReviewModal(pr)}
                                                        className="btn-primary"
                                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                                        title="Approve, Return or Reject"
                                                    >
                                                        Review
                                                    </button>
                                                )}

                                                {/* Edit Button for Requester on Draft/Returned */}
                                                {canEdit && (
                                                    <button
                                                        onClick={() => openEditModal(pr)}
                                                        className="btn-secondary"
                                                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                                        title="Edit and Resubmit"
                                                    >
                                                        <Edit3 size={14} />
                                                        Edit
                                                    </button>
                                                )}

                                                {/* Delete Button for Draft */}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDeleteDraft(pr._id)}
                                                        className="btn-outline"
                                                        style={{ padding: '0.35rem 0.5rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                                                        title="Delete Draft"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal 1: Create or Edit Purchase Request */}
            {(isCreateModalOpen || isEditModalOpen) && (
                <div className="modal-overlay" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px' }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: 'var(--plum-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    {isEditModalOpen ? `Edit ${selectedPR?.prNumber}` : 'Create Purchase Request'}
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Department: <strong>{user?.department?.name || 'Assigned Department'}</strong>
                                </p>
                            </div>
                            <button
                                onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            {formError && (
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
                                    {formError}
                                </div>
                            )}

                            {/* Priority Selection */}
                            <div className="form-group" style={{ maxWidth: '240px' }}>
                                <label className="form-label">Priority Level</label>
                                <select
                                    className="form-select"
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>

                            {/* Dynamic Items Builder */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <label className="form-label" style={{ margin: 0 }}>
                                        Requisition Line Items ({formData.items.length})
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addItemRow}
                                        className="btn-secondary"
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                    >
                                        <Plus size={14} /> Add Line Item
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {formData.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: '1rem',
                                                border: '1px solid var(--border-subtle)',
                                                borderRadius: 'var(--radius-md)',
                                                background: '#FAF8FA',
                                                display: 'grid',
                                                gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 36px',
                                                gap: '0.75rem',
                                                alignItems: 'end'
                                            }}
                                        >
                                            <div>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                    Item Description
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="form-input"
                                                    placeholder="e.g. Dell Monitor 27-inch"
                                                    value={item.description}
                                                    onChange={e => updateItemRow(idx, 'description', e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                    Qty
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    required
                                                    className="form-input"
                                                    value={item.quantity}
                                                    onChange={e => updateItemRow(idx, 'quantity', e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                    Est. Unit Cost ($)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                    className="form-input"
                                                    value={item.estimatedCost}
                                                    onChange={e => updateItemRow(idx, 'estimatedCost', e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                    Required Date
                                                </label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="form-input"
                                                    value={item.requiredDate}
                                                    onChange={e => updateItemRow(idx, 'requiredDate', e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItemRow(idx)}
                                                    disabled={formData.items.length <= 1}
                                                    style={{
                                                        height: '38px',
                                                        width: '36px',
                                                        background: 'transparent',
                                                        border: '1px solid var(--border-subtle)',
                                                        borderRadius: 'var(--radius-md)',
                                                        color: formData.items.length <= 1 ? '#ccc' : 'var(--danger)',
                                                        cursor: formData.items.length <= 1 ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total Estimated Cost Bar */}
                            <div style={{
                                padding: '1rem 1.25rem',
                                background: 'var(--plum-50)',
                                border: '1px solid var(--plum-200)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '1.5rem'
                            }}>
                                <span style={{ fontWeight: 600, color: 'var(--plum-900)' }}>
                                    Calculated Estimated Grand Total:
                                </span>
                                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    ${calculateGrandTotal(formData.items).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Actions: Save Draft vs Submit */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={formLoading}
                                    onClick={() => handleSavePR('Draft')}
                                    className="btn-secondary"
                                >
                                    Save as Draft
                                </button>
                                <button
                                    type="button"
                                    disabled={formLoading}
                                    onClick={() => handleSavePR('Submitted')}
                                    className="btn-peach"
                                >
                                    <Send size={16} />
                                    {formLoading ? 'Submitting...' : 'Submit for Approval'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 2: Review Purchase Request (Approve / Return / Reject) */}
            {isReviewModalOpen && selectedPR && (
                <div className="modal-overlay" onClick={() => setIsReviewModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: 'var(--plum-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    Review {selectedPR.prNumber}
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Requester: {selectedPR.requester?.name} • Total: ${selectedPR.totalEstimatedCost?.toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsReviewModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleReviewSubmit} style={{ padding: '1.5rem' }}>
                            {reviewError && (
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
                                    {reviewError}
                                </div>
                            )}

                            {/* Separation of Duties Warning */}
                            {selectedPR.requester?._id === user?._id && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: 'var(--danger-bg)',
                                    color: 'var(--danger-text)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1rem',
                                    fontSize: '0.8125rem'
                                }}>
                                    ⚠️ <strong>Separation of Duties Rule:</strong> You created this request. You cannot review or approve your own purchase request.
                                </div>
                            )}

                            {/* Financial Threshold Notice */}
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1.25rem',
                                fontSize: '0.8125rem',
                                color: 'var(--text-body)'
                            }}>
                                <div>Your Approval Limit: <strong>${user?.approvalLimit?.toLocaleString() || 0}</strong></div>
                                <div>Request Total: <strong>${selectedPR.totalEstimatedCost?.toLocaleString()}</strong></div>
                                {!isAdmin && user?.approvalLimit < selectedPR.totalEstimatedCost && (
                                    <div style={{ color: 'var(--danger)', fontWeight: 600, marginTop: '0.35rem' }}>
                                        ⚠️ This request exceeds your financial threshold. An Admin approval is required.
                                    </div>
                                )}
                            </div>

                            {/* Decision Picker */}
                            <div className="form-group">
                                <label className="form-label">Review Decision</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setReviewDecision('Approved')}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '2px solid ' + (reviewDecision === 'Approved' ? 'var(--success)' : 'var(--border-subtle)'),
                                            background: reviewDecision === 'Approved' ? 'var(--success-bg)' : '#FFFFFF',
                                            color: reviewDecision === 'Approved' ? 'var(--success-text)' : 'var(--text-body)',
                                            fontWeight: 700,
                                            fontSize: '0.8125rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem'
                                        }}
                                    >
                                        <CheckCircle2 size={16} /> Approve
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setReviewDecision('Returned for Correction')}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '2px solid ' + (reviewDecision === 'Returned for Correction' ? 'var(--warning)' : 'var(--border-subtle)'),
                                            background: reviewDecision === 'Returned for Correction' ? 'var(--warning-bg)' : '#FFFFFF',
                                            color: reviewDecision === 'Returned for Correction' ? 'var(--warning-text)' : 'var(--text-body)',
                                            fontWeight: 700,
                                            fontSize: '0.8125rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem'
                                        }}
                                    >
                                        <RotateCcw size={16} /> Return
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setReviewDecision('Rejected')}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '2px solid ' + (reviewDecision === 'Rejected' ? 'var(--danger)' : 'var(--border-subtle)'),
                                            background: reviewDecision === 'Rejected' ? 'var(--danger-bg)' : '#FFFFFF',
                                            color: reviewDecision === 'Rejected' ? 'var(--danger-text)' : 'var(--text-body)',
                                            fontWeight: 700,
                                            fontSize: '0.8125rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem'
                                        }}
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            </div>

                            {/* Justification Comment (Required for Return or Reject) */}
                            <div className="form-group">
                                <label className="form-label">
                                    Audit Justification Comment
                                    {['Rejected', 'Returned for Correction'].includes(reviewDecision) && (
                                        <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>* (Mandatory)</span>
                                    )}
                                </label>
                                <textarea
                                    rows="3"
                                    className="form-textarea"
                                    value={reviewComment}
                                    onChange={e => setReviewComment(e.target.value)}
                                    placeholder={
                                        reviewDecision === 'Approved'
                                            ? 'Optional approval note or budget confirmation code...'
                                            : 'Explain the reason for return/rejection so requester can correct it...'
                                    }
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsReviewModalOpen(false)} className="btn-outline">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={reviewLoading || selectedPR.requester?._id === user?._id}
                                    className={reviewDecision === 'Approved' ? 'btn-primary' : reviewDecision === 'Rejected' ? 'btn-secondary' : 'btn-peach'}
                                >
                                    {reviewLoading ? 'Submitting Decision...' : `Confirm ${reviewDecision}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 3: View Details & Sequential Approval Audit History */}
            {isDetailModalOpen && selectedPR && (
                <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: 'var(--plum-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                        {selectedPR.prNumber}
                                    </h3>
                                    <span className={`badge badge-${selectedPR.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {selectedPR.status}
                                    </span>
                                    <span className={`badge badge-${selectedPR.priority?.toLowerCase()}`}>
                                        {selectedPR.priority}
                                    </span>
                                </div>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Created on {new Date(selectedPR.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            {/* Metadata Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '0.85rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Requester</div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>{selectedPR.requester?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedPR.requester?.email}</div>
                                </div>

                                <div style={{ padding: '0.85rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Department</div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>{selectedPR.department?.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code: {selectedPR.department?.code}</div>
                                </div>

                                <div style={{ padding: '0.85rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Estimated Cost</div>
                                    <div style={{ fontWeight: 800, color: 'var(--plum-950)', fontSize: '1.15rem' }}>
                                        ${selectedPR.totalEstimatedCost?.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Itemized Table */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--plum-950)', marginBottom: '0.65rem' }}>
                                    Requested Items ({selectedPR.items?.length || 0})
                                </h4>
                                <div className="aura-table-container">
                                    <table className="aura-table">
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th>Qty</th>
                                                <th>Unit Est. Cost</th>
                                                <th>Line Total</th>
                                                <th>Required By</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPR.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ fontWeight: 600 }}>{item.description}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>${Number(item.estimatedCost).toLocaleString()}</td>
                                                    <td style={{ fontWeight: 700 }}>
                                                        ${(item.quantity * item.estimatedCost).toLocaleString()}
                                                    </td>
                                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                        {new Date(item.requiredDate).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Sequential Approval History Audit Timeline */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--plum-950)', marginBottom: '0.75rem' }}>
                                    Audit & Decision History
                                </h4>
                                {selectedPR.approvalHistory && selectedPR.approvalHistory.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {selectedPR.approvalHistory.map((entry, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    padding: '0.85rem 1rem',
                                                    borderLeft: `3px solid ${entry.decision === 'Approved' ? 'var(--success)' : entry.decision === 'Rejected' ? 'var(--danger)' : 'var(--warning)'}`,
                                                    background: '#FAF8FA',
                                                    borderRadius: '0 8px 8px 0'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--plum-950)' }}>
                                                            {entry.reviewer?.name || 'Reviewer'}
                                                        </span>
                                                        <span className={`badge badge-${entry.decision?.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '0.7rem' }}>
                                                            {entry.decision}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                        <Clock size={12} />
                                                        {new Date(entry.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                {entry.comment && (
                                                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-body)', fontStyle: 'italic' }}>
                                                        &ldquo;{entry.comment}&rdquo;
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                        No review decisions have been logged yet for this request.
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsDetailModalOpen(false)} className="btn-secondary">
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}