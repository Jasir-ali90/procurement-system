import { useEffect, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    DollarSign,
    Clock,
    FileText,
    Truck,
    Building2,
    Star,
    Layers,
    ArrowUpRight,
    Plus,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Shield,
    Users,
    PackageCheck
} from 'lucide-react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
    const { user, isAdmin, isProcurement, isDepartmentUser } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchStats = async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/analytics/dashboard');
            setStats(data);
        } catch (err) {
            setError('Failed to load dashboard metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--plum-700)' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    margin: '0 auto 1rem',
                    borderRadius: '50%',
                    border: '3px solid var(--plum-200)',
                    borderTopColor: 'var(--plum-600)',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ fontWeight: 600 }}>Loading procurement intelligence...</p>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '2rem', background: '#fff', borderRadius: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <AlertCircle size={36} color="var(--danger)" style={{ margin: '0 auto 0.75rem' }} />
                <h3>Failed to load dashboard</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
                <button onClick={fetchStats} className="btn-primary">Try Again</button>
            </div>
        );
    }

    const totalSpendAllDepts = stats.departmentSpend?.reduce((acc, d) => acc + d.total, 0) || 1;

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            {/* Header Greeting & Quick Actions */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--plum-950)', letterSpacing: '-0.02em', margin: 0 }}>
                            Welcome back, {user?.name?.split(' ')[0]}
                        </h1>
                        <span className="badge badge-draft" style={{ fontSize: '0.72rem' }}>
                            {user?.role}
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                        {user?.department?.name ? `${user.department.name} Department • ` : ''}
                        Enterprise Procurement & Vendor Management Dashboard
                    </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                    <Link to="/purchase-requests" className="btn-peach">
                        <Plus size={16} />
                        New Purchase Request
                    </Link>
                    {(isAdmin || isProcurement) && (
                        <>
                            <Link to="/vendors" className="btn-primary">
                                <Building2 size={16} />
                                Register Vendor
                            </Link>
                            <Link to="/rfqs" className="btn-secondary">
                                <Layers size={16} />
                                Issue RFQ
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Top KPI Cards (Plum & Peach Theme) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem'
            }}>
                {/* KPI 1: Monthly Total Spend */}
                <div className="aura-card aura-card-hover" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '120px',
                        height: '120px',
                        background: 'radial-gradient(circle, rgba(255, 126, 95, 0.15) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Purchasing Volume
                        </span>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'var(--peach-100)',
                            color: 'var(--peach-600)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--plum-950)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
                        ${(stats.monthlyPurchasingTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                        <TrendingUp size={14} />
                        <span>Active Orders in Pipeline</span>
                    </div>
                </div>

                {/* KPI 2: Pending Approvals */}
                <div className="aura-card aura-card-hover" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Pending PR Approvals
                        </span>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'var(--plum-100)',
                            color: 'var(--plum-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Clock size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--plum-950)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
                        {stats.pendingPRs}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: stats.pendingPRs > 0 ? 'var(--peach-700)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {stats.pendingPRs > 0 ? 'Action required by approvers' : 'All requests reviewed'}
                    </div>
                </div>

                {/* KPI 3: Open RFQs & Quotations */}
                <div className="aura-card aura-card-hover" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Open RFQs & Bidding
                        </span>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'var(--plum-50)',
                            color: 'var(--plum-800)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Layers size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--plum-950)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
                        {stats.openRFQs}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Active quotation collections
                    </div>
                </div>

                {/* KPI 4: Open POs & Deliveries */}
                <div className="aura-card aura-card-hover" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Active Purchase Orders
                        </span>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'var(--peach-100)',
                            color: 'var(--peach-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Truck size={20} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--plum-950)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
                        {stats.openPOs}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: stats.partiallyReceivedPOs > 0 ? 'var(--warning-text)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {stats.partiallyReceivedPOs} partially received orders
                    </div>
                </div>
            </div>

            {/* Middle Section: Department Spend Breakdown & Vendor Ratings */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Department Spending Card */}
                <div className="aura-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--plum-950)', margin: 0 }}>
                                Spend Allocation by Department
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                                Total committed procurement expenditure
                            </p>
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--plum-700)' }}>
                            {stats.departmentSpend?.length || 0} Departments
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {stats.departmentSpend && stats.departmentSpend.length > 0 ? (
                            stats.departmentSpend.map((dept, index) => {
                                const percentage = Math.round((dept.total / totalSpendAllDepts) * 100);
                                return (
                                    <div key={index}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.35rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                {dept.departmentName} ({dept.departmentCode})
                                            </span>
                                            <span style={{ fontWeight: 700, color: 'var(--plum-900)' }}>
                                                ${dept.total.toLocaleString()} ({percentage}%)
                                            </span>
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            height: '8px',
                                            borderRadius: '4px',
                                            background: 'var(--plum-50)',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${percentage}%`,
                                                height: '100%',
                                                borderRadius: '4px',
                                                background: index % 2 === 0
                                                    ? 'linear-gradient(90deg, var(--plum-700), var(--plum-500))'
                                                    : 'linear-gradient(90deg, var(--peach-500), var(--peach-600))',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No department spend data yet.</p>
                        )}
                    </div>
                </div>

                {/* Top Vendors Leaderboard */}
                <div className="aura-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--plum-950)', margin: 0 }}>
                                Top Strategic Vendors
                            </h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                                Highest spend partners & performance ratings
                            </p>
                        </div>
                        <Link to="/vendors" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--plum-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            View all <ArrowUpRight size={14} />
                        </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {stats.topVendors && stats.topVendors.length > 0 ? (
                            stats.topVendors.map((vendor, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--plum-50)',
                                    border: '1px solid var(--border-subtle)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '34px',
                                            height: '34px',
                                            borderRadius: '8px',
                                            background: '#FFFFFF',
                                            color: 'var(--plum-700)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '0.8125rem',
                                            border: '1px solid var(--border-subtle)'
                                        }}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--plum-950)' }}>
                                                {vendor.companyName}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {vendor.ordersCount} Order{vendor.ordersCount > 1 ? 's' : ''} • ${vendor.totalSpend?.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#FFFFFF', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                        <Star size={14} fill="#F59E0B" color="#F59E0B" />
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                            {vendor.rating ? Number(vendor.rating).toFixed(1) : 'New'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No vendor order data yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Activity / Purchase Requests Table */}
            <div className="aura-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--plum-950)', margin: 0 }}>
                            Recent Purchase Requests
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                            Latest requests submitted across departments
                        </p>
                    </div>
                    <Link to="/purchase-requests" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--plum-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        View all PRs <ArrowUpRight size={14} />
                    </Link>
                </div>

                <div className="aura-table-container">
                    <table className="aura-table">
                        <thead>
                            <tr>
                                <th>PR Number</th>
                                <th>Department</th>
                                <th>Requester</th>
                                <th>Items</th>
                                <th>Estimated Total</th>
                                <th>Priority</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentPRs && stats.recentPRs.length > 0 ? (
                                stats.recentPRs.map((pr) => (
                                    <tr key={pr._id}>
                                        <td>
                                            <Link to="/purchase-requests" style={{ fontWeight: 700, color: 'var(--plum-700)', textDecoration: 'none' }}>
                                                {pr.prNumber}
                                            </Link>
                                        </td>
                                        <td>{pr.department?.name || 'N/A'}</td>
                                        <td>{pr.requester?.name || 'N/A'}</td>
                                        <td>{pr.items?.length || 0} line items</td>
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
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                        No purchase requests logged yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}