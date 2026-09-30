import { useEffect, useState, useContext } from 'react';
import {
    Plus,
    Truck,
    Search,
    FileCheck2,
    Calendar,
    User,
    CheckCircle2,
    AlertCircle,
    X,
    Upload,
    FileText,
    ExternalLink,
    AlertTriangle,
    Eye
} from 'lucide-react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function GoodsReceipt() {
    const { isAdmin, isProcurement } = useContext(AuthContext);
    const [grns, setGRNs] = useState([]);
    const [activePOs, setActivePOs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedGRN, setSelectedGRN] = useState(null);

    // Form State
    const [selectedPOId, setSelectedPOId] = useState('');
    const [selectedPO, setSelectedPO] = useState(null);
    const [receivedItems, setReceivedItems] = useState([]);
    const [deliveryNoteFile, setDeliveryNoteFile] = useState(null);
    const [inspectionFile, setInspectionFile] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [grnRes, poRes] = await Promise.all([
                API.get('/grn'),
                API.get('/purchase-orders?status=Issued,Partially Received')
            ]);
            setGRNs(grnRes.data || []);
            setActivePOs(poRes.data?.filter(po => ['Issued', 'Partially Received'].includes(po.status)) || []);
        } catch (err) {
            console.error('Failed to load GRNs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // When PO selection changes, populate items
    const handlePOSelect = (poId) => {
        setSelectedPOId(poId);
        const po = activePOs.find(p => p._id === poId);
        setSelectedPO(po);
        if (po) {
            const initialLines = po.items.map((item, idx) => ({
                poItemIndex: idx,
                description: item.description,
                orderedQuantity: item.quantity,
                alreadyReceived: item.receivedQuantity || 0,
                remainingQuantity: item.quantity - (item.receivedQuantity || 0),
                receivedQuantity: Math.max(0, item.quantity - (item.receivedQuantity || 0)),
                damagedQuantity: 0,
                rejectedQuantity: 0,
                notes: ''
            }));
            setReceivedItems(initialLines);
        } else {
            setReceivedItems([]);
        }
    };

    const updateReceivedItem = (idx, field, value) => {
        setReceivedItems(prev => {
            const updated = [...prev];
            updated[idx][field] = value;
            return updated;
        });
    };

    // Submit GRN
    const handleSubmitGRN = async (e) => {
        e.preventDefault();
        setFormError('');

        // Strict non-overage validation
        for (const item of receivedItems) {
            const newlyReceived = Number(item.receivedQuantity || 0);
            if (newlyReceived < 0) {
                setFormError(`Received quantity for "${item.description}" cannot be negative`);
                return;
            }
            if (item.alreadyReceived + newlyReceived > item.orderedQuantity) {
                setFormError(`Overage blocked: Line "${item.description}" ordered: ${item.orderedQuantity}, already received: ${item.alreadyReceived}. You cannot receive more than ${item.orderedQuantity - item.alreadyReceived} additional units.`);
                return;
            }
        }

        const totalNewlyReceived = receivedItems.reduce((acc, i) => acc + Number(i.receivedQuantity || 0), 0);
        if (totalNewlyReceived <= 0) {
            setFormError('At least one item must have a received quantity greater than 0.');
            return;
        }

        setFormLoading(true);
        const formPayload = new FormData();
        formPayload.append('purchaseOrderId', selectedPOId);
        formPayload.append('receivedItems', JSON.stringify(receivedItems.map(i => ({
            poItemIndex: i.poItemIndex,
            description: i.description,
            orderedQuantity: i.orderedQuantity,
            receivedQuantity: Number(i.receivedQuantity || 0),
            damagedQuantity: Number(i.damagedQuantity || 0),
            rejectedQuantity: Number(i.rejectedQuantity || 0),
            notes: i.notes || ''
        }))));

        if (deliveryNoteFile) {
            formPayload.append('deliveryNote', deliveryNoteFile);
        }
        if (inspectionFile) {
            formPayload.append('inspection', inspectionFile);
        }

        try {
            await API.post('/grn', formPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsCreateModalOpen(false);
            setSelectedPOId('');
            setSelectedPO(null);
            setReceivedItems([]);
            setDeliveryNoteFile(null);
            setInspectionFile(null);
            fetchData();
        } catch (err) {
            setFormError(err.response?.data?.message || 'GRN recording failed');
        } finally {
            setFormLoading(false);
        }
    };

    const openDetailModal = (grn) => {
        setSelectedGRN(grn);
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
                        Goods Received Notes (GRN)
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
                        Physical delivery verification, strict overage prevention, inspection logging, and PO status automation
                    </p>
                </div>

                {(isAdmin || isProcurement) && (
                    <button
                        onClick={() => {
                            setSelectedPOId(activePOs[0]?._id || '');
                            handlePOSelect(activePOs[0]?._id || '');
                            setFormError('');
                            setIsCreateModalOpen(true);
                        }}
                        className="btn-peach"
                        disabled={activePOs.length === 0}
                        title={activePOs.length === 0 ? 'No active POs waiting for delivery' : 'Log Delivery (GRN)'}
                    >
                        <Plus size={16} />
                        Record Delivery / Intake ({activePOs.length} POs Open)
                    </button>
                )}
            </div>

            {/* GRN Table */}
            <div className="aura-table-container">
                <table className="aura-table">
                    <thead>
                        <tr>
                            <th>GRN Number</th>
                            <th>Purchase Order</th>
                            <th>Vendor</th>
                            <th>Department</th>
                            <th>Received By</th>
                            <th>Items Logged</th>
                            <th>Delivery Date</th>
                            <th>Inspection Files</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--plum-700)' }}>
                                    Loading delivery history...
                                </td>
                            </tr>
                        ) : grns.length === 0 ? (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                                    <Truck size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <p style={{ fontWeight: 600 }}>No goods receipt notes logged yet</p>
                                </td>
                            </tr>
                        ) : (
                            grns.map((grn) => (
                                <tr key={grn._id}>
                                    <td>
                                        <span
                                            onClick={() => openDetailModal(grn)}
                                            style={{ fontWeight: 800, color: 'var(--plum-700)', cursor: 'pointer' }}
                                        >
                                            {grn.grnNumber}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: 'var(--plum-950)' }}>
                                            {grn.purchaseOrder?.poNumber || 'N/A'}
                                        </span>
                                    </td>
                                    <td>{grn.purchaseOrder?.vendor?.companyName || 'Vendor'}</td>
                                    <td>{grn.purchaseOrder?.department?.name || 'Department'}</td>
                                    <td>{grn.receivedBy?.name || 'Authorized User'}</td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: 'var(--text-body)' }}>
                                            {grn.items?.length || 0} line items
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {new Date(grn.deliveryDate || grn.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                            {grn.deliveryNoteUrl && (
                                                <a
                                                    href={`http://localhost:5000${grn.deliveryNoteUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="badge badge-draft"
                                                    style={{ textDecoration: 'none', fontSize: '0.7rem' }}
                                                    title="View Delivery Note"
                                                >
                                                    <FileText size={12} /> BOL
                                                </a>
                                            )}
                                            {grn.inspectionDocumentUrl && (
                                                <a
                                                    href={`http://localhost:5000${grn.inspectionDocumentUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="badge badge-approved"
                                                    style={{ textDecoration: 'none', fontSize: '0.7rem' }}
                                                    title="View QC Inspection File"
                                                >
                                                    <CheckCircle2 size={12} /> QC Report
                                                </a>
                                            )}
                                            {!grn.deliveryNoteUrl && !grn.inspectionDocumentUrl && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>None</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={() => openDetailModal(grn)}
                                            className="btn-outline"
                                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                        >
                                            <Eye size={14} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal 1: Record Goods Delivery (GRN) with Strict Overage Checks */}
            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px' }}>
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
                                    Record Goods Delivery Intake (GRN)
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Inspect physical units against issued purchase order items
                                </p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitGRN} style={{ padding: '1.5rem' }}>
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

                            {/* Select PO */}
                            <div className="form-group">
                                <label className="form-label">Select Open Purchase Order *</label>
                                <select
                                    required
                                    className="form-select"
                                    value={selectedPOId}
                                    onChange={e => handlePOSelect(e.target.value)}
                                >
                                    <option value="" disabled>Choose an issued or partial order...</option>
                                    {activePOs.map(po => (
                                        <option key={po._id} value={po._id}>
                                            {po.poNumber} • {po.vendor?.companyName} • Total: ${po.finalTotal?.toLocaleString()} ({po.status})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Itemized Delivery Intake Matrix */}
                            {selectedPO && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label" style={{ marginBottom: '0.65rem' }}>
                                        Item Deliveries & Quality Inspection
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {receivedItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    padding: '1rem',
                                                    background: '#FAF8FA',
                                                    border: '1px solid var(--border-subtle)',
                                                    borderRadius: 'var(--radius-md)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                                                    <div>
                                                        <strong style={{ fontSize: '0.875rem', color: 'var(--plum-950)' }}>
                                                            {item.description}
                                                        </strong>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            Total Ordered: <strong>{item.orderedQuantity}</strong> • Already Received: <strong>{item.alreadyReceived}</strong> • Remaining: <strong style={{ color: 'var(--peach-700)' }}>{item.remainingQuantity}</strong>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                            Newly Received *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={item.remainingQuantity}
                                                            required
                                                            className="form-input"
                                                            value={item.receivedQuantity}
                                                            onChange={e => updateReceivedItem(idx, 'receivedQuantity', e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                            Damaged Qty
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="form-input"
                                                            value={item.damagedQuantity}
                                                            onChange={e => updateReceivedItem(idx, 'damagedQuantity', e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                            Rejected Qty
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="form-input"
                                                            value={item.rejectedQuantity}
                                                            onChange={e => updateReceivedItem(idx, 'rejectedQuantity', e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                            Inspection Notes
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="Serial numbers, packing notes..."
                                                            value={item.notes}
                                                            onChange={e => updateReceivedItem(idx, 'notes', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Document Uploads */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Delivery Note / Bill of Lading</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                        onChange={e => setDeliveryNoteFile(e.target.files[0])}
                                        style={{ fontSize: '0.8125rem' }}
                                    />
                                </div>

                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">QC Inspection Certificate / Report</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                        onChange={e => setInspectionFile(e.target.files[0])}
                                        style={{ fontSize: '0.8125rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" disabled={formLoading || !selectedPO} className="btn-peach">
                                    {formLoading ? 'Submitting GRN...' : 'Record Goods Receipt'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: View GRN Details */}
            {isDetailModalOpen && selectedGRN && (
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
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    {selectedGRN.grnNumber}
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Purchase Order: <strong>{selectedGRN.purchaseOrder?.poNumber}</strong>
                                </p>
                            </div>
                            <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '0.85rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Received By</div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedGRN.receivedBy?.name || 'Officer'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedGRN.receivedBy?.email}</div>
                                </div>

                                <div style={{ padding: '0.85rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Delivery Date</div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                        {new Date(selectedGRN.deliveryDate || selectedGRN.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--plum-950)', marginBottom: '0.65rem' }}>
                                    Delivered Line Items
                                </h4>
                                <table className="aura-table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Ordered</th>
                                            <th>Received</th>
                                            <th>Damaged</th>
                                            <th>Rejected</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedGRN.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 600 }}>{item.description}</td>
                                                <td>{item.orderedQuantity}</td>
                                                <td style={{ fontWeight: 700, color: 'var(--success-text)' }}>
                                                    {item.receivedQuantity}
                                                </td>
                                                <td style={{ color: item.damagedQuantity > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                                    {item.damagedQuantity}
                                                </td>
                                                <td style={{ color: item.rejectedQuantity > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                                    {item.rejectedQuantity}
                                                </td>
                                                <td style={{ fontSize: '0.78rem' }}>{item.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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