import { useEffect, useState, useContext } from 'react';
import {
    Star,
    Award,
    Clock,
    CheckCircle2,
    AlertCircle,
    Building2,
    FileCheck2,
    Plus,
    X,
    MessageSquare,
    ShieldAlert
} from 'lucide-react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function VendorRatings() {
    const { isAdmin, isProcurement } = useContext(AuthContext);
    const [eligiblePOs, setEligiblePOs] = useState([]);
    const [ratingsHistory, setRatingsHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'

    // Rating Modal
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [timelinessScore, setTimelinessScore] = useState(5);
    const [qualityScore, setQualityScore] = useState(5);
    const [communicationScore, setCommunicationScore] = useState(5);
    const [issueNotes, setIssueNotes] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [ratingLoading, setRatingLoading] = useState(false);
    const [ratingError, setRatingError] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [eligibleRes, historyRes] = await Promise.all([
                API.get('/analytics/eligible-pos-for-rating'),
                API.get('/analytics/ratings')
            ]);
            setEligiblePOs(eligibleRes.data || []);
            setRatingsHistory(historyRes.data || []);
        } catch (err) {
            console.error('Failed to load rating data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openRatingModal = (po) => {
        setSelectedPO(po);
        setTimelinessScore(5);
        setQualityScore(5);
        setCommunicationScore(5);
        setIssueNotes('');
        setResolutionNotes('');
        setRatingError('');
        setIsRatingModalOpen(true);
    };

    const handleRatingSubmit = async (e) => {
        e.preventDefault();
        setRatingError('');
        setRatingLoading(true);

        try {
            await API.post('/analytics/rate-vendor', {
                vendorId: selectedPO.vendor?._id,
                purchaseOrderId: selectedPO._id,
                timelinessScore,
                qualityScore,
                communicationScore,
                issueNotes,
                resolutionNotes
            });
            setIsRatingModalOpen(false);
            fetchData();
        } catch (err) {
            setRatingError(err.response?.data?.message || 'Rating submission failed');
        } finally {
            setRatingLoading(false);
        }
    };

    const StarRatingInput = ({ label, value, onChange }) => {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>{label}</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            type="button"
                            key={star}
                            onClick={() => onChange(star)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px'
                            }}
                        >
                            <Star
                                size={20}
                                fill={star <= value ? '#F59E0B' : 'transparent'}
                                color={star <= value ? '#F59E0B' : '#CBD5E1'}
                            />
                        </button>
                    ))}
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, marginLeft: '6px', minWidth: '24px', color: 'var(--plum-950)' }}>
                        {value}.0
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.75rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--plum-950)', margin: 0 }}>
                    Vendor Performance & Quality Ratings
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
                    Post-delivery compliance assessment across delivery timeliness, product quality, and communication
                </p>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <button
                    onClick={() => setActiveTab('pending')}
                    style={{
                        padding: '0.55rem 1.1rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: activeTab === 'pending' ? 'var(--plum-700)' : 'transparent',
                        color: activeTab === 'pending' ? '#FFFFFF' : 'var(--text-muted)',
                        fontWeight: activeTab === 'pending' ? 700 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                    }}
                >
                    <Clock size={16} />
                    Orders Awaiting Evaluation ({eligiblePOs.length})
                </button>

                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '0.55rem 1.1rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: activeTab === 'history' ? 'var(--plum-700)' : 'transparent',
                        color: activeTab === 'history' ? '#FFFFFF' : 'var(--text-muted)',
                        fontWeight: activeTab === 'history' ? 700 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                    }}
                >
                    <Award size={16} />
                    Evaluation Audit History ({ratingsHistory.length})
                </button>
            </div>

            {/* Tab 1: Orders Awaiting Evaluation */}
            {activeTab === 'pending' && (
                <div className="aura-table-container">
                    <table className="aura-table">
                        <thead>
                            <tr>
                                <th>PO Number</th>
                                <th>Vendor</th>
                                <th>Department</th>
                                <th>Order Total</th>
                                <th>Current Vendor Rating</th>
                                <th>Fulfillment Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--plum-700)' }}>
                                        Checking delivery verification records...
                                    </td>
                                </tr>
                            ) : eligiblePOs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                                        <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.5rem' }} />
                                        <p style={{ fontWeight: 600 }}>All eligible received orders have been evaluated!</p>
                                        <p style={{ fontSize: '0.78rem' }}>Business rule: Evaluation is unlocked as soon as goods are recorded via GRN.</p>
                                    </td>
                                </tr>
                            ) : (
                                eligiblePOs.map((po) => (
                                    <tr key={po._id}>
                                        <td style={{ fontWeight: 800, color: 'var(--plum-950)' }}>{po.poNumber}</td>
                                        <td style={{ fontWeight: 600 }}>{po.vendor?.companyName}</td>
                                        <td>{po.department?.name}</td>
                                        <td style={{ fontWeight: 700 }}>${po.finalTotal?.toLocaleString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                                                <span style={{ fontWeight: 700 }}>{po.vendor?.averageRating || 'New'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${po.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {(isAdmin || isProcurement) && (
                                                <button
                                                    onClick={() => openRatingModal(po)}
                                                    className="btn-peach"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                                                >
                                                    <Star size={14} /> Rate Vendor
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tab 2: Evaluation Audit History */}
            {activeTab === 'history' && (
                <div className="aura-table-container">
                    <table className="aura-table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Purchase Order</th>
                                <th>Overall Score</th>
                                <th>Timeliness</th>
                                <th>Quality</th>
                                <th>Communication</th>
                                <th>Evaluated By</th>
                                <th>Notes / Issues</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--plum-700)' }}>
                                        Loading evaluations...
                                    </td>
                                </tr>
                            ) : ratingsHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                                        <Award size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                        <p style={{ fontWeight: 600 }}>No performance reviews logged yet</p>
                                    </td>
                                </tr>
                            ) : (
                                ratingsHistory.map((r) => (
                                    <tr key={r._id}>
                                        <td style={{ fontWeight: 700, color: 'var(--plum-950)' }}>
                                            {r.vendor?.companyName}
                                        </td>
                                        <td>{r.purchaseOrder?.poNumber || 'N/A'}</td>
                                        <td>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: '#FEF3C7', borderRadius: '6px', fontWeight: 800, color: '#92400E' }}>
                                                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                                                {r.overallScore}★
                                            </div>
                                        </td>
                                        <td>{r.timelinessScore}★</td>
                                        <td>{r.qualityScore}★</td>
                                        <td>{r.communicationScore}★</td>
                                        <td>{r.evaluatedBy?.name || 'Officer'}</td>
                                        <td style={{ maxWidth: '240px', fontSize: '0.78rem' }}>
                                            {r.issueNotes ? (
                                                <span style={{ color: 'var(--danger-text)' }}>Issue: {r.issueNotes}</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>No issues noted</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal: Rate Vendor Performance */}
            {isRatingModalOpen && selectedPO && (
                <div className="modal-overlay" onClick={() => setIsRatingModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
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
                                    Evaluate {selectedPO.vendor?.companyName}
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Against fulfilled Purchase Order {selectedPO.poNumber}
                                </p>
                            </div>
                            <button onClick={() => setIsRatingModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRatingSubmit} style={{ padding: '1.5rem' }}>
                            {ratingError && (
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
                                    {ratingError}
                                </div>
                            )}

                            {/* Computed Score Banner */}
                            <div style={{
                                padding: '1rem',
                                background: 'linear-gradient(135deg, var(--plum-800), var(--peach-600))',
                                color: '#FFFFFF',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '1.25rem'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Computed Overall Score
                                    </div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem' }}>
                                        {(((timelinessScore + qualityScore + communicationScore) / 3).toFixed(2))} / 5.0 ★
                                    </div>
                                </div>
                                <Award size={36} style={{ opacity: 0.8 }} />
                            </div>

                            {/* Scoring Inputs */}
                            <StarRatingInput
                                label="1. Delivery Timeliness (Punctuality & Schedule)"
                                value={timelinessScore}
                                onChange={setTimelinessScore}
                            />

                            <StarRatingInput
                                label="2. Product / Service Quality (Specification Compliance)"
                                value={qualityScore}
                                onChange={setQualityScore}
                            />

                            <StarRatingInput
                                label="3. Communication & Support (Responsiveness)"
                                value={communicationScore}
                                onChange={setCommunicationScore}
                            />

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Vendor Issues Logged (Optional)</label>
                                <textarea
                                    rows="2"
                                    className="form-textarea"
                                    placeholder="Note any delayed shipments, damaged items, or invoice discrepancies..."
                                    value={issueNotes}
                                    onChange={e => setIssueNotes(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Resolution / Corrective Actions (Optional)</label>
                                <textarea
                                    rows="2"
                                    className="form-textarea"
                                    placeholder="Explain how the issues were resolved with the vendor..."
                                    value={resolutionNotes}
                                    onChange={e => setResolutionNotes(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsRatingModalOpen(false)} className="btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" disabled={ratingLoading} className="btn-peach">
                                    {ratingLoading ? 'Submitting Evaluation...' : 'Submit Evaluation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
