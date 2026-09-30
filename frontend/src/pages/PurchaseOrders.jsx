import { useEffect, useState, useContext } from 'react';
import {
    Plus,
    Search,
    FileCheck2,
    DollarSign,
    Building2,
    Truck,
    Clock,
    FileText,
    History,
    AlertCircle,
    X,
    Printer,
    Edit3,
    CheckCircle2,
    Filter,
    ShieldAlert
} from 'lucide-react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function PurchaseOrders() {
    const { user, isAdmin, isProcurement } = useContext(AuthContext);
    const [pos, setPOs] = useState([]);
    const [awardedRFQs, setAwardedRFQs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);

    const [selectedPO, setSelectedPO] = useState(null);

    // Form: Create PO from RFQ
    const [createFormData, setCreateFormData] = useState({
        rfqId: '',
        taxRate: 8,
        deliveryAddress: 'Corporate Headquarters, Delivery Dock 1, 500 Enterprise Way'
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // Form: Revise PO
    const [reviseFormData, setReviseFormData] = useState({
        modificationReason: '',
        taxRate: 8,
        deliveryAddress: '',
        paymentTerms: '',
        items: []
    });
    const [reviseLoading, setReviseLoading] = useState(false);
    const [reviseError, setReviseError] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== 'All') params.status = statusFilter;
            if (search) params.search = search;

            const [poRes, rfqRes] = await Promise.all([
                API.get('/purchase-orders', { params }),
                API.get('/rfq?status=Awarded')
            ]);
            setPOs(poRes.data || []);
            setAwardedRFQs(rfqRes.data || []);
        } catch (err) {
            console.error('Failed to load POs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [statusFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchData();
    };

    // Create PO Submit
    const handleCreatePO = async (e) => {
        e.preventDefault();
        setCreateError('');
        setCreateLoading(true);
        try {
            await API.post('/purchase-orders/from-rfq', createFormData);
            setIsCreateModalOpen(false);
            setCreateFormData({
                rfqId: '',
                taxRate: 8,
                deliveryAddress: 'Corporate Headquarters, Delivery Dock 1, 500 Enterprise Way'
            });
            fetchData();
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Failed to create PO');
        } finally {
            setCreateLoading(false);
        }
    };

    // Revise PO Submit
    const handleReviseSubmit = async (e) => {
        e.preventDefault();
        setReviseError('');

        if (!reviseFormData.modificationReason?.trim()) {
            setReviseError('A structured audit reason is mandatory for modifying an issued purchase order');
            return;
        }

        setReviseLoading(true);
        try {
            await API.put(`/purchase-orders/${selectedPO._id}/revise`, {
                modificationReason: reviseFormData.modificationReason,
                taxRate: reviseFormData.taxRate,
                deliveryAddress: reviseFormData.deliveryAddress,
                paymentTerms: reviseFormData.paymentTerms,
                updatedItems: reviseFormData.items
            });
            setIsReviseModalOpen(false);
            fetchData();
        } catch (err) {
            setReviseError(err.response?.data?.message || 'PO Revision failed');
        } finally {
            setReviseLoading(false);
        }
    };

    // Open Detail Modal
    const openDetailModal = async (po) => {
        try {
            const { data } = await API.get(`/purchase-orders/${po._id}`);
            setSelectedPO(data);
            setIsDetailModalOpen(true);
        } catch (err) {
            alert('Failed to load PO details');
        }
    };

    // Open Revise Modal
    const openReviseModal = (po) => {
        setSelectedPO(po);
        setReviseFormData({
            modificationReason: '',
            taxRate: po.taxRate || 0,
            deliveryAddress: po.deliveryAddress || '',
            paymentTerms: po.paymentTerms || '',
            items: po.items.map(i => ({
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice
            }))
        });
        setReviseError('');
        setIsReviseModalOpen(true);
    };

    const handlePrintPO = () => {
        window.print();
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
                        Purchase Orders (PO)
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
                        Legally binding purchase contracts, structured audit revisions, and fulfillment tracking
                    </p>
                </div>

                {(isAdmin || isProcurement) && (
                    <button
                        onClick={() => {
                            setCreateFormData({
                                rfqId: awardedRFQs[0]?._id || '',
                                taxRate: 8,
                                deliveryAddress: 'Corporate Headquarters, Delivery Dock 1, 500 Enterprise Way'
                            });
                            setCreateError('');
                            setIsCreateModalOpen(true);
                        }}
                        className="btn-peach"
                        disabled={awardedRFQs.length === 0}
                        title={awardedRFQs.length === 0 ? 'No awarded RFQs available' : 'Generate PO from Awarded RFQ'}
                    >
                        <Plus size={16} />
                        Generate PO from Awarded RFQ ({awardedRFQs.length})
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div className="aura-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                        <input
                            type="text"
                            className="form-input"
                            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', height: '38px', fontSize: '0.8125rem' }}
                            placeholder="Search by PO number..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 0.9rem' }}>
                        Search
                    </button>
                </form>

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
                        <option value="Issued">Issued</option>
                        <option value="Partially Received">Partially Received</option>
                        <option value="Received">Received</option>
                        <option value="Closed">Closed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* POs Table */}
            <div className="aura-table-container">
                <table className="aura-table">
                    <thead>
                        <tr>
                            <th>PO Number</th>
                            <th>Department</th>
                            <th>Vendor</th>
                            <th>Subtotal</th>
                            <th>Tax</th>
                            <th>Final Total</th>
                            <th>Revisions</th>
                            <th>Status</th>
                            <th>Issued Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--plum-700)' }}>
                                    Loading purchase orders...
                                </td>
                            </tr>
                        ) : pos.length === 0 ? (
                            <tr>
                                <td colSpan="10" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                                    <FileCheck2 size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <p style={{ fontWeight: 600 }}>No purchase orders recorded yet</p>
                                </td>
                            </tr>
                        ) : (
                            pos.map((po) => (
                                <tr key={po._id}>
                                    <td>
                                        <span
                                            onClick={() => openDetailModal(po)}
                                            style={{ fontWeight: 800, color: 'var(--plum-700)', cursor: 'pointer' }}
                                        >
                                            {po.poNumber}
                                        </span>
                                    </td>
                                    <td>{po.department?.name || 'N/A'}</td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                            {po.vendor?.companyName}
                                        </span>
                                    </td>
                                    <td>${po.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>
                                        ${po.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({po.taxRate}%)
                                    </td>
                                    <td style={{ fontWeight: 800, color: 'var(--plum-950)' }}>
                                        ${po.finalTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>
                                        {po.revisions?.length > 0 ? (
                                            <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}>
                                                Rev #{po.revisions.length}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Original (v0)</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${po.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {po.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {new Date(po.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <button
                                                onClick={() => openDetailModal(po)}
                                                className="btn-outline"
                                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                                title="View Formal PO Document"
                                            >
                                                <FileText size={14} /> View
                                            </button>

                                            {(isAdmin || isProcurement) && !['Received', 'Cancelled', 'Closed'].includes(po.status) && (
                                                <button
                                                    onClick={() => openReviseModal(po)}
                                                    className="btn-secondary"
                                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                                    title="Revise PO (Structured Revision Record)"
                                                >
                                                    <Edit3 size={14} /> Revise
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal 1: Generate PO from Awarded RFQ */}
            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
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
                                    Generate Purchase Order
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Issue legally binding order from awarded vendor quotation
                                </p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePO} style={{ padding: '1.5rem' }}>
                            {createError && (
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
                                    {createError}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Select Awarded RFQ *</label>
                                <select
                                    required
                                    className="form-select"
                                    value={createFormData.rfqId}
                                    onChange={e => setCreateFormData({ ...createFormData, rfqId: e.target.value })}
                                >
                                    <option value="" disabled>Choose an awarded RFQ...</option>
                                    {awardedRFQs.map(rfq => (
                                        <option key={rfq._id} value={rfq._id}>
                                            {rfq.rfqNumber} • Awarded to: {rfq.selectedVendor?.companyName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tax Rate (%) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    required
                                    className="form-input"
                                    value={createFormData.taxRate}
                                    onChange={e => setCreateFormData({ ...createFormData, taxRate: e.target.value })}
                                />
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Subtotal, tax calculation and final totals are computed automatically on the backend.
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ship-to Delivery Address *</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={createFormData.deliveryAddress}
                                    onChange={e => setCreateFormData({ ...createFormData, deliveryAddress: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createLoading} className="btn-peach">
                                    {createLoading ? 'Generating...' : 'Issue Purchase Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: View Formal Purchase Order Document */}
            {isDetailModalOpen && selectedPO && (
                <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px' }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: 'var(--plum-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    Purchase Order: {selectedPO.poNumber}
                                </h3>
                                <span className={`badge badge-${selectedPO.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {selectedPO.status}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    onClick={handlePrintPO}
                                    className="btn-secondary"
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                >
                                    <Printer size={14} /> Print PO
                                </button>
                                <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Printable PO Document View */}
                        <div style={{ padding: '2rem' }}>
                            {/* Company & Order Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--plum-800)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--plum-950)', margin: '0 0 0.25rem 0' }}>
                                        <span style={{ color: 'var(--peach-500)', fontStyle: 'italic' }}>e-</span>Procurement Enterprise
                                    </h2>
                                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        Procurement & Supply Chain Operations<br />
                                        100 Innovation Way, Enterprise Tower, Suite 800
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--plum-900)' }}>
                                        {selectedPO.poNumber}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        Date: {new Date(selectedPO.createdAt).toLocaleDateString()}<br />
                                        Department: {selectedPO.department?.name} ({selectedPO.department?.code})
                                    </div>
                                </div>
                            </div>

                            {/* Vendor & Shipping Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '1rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                        Vendor / Supplier
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--plum-950)' }}>
                                        {selectedPO.vendor?.companyName}
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-body)', marginTop: '0.2rem' }}>
                                        Attn: {selectedPO.vendor?.contactPerson}<br />
                                        {selectedPO.vendor?.address}<br />
                                        Email: {selectedPO.vendor?.email} • Phone: {selectedPO.vendor?.phone}<br />
                                        Tax ID: {selectedPO.vendor?.taxNumber}
                                    </div>
                                </div>

                                <div style={{ padding: '1rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                                        Ship-to Delivery Terms
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-body)' }}>
                                        <strong>Address:</strong> {selectedPO.deliveryAddress}<br />
                                        <strong>Payment Terms:</strong> {selectedPO.paymentTerms}<br />
                                        <strong>Requisition Ref:</strong> {selectedPO.purchaseRequest?.prNumber || 'PR'}
                                    </div>
                                </div>
                            </div>

                            {/* Itemized Table */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <table className="aura-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Description</th>
                                            <th>Ordered Qty</th>
                                            <th>Delivered Qty</th>
                                            <th>Unit Price</th>
                                            <th style={{ textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPO.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{item.description}</td>
                                                <td>{item.quantity}</td>
                                                <td>
                                                    <span style={{ fontWeight: 700, color: item.receivedQuantity >= item.quantity ? 'var(--success-text)' : 'var(--peach-700)' }}>
                                                        {item.receivedQuantity} / {item.quantity}
                                                    </span>
                                                </td>
                                                <td>${item.unitPrice?.toFixed(2)}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                                    ${(item.quantity * item.unitPrice).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Financial Summary */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                                <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                        <span>Subtotal:</span>
                                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${selectedPO.subtotal?.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                        <span>Tax ({selectedPO.taxRate}%):</span>
                                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>+${selectedPO.taxAmount?.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)', paddingTop: '0.4rem', borderTop: '2px solid var(--border-subtle)' }}>
                                        <span>Final Total:</span>
                                        <span>${selectedPO.finalTotal?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Structured Revision History */}
                            {selectedPO.revisions?.length > 0 && (
                                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--plum-950)', marginBottom: '0.75rem' }}>
                                        <History size={16} /> Audit Revision Trail ({selectedPO.revisions.length})
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                        {selectedPO.revisions.map((rev, i) => (
                                            <div key={i} style={{ padding: '0.75rem 1rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '0.8125rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                                    <strong>Revision #{rev.revisionNumber} by {rev.modifiedBy?.name || 'Authorized Officer'}</strong>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(rev.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p style={{ margin: 0, color: 'var(--text-body)', fontStyle: 'italic' }}>
                                                    Reason: &ldquo;{rev.modificationReason}&rdquo;
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsDetailModalOpen(false)} className="btn-secondary">
                                    Close Document
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 3: Revise Purchase Order (Audit Lock Enforcement) */}
            {isReviseModalOpen && selectedPO && (
                <div className="modal-overlay" onClick={() => setIsReviseModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
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
                                    Revise {selectedPO.poNumber}
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Issued POs are locked against silent edits. A revision record will be generated.
                                </p>
                            </div>
                            <button onClick={() => setIsReviseModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleReviseSubmit} style={{ padding: '1.5rem' }}>
                            {reviseError && (
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
                                    {reviseError}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Structured Modification Reason * (Mandatory)</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="form-textarea"
                                    placeholder="Explain why this issued PO is being revised (e.g. quantity adjustment, price correction requested by department)..."
                                    value={reviseFormData.modificationReason}
                                    onChange={e => setReviseFormData({ ...reviseFormData, modificationReason: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="form-input"
                                        value={reviseFormData.taxRate}
                                        onChange={e => setReviseFormData({ ...reviseFormData, taxRate: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Payment Terms</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={reviseFormData.paymentTerms}
                                        onChange={e => setReviseFormData({ ...reviseFormData, paymentTerms: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Delivery Address</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={reviseFormData.deliveryAddress}
                                    onChange={e => setReviseFormData({ ...reviseFormData, deliveryAddress: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsReviseModalOpen(false)} className="btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" disabled={reviseLoading} className="btn-peach">
                                    {reviseLoading ? 'Recording Revision...' : 'Save Structured Revision'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}