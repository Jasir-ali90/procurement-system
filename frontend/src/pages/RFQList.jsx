import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Layers,
    Clock,
    DollarSign,
    Calendar,
    Building2,
    CheckCircle2,
    Trophy,
    FileText,
    Star,
    ExternalLink,
    AlertCircle,
    X,
    TrendingDown,
    Truck,
    ArrowRight
} from 'lucide-react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function RFQList() {
    const { isAdmin, isProcurement } = useContext(AuthContext);
    const [rfqs, setRFQs] = useState([]);
    const [approvedPRs, setApprovedPRs] = useState([]);
    const [allVendors, setAllVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitQuoteModalOpen, setIsSubmitQuoteModalOpen] = useState(false);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

    const [selectedRFQ, setSelectedRFQ] = useState(null);

    // Form: Create RFQ
    const [createFormData, setCreateFormData] = useState({
        purchaseRequestId: '',
        closingDate: '',
        invitedVendors: []
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // Form: Submit Quotation
    const [quoteFormData, setQuoteFormData] = useState({
        vendorId: '',
        quotedPrice: '',
        taxAmount: '',
        promisedDeliveryDate: '',
        deliveryLeadTimeDays: '',
        paymentTerms: 'Net 30'
    });
    const [quoteFile, setQuoteFile] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [quoteError, setQuoteError] = useState('');

    // Form: Award RFQ
    const [awardVendorId, setAwardVendorId] = useState('');
    const [awardReason, setAwardReason] = useState('');
    const [awardLoading, setAwardLoading] = useState(false);
    const [awardError, setAwardError] = useState('');

    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rfqRes, prRes, vendorRes] = await Promise.all([
                API.get('/rfq'),
                API.get('/purchase-requests?status=Approved'),
                API.get('/vendors?status=active&limit=100')
            ]);
            setRFQs(rfqRes.data || []);
            setApprovedPRs(prRes.data || []);
            setAllVendors(vendorRes.data?.vendors || []);
        } catch (err) {
            console.error('Failed to load RFQ data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Create RFQ submit
    const handleCreateRFQ = async (e) => {
        e.preventDefault();
        setCreateError('');

        if (createFormData.invitedVendors.length === 0) {
            setCreateError('Please invite at least one registered vendor');
            return;
        }

        setCreateLoading(true);
        try {
            await API.post('/rfq', createFormData);
            setIsCreateModalOpen(false);
            setCreateFormData({ purchaseRequestId: '', closingDate: '', invitedVendors: [] });
            fetchData();
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Failed to issue RFQ');
        } finally {
            setCreateLoading(false);
        }
    };

    // Submit Quotation submit
    const handleSubmitQuote = async (e) => {
        e.preventDefault();
        setQuoteError('');
        setQuoteLoading(true);

        const form = new FormData();
        form.append('vendorId', quoteFormData.vendorId);
        form.append('quotedPrice', quoteFormData.quotedPrice);
        form.append('taxAmount', quoteFormData.taxAmount || 0);
        form.append('promisedDeliveryDate', quoteFormData.promisedDeliveryDate);
        form.append('deliveryLeadTimeDays', quoteFormData.deliveryLeadTimeDays);
        form.append('paymentTerms', quoteFormData.paymentTerms);
        if (quoteFile) {
            form.append('quotationDocument', quoteFile);
        }

        try {
            await API.post(`/rfq/${selectedRFQ._id}/quote`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsSubmitQuoteModalOpen(false);
            setQuoteFormData({
                vendorId: '',
                quotedPrice: '',
                taxAmount: '',
                promisedDeliveryDate: '',
                deliveryLeadTimeDays: '',
                paymentTerms: 'Net 30'
            });
            setQuoteFile(null);
            fetchData();
        } catch (err) {
            setQuoteError(err.response?.data?.message || 'Failed to submit quote');
        } finally {
            setQuoteLoading(false);
        }
    };

    // Award RFQ submit
    const handleAwardRFQ = async (e) => {
        e.preventDefault();
        setAwardError('');

        if (!awardVendorId) {
            setAwardError('Please select a vendor to award the contract');
            return;
        }
        if (!awardReason || awardReason.trim() === '') {
            setAwardError('A formal written justification is mandatory for vendor awarding');
            return;
        }

        setAwardLoading(true);
        try {
            await API.put(`/rfq/${selectedRFQ._id}/award`, {
                vendorId: awardVendorId,
                selectionReason: awardReason
            });
            setIsComparisonModalOpen(false);
            setAwardReason('');
            setAwardVendorId('');
            fetchData();
        } catch (err) {
            setAwardError(err.response?.data?.message || 'Award decision failed');
        } finally {
            setAwardLoading(false);
        }
    };

    // Open Quote Modal
    const openQuoteModal = (rfq) => {
        setSelectedRFQ(rfq);
        setQuoteFormData({
            vendorId: rfq.invitedVendors[0]?._id || '',
            quotedPrice: '',
            taxAmount: '',
            promisedDeliveryDate: '',
            deliveryLeadTimeDays: '',
            paymentTerms: 'Net 30'
        });
        setQuoteError('');
        setIsSubmitQuoteModalOpen(true);
    };

    // Open Comparison Modal
    const openComparisonModal = (rfq) => {
        setSelectedRFQ(rfq);
        setAwardVendorId(rfq.selectedVendor?._id || '');
        setAwardReason(rfq.selectionReason || '');
        setAwardError('');
        setIsComparisonModalOpen(true);
    };

    // Vendor checkbox handler for Create RFQ
    const toggleVendorSelection = (vendorId) => {
        setCreateFormData(prev => {
            const exists = prev.invitedVendors.includes(vendorId);
            const updated = exists
                ? prev.invitedVendors.filter(id => id !== vendorId)
                : [...prev.invitedVendors, vendorId];
            return { ...prev, invitedVendors: updated };
        });
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
                        Requests for Quotation (RFQ)
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
                        Competitive bidding, side-by-side vendor comparison matrix, and transparent awarding decisions
                    </p>
                </div>

                {(isAdmin || isProcurement) && (
                    <button
                        onClick={() => {
                            setCreateFormData({
                                purchaseRequestId: approvedPRs[0]?._id || '',
                                closingDate: '',
                                invitedVendors: []
                            });
                            setCreateError('');
                            setIsCreateModalOpen(true);
                        }}
                        className="btn-peach"
                        disabled={approvedPRs.length === 0}
                        title={approvedPRs.length === 0 ? 'No approved purchase requests available' : 'Issue RFQ from Approved PR'}
                    >
                        <Plus size={16} />
                        Issue RFQ from Approved PR ({approvedPRs.length})
                    </button>
                )}
            </div>

            {/* RFQs List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--plum-700)' }}>
                    Loading quotation requests...
                </div>
            ) : rfqs.length === 0 ? (
                <div className="aura-card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Layers size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ fontWeight: 600 }}>No quotation requests created yet</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
                    {rfqs.map((rfq) => {
                        const isExpired = new Date() > new Date(rfq.closingDate);
                        const isAwarded = rfq.status === 'Awarded';
                        const lowestPrice = rfq.quotations?.length > 0
                            ? Math.min(...rfq.quotations.map(q => q.totalAmount))
                            : null;

                        return (
                            <div key={rfq._id} className="aura-card aura-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--plum-950)' }}>
                                                {rfq.rfqNumber}
                                            </span>
                                            <span className={`badge badge-${rfq.status?.toLowerCase()}`}>
                                                {rfq.status}
                                            </span>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: isExpired && !isAwarded ? 'var(--danger)' : 'var(--text-muted)'
                                        }}>
                                            <Clock size={13} />
                                            {isAwarded ? 'Awarded' : isExpired ? 'Deadline Passed' : `Closes: ${new Date(rfq.closingDate).toLocaleDateString()}`}
                                        </div>
                                    </div>

                                    {/* Associated PR & Department */}
                                    <div style={{ padding: '0.75rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                                            Against PR: <strong style={{ color: 'var(--plum-900)' }}>{rfq.purchaseRequest?.prNumber}</strong>
                                            {rfq.purchaseRequest?.department?.name && ` (${rfq.purchaseRequest.department.name})`}
                                        </div>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                            Items ({rfq.purchaseRequest?.items?.length || 0}):{' '}
                                            {rfq.purchaseRequest?.items?.map(i => `${i.quantity}x ${i.description}`).join(', ') || 'N/A'}
                                        </div>
                                    </div>

                                    {/* Quotation Stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                        <div style={{ padding: '0.65rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Invited Vendors</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--plum-950)' }}>
                                                {rfq.invitedVendors?.length || 0} Invited
                                            </div>
                                        </div>

                                        <div style={{ padding: '0.65rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quotes Received</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--peach-700)' }}>
                                                {rfq.quotations?.length || 0} Submitted
                                                {lowestPrice && (
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--success-text)', fontWeight: 600, marginLeft: '4px' }}>
                                                        (Min: ${lowestPrice.toLocaleString()})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Winner Announcement if Awarded */}
                                    {isAwarded && (
                                        <div style={{
                                            padding: '0.85rem 1rem',
                                            background: 'var(--success-bg)',
                                            border: '1px solid var(--success-border)',
                                            borderRadius: '8px',
                                            marginBottom: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.65rem'
                                        }}>
                                            <Trophy size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success-text)' }}>
                                                    Awarded to {rfq.selectedVendor?.companyName || 'Vendor'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>
                                                    Reason: &ldquo;{rfq.selectionReason}&rdquo;
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{
                                    paddingTop: '0.85rem',
                                    borderTop: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem'
                                }}>
                                    {/* Submit Quote Button */}
                                    {(isAdmin || isProcurement) && !isAwarded && !isExpired && (
                                        <button
                                            onClick={() => openQuoteModal(rfq)}
                                            className="btn-secondary"
                                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
                                        >
                                            <Plus size={14} /> Log Quotation
                                        </button>
                                    )}

                                    {/* Compare Quotes Matrix Button */}
                                    <button
                                        onClick={() => openComparisonModal(rfq)}
                                        className="btn-primary"
                                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem' }}
                                    >
                                        <Layers size={14} /> Compare Quotations ({rfq.quotations?.length || 0})
                                    </button>

                                    {/* Generate PO if Awarded */}
                                    {isAwarded && (isAdmin || isProcurement) && (
                                        <button
                                            onClick={() => navigate('/purchase-orders')}
                                            className="btn-peach"
                                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
                                        >
                                            View in POs <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal 1: Create RFQ from Approved PR */}
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
                                    Issue Request for Quotation (RFQ)
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Initiate formal competitive bidding from verified vendors
                                </p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRFQ} style={{ padding: '1.5rem' }}>
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

                            {/* Pick Approved PR */}
                            <div className="form-group">
                                <label className="form-label">Select Approved Purchase Request *</label>
                                <select
                                    required
                                    className="form-select"
                                    value={createFormData.purchaseRequestId}
                                    onChange={e => setCreateFormData({ ...createFormData, purchaseRequestId: e.target.value })}
                                >
                                    <option value="" disabled>Choose an approved PR...</option>
                                    {approvedPRs.map(pr => (
                                        <option key={pr._id} value={pr._id}>
                                            {pr.prNumber} • {pr.department?.name} • Est. ${pr.totalEstimatedCost?.toLocaleString()} ({pr.items?.length} items)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Closing Deadline Date */}
                            <div className="form-group">
                                <label className="form-label">Quotation Submission Deadline (Closing Date) *</label>
                                <input
                                    type="date"
                                    required
                                    className="form-input"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={createFormData.closingDate}
                                    onChange={e => setCreateFormData({ ...createFormData, closingDate: e.target.value })}
                                />
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Business rule: Late quotations submitted after this date will be automatically rejected.
                                </div>
                            </div>

                            {/* Select Vendors to Invite */}
                            <div className="form-group">
                                <label className="form-label">
                                    Invite Registered Vendors ({createFormData.invitedVendors.length} selected) *
                                </label>
                                <div style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '0.5rem'
                                }}>
                                    {allVendors.map(vendor => {
                                        const isSelected = createFormData.invitedVendors.includes(vendor._id);
                                        return (
                                            <div
                                                key={vendor._id}
                                                onClick={() => toggleVendorSelection(vendor._id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '6px',
                                                    background: isSelected ? 'var(--plum-100)' : 'transparent',
                                                    cursor: 'pointer',
                                                    marginBottom: '0.25rem',
                                                    transition: 'background 0.15s ease'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--plum-950)' }}>
                                                        {vendor.companyName}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                        {vendor.categories?.join(', ')} • Rating: {vendor.averageRating || 'New'}★
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createLoading} className="btn-peach">
                                    {createLoading ? 'Issuing RFQ...' : 'Issue RFQ to Vendors'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Submit Vendor Quotation */}
            {isSubmitQuoteModalOpen && selectedRFQ && (
                <div className="modal-overlay" onClick={() => setIsSubmitQuoteModalOpen(false)}>
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
                                    Log Quotation for {selectedRFQ.rfqNumber}
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Record received supplier bid pricing, tax, and lead time
                                </p>
                            </div>
                            <button onClick={() => setIsSubmitQuoteModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitQuote} style={{ padding: '1.5rem' }}>
                            {quoteError && (
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
                                    {quoteError}
                                </div>
                            )}

                            {/* Select Vendor from Invited List */}
                            <div className="form-group">
                                <label className="form-label">Vendor Submitting Bid *</label>
                                <select
                                    required
                                    className="form-select"
                                    value={quoteFormData.vendorId}
                                    onChange={e => setQuoteFormData({ ...quoteFormData, vendorId: e.target.value })}
                                >
                                    <option value="" disabled>Choose vendor...</option>
                                    {selectedRFQ.invitedVendors?.map(v => (
                                        <option key={v._id} value={v._id}>
                                            {v.companyName} • {v.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Quoted Price ($ Subtotal) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        className="form-input"
                                        placeholder="Subtotal amount"
                                        value={quoteFormData.quotedPrice}
                                        onChange={e => setQuoteFormData({ ...quoteFormData, quotedPrice: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tax / VAT Amount ($) *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        className="form-input"
                                        placeholder="Tax component"
                                        value={quoteFormData.taxAmount}
                                        onChange={e => setQuoteFormData({ ...quoteFormData, taxAmount: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Calculated Total Amount Box */}
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'var(--plum-50)',
                                border: '1px solid var(--plum-200)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1.25rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--plum-900)' }}>Total Bid Price:</span>
                                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    ${(Number(quoteFormData.quotedPrice || 0) + Number(quoteFormData.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Delivery Lead Time (Days) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="form-input"
                                        placeholder="e.g. 10 days"
                                        value={quoteFormData.deliveryLeadTimeDays}
                                        onChange={e => setQuoteFormData({ ...quoteFormData, deliveryLeadTimeDays: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Promised Delivery Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="form-input"
                                        value={quoteFormData.promisedDeliveryDate}
                                        onChange={e => setQuoteFormData({ ...quoteFormData, promisedDeliveryDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Payment Terms *</label>
                                <select
                                    className="form-select"
                                    value={quoteFormData.paymentTerms}
                                    onChange={e => setQuoteFormData({ ...quoteFormData, paymentTerms: e.target.value })}
                                >
                                    <option value="Net 15">Net 15</option>
                                    <option value="Net 30">Net 30</option>
                                    <option value="Net 60">Net 60</option>
                                    <option value="Due on Receipt">Due on Receipt</option>
                                    <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                                </select>
                            </div>

                            {/* Quotation Document File */}
                            <div className="form-group">
                                <label className="form-label">Upload Quotation Document (PDF or image)</label>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                    onChange={e => setQuoteFile(e.target.files[0])}
                                    style={{ fontSize: '0.8125rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsSubmitQuoteModalOpen(false)} className="btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" disabled={quoteLoading} className="btn-primary">
                                    {quoteLoading ? 'Recording Quote...' : 'Record Quotation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 3: SIDE-BY-SIDE QUOTATION COMPARISON MATRIX & AWARDING */}
            {isComparisonModalOpen && selectedRFQ && (
                <div className="modal-overlay" onClick={() => setIsComparisonModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '960px' }}>
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: 'var(--plum-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    Quotation Comparison Matrix • {selectedRFQ.rfqNumber}
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Standardized evaluation across identical requested quantities ({selectedRFQ.purchaseRequest?.items?.length} items)
                                </p>
                            </div>
                            <button onClick={() => setIsComparisonModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            {awardError && (
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
                                    {awardError}
                                </div>
                            )}

                            {/* Comparison Matrix Cards */}
                            {selectedRFQ.quotations?.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Layers size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <p style={{ fontWeight: 600 }}>No quotations have been logged for this RFQ yet.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Evaluation Criteria Callout */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: `repeat(${selectedRFQ.quotations.length}, minmax(240px, 1fr))`,
                                        gap: '1rem',
                                        overflowX: 'auto',
                                        paddingBottom: '1rem',
                                        marginBottom: '1.5rem'
                                    }}>
                                        {selectedRFQ.quotations.map((quote) => {
                                            const isLowest = quote.totalAmount === Math.min(...selectedRFQ.quotations.map(q => q.totalAmount));
                                            const isShortestLead = quote.deliveryLeadTimeDays === Math.min(...selectedRFQ.quotations.map(q => q.deliveryLeadTimeDays));
                                            const isSelected = awardVendorId === quote.vendor?._id;
                                            const isAlreadyAwarded = selectedRFQ.selectedVendor?._id === quote.vendor?._id;

                                            return (
                                                <div
                                                    key={quote._id}
                                                    onClick={() => !selectedRFQ.selectedVendor && setAwardVendorId(quote.vendor?._id)}
                                                    style={{
                                                        padding: '1.25rem',
                                                        borderRadius: 'var(--radius-lg)',
                                                        border: `2px solid ${isSelected || isAlreadyAwarded ? 'var(--plum-600)' : isLowest ? 'var(--success)' : 'var(--border-subtle)'}`,
                                                        background: isSelected || isAlreadyAwarded ? '#FAF2FC' : '#FFFFFF',
                                                        boxShadow: isLowest ? '0 4px 14px rgba(16, 185, 129, 0.15)' : 'var(--shadow-sm)',
                                                        cursor: selectedRFQ.selectedVendor ? 'default' : 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {/* Badges */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                                                        {isAlreadyAwarded && (
                                                            <span className="badge badge-approved" style={{ width: 'fit-content' }}>
                                                                <Trophy size={12} /> Awarded Vendor
                                                            </span>
                                                        )}
                                                        {isLowest && (
                                                            <span className="badge" style={{ width: 'fit-content', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                                                                <TrendingDown size={12} /> Lowest Valid Price
                                                            </span>
                                                        )}
                                                        {isShortestLead && (
                                                            <span className="badge" style={{ width: 'fit-content', background: 'var(--peach-100)', color: 'var(--peach-700)', border: '1px solid var(--peach-200)' }}>
                                                                <Truck size={12} /> Fastest Lead Time
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                                        {quote.vendor?.companyName}
                                                    </h4>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                                        {quote.vendor?.email}
                                                    </div>

                                                    {/* Price Breakdown */}
                                                    <div style={{ padding: '0.75rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            <span>Quoted Subtotal:</span>
                                                            <span>${quote.quotedPrice?.toLocaleString()}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            <span>Tax Amount:</span>
                                                            <span>+${quote.taxAmount?.toLocaleString()}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, color: 'var(--plum-950)', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-subtle)' }}>
                                                            <span>Final Total:</span>
                                                            <span>${quote.totalAmount?.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Metrics List */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-body)', marginBottom: '1rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Delivery Time:</span>
                                                            <strong>{quote.deliveryLeadTimeDays} days</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Promised Date:</span>
                                                            <strong>{new Date(quote.promisedDeliveryDate).toLocaleDateString()}</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Payment Terms:</span>
                                                            <strong>{quote.paymentTerms}</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Past Rating:</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700, color: 'var(--plum-900)' }}>
                                                                <Star size={12} fill="#F59E0B" color="#F59E0B" />
                                                                {quote.vendor?.averageRating ? Number(quote.vendor.averageRating).toFixed(1) : 'New'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {quote.documentUrl && (
                                                        <a
                                                            href={`http://localhost:5000${quote.documentUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.35rem',
                                                                fontSize: '0.75rem',
                                                                color: 'var(--plum-700)',
                                                                textDecoration: 'none',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            <FileText size={13} /> View Attached Quote
                                                        </a>
                                                    )}

                                                    {!selectedRFQ.selectedVendor && (isAdmin || isProcurement) && (
                                                        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                                            <input
                                                                type="radio"
                                                                name="awardRadio"
                                                                checked={isSelected}
                                                                onChange={() => setAwardVendorId(quote.vendor?._id)}
                                                                style={{ marginRight: '6px' }}
                                                            />
                                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--plum-900)' }}>
                                                                Select this Vendor
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Formal Awarding Decision Form */}
                                    {!selectedRFQ.selectedVendor && (isAdmin || isProcurement) && (
                                        <form onSubmit={handleAwardRFQ} style={{
                                            padding: '1.25rem',
                                            background: 'var(--plum-50)',
                                            border: '1px solid var(--plum-200)',
                                            borderRadius: 'var(--radius-lg)'
                                        }}>
                                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                                Vendor Award Decision & Audit Justification
                                            </h4>
                                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                Business rule: Record a detailed justification explaining why this vendor is selected (e.g. lowest compliant price, shortest delivery schedule, favorable payment terms).
                                            </p>

                                            <div className="form-group">
                                                <label className="form-label">Selection Reasoning * (Mandatory)</label>
                                                <textarea
                                                    required
                                                    rows="3"
                                                    className="form-textarea"
                                                    placeholder="State the commercial and technical evaluation justification for awarding this contract..."
                                                    value={awardReason}
                                                    onChange={e => setAwardReason(e.target.value)}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                <button type="button" onClick={() => setIsComparisonModalOpen(false)} className="btn-outline">
                                                    Cancel
                                                </button>
                                                <button type="submit" disabled={awardLoading || !awardVendorId} className="btn-peach">
                                                    <Trophy size={16} />
                                                    {awardLoading ? 'Awarding Contract...' : 'Award Contract to Selected Vendor'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}