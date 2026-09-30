import { useState, useEffect, useRef } from 'react';
import {
    BarChart3,
    Download,
    Calendar,
    Filter,
    Building2,
    DollarSign,
    FileCheck2,
    RefreshCw,
    Search,
    TrendingUp,
    CheckCircle2,
    Layers,
    FileText,
    Printer,
    Eye,
    X,
    ShieldCheck
} from 'lucide-react';
import API from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Logo from '../components/Logo';

export default function Reports() {
    const [orders, setOrders] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportingCSV, setExportingCSV] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    // Filter states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');
    const [selectedVendor, setSelectedVendor] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');

    // Quick preset active tracker
    const [activePreset, setActivePreset] = useState('All');

    // Fetch initial options (departments & vendors)
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [deptRes, vendorRes] = await Promise.all([
                    API.get('/departments').catch(() => ({ data: [] })),
                    API.get('/vendors').catch(() => ({ data: [] }))
                ]);
                setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
                setVendors(Array.isArray(vendorRes.data) ? vendorRes.data : []);
            } catch (err) {
                console.error('Failed to load filter options:', err);
            }
        };
        fetchFilterOptions();
    }, []);

    // Fetch filtered reports
    const fetchReports = async () => {
        try {
            setLoading(true);
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (selectedDept !== 'All') params.department = selectedDept;
            if (selectedVendor !== 'All') params.vendor = selectedVendor;
            if (selectedStatus !== 'All') params.status = selectedStatus;

            const res = await API.get('/analytics/reports', { params });
            const fetchedOrders = res?.data?.orders;
            setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [startDate, endDate, selectedDept, selectedVendor, selectedStatus]);

    // Handle Quick Date Presets
    const applyDatePreset = (preset) => {
        setActivePreset(preset);
        const now = new Date();
        if (preset === 'All') {
            setStartDate('');
            setEndDate('');
        } else if (preset === '30days') {
            const past = new Date();
            past.setDate(now.getDate() - 30);
            setStartDate(past.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (preset === 'thisMonth') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (preset === 'thisYear') {
            const firstDay = new Date(now.getFullYear(), 0, 1);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        }
    };

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedDept('All');
        setSelectedVendor('All');
        setSelectedStatus('All');
        setActivePreset('All');
        setSearchQuery('');
    };

    // Filter displayed orders by text search
    const safeOrders = Array.isArray(orders) ? orders : [];
    const filteredOrders = safeOrders.filter(o => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const poNum = (o?.poNumber || '').toLowerCase();
        const vName = (o?.vendor?.companyName || '').toLowerCase();
        const dName = (o?.department?.name || o?.department?.code || '').toLowerCase();
        return poNum.includes(q) || vName.includes(q) || dName.includes(q);
    });

    // Aggregate calculations safely
    const totalSpend = filteredOrders.reduce((sum, o) => sum + (Number(o?.finalTotal) || 0), 0);
    const totalSubtotal = filteredOrders.reduce((sum, o) => sum + (Number(o?.subtotal) || 0), 0);
    const totalTax = filteredOrders.reduce((sum, o) => sum + (Number(o?.taxAmount) || 0), 0);
    const avgOrderValue = filteredOrders.length > 0 ? (totalSpend / filteredOrders.length) : 0;
    const fulfilledOrders = filteredOrders.filter(o => ['Received', 'Closed'].includes(o?.status)).length;
    const fulfillmentRate = filteredOrders.length > 0 ? Math.round((fulfilledOrders / filteredOrders.length) * 100) : 0;

    // Export CSV handler
    const handleExportCSV = async () => {
        try {
            setExportingCSV(true);
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (selectedDept !== 'All') params.department = selectedDept;
            if (selectedVendor !== 'All') params.vendor = selectedVendor;
            if (selectedStatus !== 'All') params.status = selectedStatus;

            const response = await API.get('/analytics/reports/csv', {
                params,
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `eProcurement_Spend_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export CSV report:', err);
            alert('Failed to generate CSV export. Please try again.');
        } finally {
            setExportingCSV(false);
        }
    };

    // VIP PDF Export Handler with Fixed Precision Alignment
    const handleExportPDF = () => {
        try {
            setExportingPDF(true);
            const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

            const pageWidth = doc.internal.pageSize.width; // 841.89 pt
            const pageHeight = doc.internal.pageSize.height; // 595.28 pt

            // 1. Executive Brand Header Banner
            doc.setFillColor(36, 10, 46); // Deep Velvet Plum
            doc.rect(0, 0, pageWidth, 68, 'F');

            // Accent Coral line underneath banner
            doc.setFillColor(255, 126, 95); // Coral Peach
            doc.rect(0, 68, pageWidth, 3, 'F');

            // Header Typography
            doc.setTextColor(255, 126, 95);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('e-Procurement', 45, 43);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('•  Executive Procurement & Spend Audit Report', 198, 42);

            doc.setTextColor(255, 218, 207);
            doc.setFontSize(8.5);
            const generatedAt = new Date().toLocaleString();
            doc.text(`Generated: ${generatedAt}  |  CONFIDENTIAL`, pageWidth - 45, 42, { align: 'right' });

            // 2. Filter Summary Subtitle Bar
            doc.setFillColor(248, 242, 250);
            doc.roundedRect(45, 80, pageWidth - 90, 22, 3, 3, 'F');

            doc.setTextColor(70, 23, 86);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            const deptText = selectedDept === 'All' ? 'All Departments' : `Dept ID: ${selectedDept}`;
            const vendorText = selectedVendor === 'All' ? 'All Vendors' : `Vendor ID: ${selectedVendor}`;
            doc.text(
                `AUDIT SCOPE:   [ Department: ${deptText} ]    [ Vendor: ${vendorText} ]    [ Status: ${selectedStatus} ]    [ Date Range: ${startDate || 'All-Time'} to ${endDate || 'Present'} ]`,
                55,
                94
            );

            // 3. Four Elegant KPI Cards
            const cardY = 112;
            const cardWidth = 174;
            const cardHeight = 46;
            const cardGap = 18;

            const kpis = [
                { label: 'COMMITTED SPEND', val: `$${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [70, 23, 86] },
                { label: 'PURCHASE ORDERS', val: `${filteredOrders.length} Order${filteredOrders.length === 1 ? '' : 's'}`, color: [216, 74, 40] },
                { label: 'AVG. ORDER VALUE', val: `$${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [70, 23, 86] },
                { label: 'FULFILLMENT RATE', val: `${fulfillmentRate}% (${fulfilledOrders} Fulfilled)`, color: [5, 150, 105] }
            ];

            kpis.forEach((k, idx) => {
                const cardX = 45 + idx * (cardWidth + cardGap);
                doc.setFillColor(253, 250, 254);
                doc.setDrawColor(228, 208, 235);
                doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 5, 5, 'FD');

                doc.setTextColor(120, 100, 125);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.text(k.label, cardX + 12, cardY + 16);

                doc.setTextColor(k.color[0], k.color[1], k.color[2]);
                doc.setFontSize(11.5);
                doc.setFont('helvetica', 'bold');
                doc.text(k.val, cardX + 12, cardY + 34);
            });

            // 4. Formatted Table with Strict Fixed Column Widths (Sum = 750pt)
            const tableRows = filteredOrders.map(order => [
                order?.poNumber || 'N/A',
                order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
                order?.department?.code || order?.department?.name || 'N/A',
                order?.vendor?.companyName || 'N/A',
                `$${Number(order?.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `$${Number(order?.taxAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `$${Number(order?.finalTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                order?.status || 'N/A'
            ]);

            autoTable(doc, {
                startY: 172,
                margin: { left: 45, right: 46.89 },
                tableWidth: 750,
                head: [['PO Number', 'Issue Date', 'Department', 'Vendor Organization', 'Subtotal ($)', 'Tax 10% ($)', 'Total ($)', 'Order Status']],
                body: tableRows,
                foot: [[
                    'AUDIT TOTALS',
                    '',
                    '',
                    `${filteredOrders.length} Order(s)`,
                    `$${totalSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    `$${totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    `$${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    `${fulfillmentRate}% Fulfilled`
                ]],
                theme: 'grid',
                styles: {
                    cellPadding: 5.5,
                    fontSize: 8,
                    overflow: 'linebreak',
                    valign: 'middle',
                    lineColor: [238, 226, 242],
                    lineWidth: 0.5
                },
                headStyles: {
                    fillColor: [54, 16, 68], // Royal Plum
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8.5,
                    halign: 'left'
                },
                footStyles: {
                    fillColor: [246, 235, 250],
                    textColor: [44, 14, 54],
                    fontStyle: 'bold',
                    fontSize: 8.5
                },
                alternateRowStyles: {
                    fillColor: [253, 250, 254]
                },
                columnStyles: {
                    0: { cellWidth: 80, fontStyle: 'bold', textColor: [44, 14, 54], halign: 'left' },
                    1: { cellWidth: 65, halign: 'center' },
                    2: { cellWidth: 85, halign: 'center' },
                    3: { cellWidth: 180, halign: 'left' },
                    4: { cellWidth: 80, halign: 'right' },
                    5: { cellWidth: 70, halign: 'right' },
                    6: { cellWidth: 95, halign: 'right', fontStyle: 'bold', textColor: [44, 14, 54] },
                    7: { cellWidth: 95, halign: 'center' }
                }
            });

            // 5. Professional Document Footer on Every Page
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(228, 208, 235);
                doc.line(45, pageHeight - 26, pageWidth - 45, pageHeight - 26);

                doc.setFontSize(7.5);
                doc.setTextColor(135, 120, 140);
                doc.text(
                    'e-Procurement Enterprise Suite  •  Official Purchasing & Financial Audit Document  •  Strictly Confidential',
                    45,
                    pageHeight - 14
                );
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    pageWidth - 45,
                    pageHeight - 14,
                    { align: 'right' }
                );
            }

            doc.save(`eProcurement_Spend_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('PDF export failed:', err);
            alert('Failed to generate PDF export. Please try again.');
        } finally {
            setExportingPDF(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Received':
            case 'Closed':
                return 'badge-approved';
            case 'Partially Received':
                return 'badge-pending';
            case 'Issued':
                return 'badge-review';
            case 'Cancelled':
                return 'badge-rejected';
            default:
                return 'badge-draft';
        }
    };

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
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
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, var(--plum-800) 0%, var(--peach-500) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 14px rgba(87, 28, 107, 0.25)'
                        }}>
                            <BarChart3 size={20} />
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                            Procurement & Spend Analytics
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Real-time procurement metrics, departmental commitments, and exportable executive audits.
                    </p>
                </div>

                {/* Export & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={resetFilters}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                    >
                        <RefreshCw size={15} />
                        Reset
                    </button>

                    {/* Preview / Print Modal Button */}
                    <button
                        onClick={() => setPreviewModalOpen(true)}
                        disabled={filteredOrders.length === 0}
                        className="btn btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: '1px solid var(--plum-300)',
                            background: 'var(--plum-50)',
                            color: 'var(--plum-900)',
                            fontWeight: 700
                        }}
                    >
                        <Eye size={16} />
                        Preview & Print
                    </button>

                    {/* PDF Download Button */}
                    <button
                        onClick={handleExportPDF}
                        disabled={exportingPDF || filteredOrders.length === 0}
                        className="btn btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: '1px solid var(--peach-300)',
                            background: '#FFF5F0',
                            color: '#D84A28',
                            fontWeight: 700
                        }}
                    >
                        {exportingPDF ? (
                            <RefreshCw size={16} className="spin" />
                        ) : (
                            <FileText size={16} />
                        )}
                        {exportingPDF ? 'Building PDF...' : 'Download PDF Report'}
                    </button>

                    {/* CSV Export Button */}
                    <button
                        onClick={handleExportCSV}
                        disabled={exportingCSV || filteredOrders.length === 0}
                        className="btn btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'linear-gradient(135deg, var(--plum-800) 0%, var(--peach-600) 100%)',
                            boxShadow: '0 4px 14px rgba(87, 28, 107, 0.25)'
                        }}
                    >
                        {exportingCSV ? (
                            <RefreshCw size={16} className="spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        {exportingCSV ? 'Generating CSV...' : 'Export CSV'}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.75rem'
            }}>
                {/* Total Spend */}
                <div className="card" style={{
                    padding: '1.35rem',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '4px solid var(--plum-700)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Committed Spend
                        </span>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--plum-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--plum-800)' }}>
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--plum-950)', marginBottom: '0.2rem', fontVariantNumeric: 'tabular-nums' }}>
                        ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Across {filteredOrders.length} selected purchase order{filteredOrders.length === 1 ? '' : 's'}
                    </div>
                </div>

                {/* Total Orders */}
                <div className="card" style={{
                    padding: '1.35rem',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '4px solid var(--peach-500)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Purchase Orders
                        </span>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFF1EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D84A28' }}>
                            <FileCheck2 size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--plum-950)', marginBottom: '0.2rem', fontVariantNumeric: 'tabular-nums' }}>
                        {filteredOrders.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {fulfilledOrders} fully received / closed
                    </div>
                </div>

                {/* Avg Order Value */}
                <div className="card" style={{
                    padding: '1.35rem',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '4px solid var(--plum-500)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Avg Order Value
                        </span>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--plum-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--plum-800)' }}>
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--plum-950)', marginBottom: '0.2rem', fontVariantNumeric: 'tabular-nums' }}>
                        ${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Average value per issued PO
                    </div>
                </div>

                {/* Fulfillment Rate */}
                <div className="card" style={{
                    padding: '1.35rem',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '4px solid #10B981',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Fulfillment Rate
                        </span>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginBottom: '0.2rem', fontVariantNumeric: 'tabular-nums' }}>
                        {fulfillmentRate}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {fulfilledOrders} of {filteredOrders.length} completed
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={16} style={{ color: 'var(--peach-600)' }} />
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--plum-950)' }}>
                            Filter Audit Records
                        </h3>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Period:</span>
                        {[
                            { key: 'All', label: 'All Time' },
                            { key: '30days', label: 'Last 30 Days' },
                            { key: 'thisMonth', label: 'This Month' },
                            { key: 'thisYear', label: 'This Year' }
                        ].map(p => (
                            <button
                                key={p.key}
                                onClick={() => applyDatePreset(p.key)}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.75rem',
                                    fontWeight: activePreset === p.key ? 700 : 500,
                                    border: activePreset === p.key ? '1px solid var(--plum-600)' : '1px solid var(--border-subtle)',
                                    background: activePreset === p.key ? 'var(--plum-100)' : '#FFFFFF',
                                    color: activePreset === p.key ? 'var(--plum-900)' : 'var(--text-body)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Inputs Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    alignItems: 'flex-end'
                }}>
                    {/* Date From */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            From Date
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="date"
                                className="form-control"
                                value={startDate}
                                onChange={e => {
                                    setStartDate(e.target.value);
                                    setActivePreset('custom');
                                }}
                                style={{ paddingLeft: '2.25rem' }}
                            />
                            <Calendar size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>
                    </div>

                    {/* Date To */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            To Date
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="date"
                                className="form-control"
                                value={endDate}
                                onChange={e => {
                                    setEndDate(e.target.value);
                                    setActivePreset('custom');
                                }}
                                style={{ paddingLeft: '2.25rem' }}
                            />
                            <Calendar size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>
                    </div>

                    {/* Department */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            Department
                        </label>
                        <select
                            className="form-control"
                            value={selectedDept}
                            onChange={e => setSelectedDept(e.target.value)}
                        >
                            <option value="All">All Departments</option>
                            {departments.map(d => (
                                <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                            ))}
                        </select>
                    </div>

                    {/* Vendor */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            Vendor
                        </label>
                        <select
                            className="form-control"
                            value={selectedVendor}
                            onChange={e => setSelectedVendor(e.target.value)}
                        >
                            <option value="All">All Vendors</option>
                            {vendors.map(v => (
                                <option key={v._id} value={v._id}>{v.companyName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            Order Status
                        </label>
                        <select
                            className="form-control"
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value)}
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
            </div>

            {/* Table & Search Header */}
            <div className="card" style={{ overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: '#FAFAFB',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--plum-950)' }}>
                            Detailed Purchase Order Records
                        </h3>
                        <span className="badge" style={{ background: 'var(--plum-100)', color: 'var(--plum-800)', fontWeight: 700 }}>
                            {filteredOrders.length} records
                        </span>
                    </div>

                    {/* Search in table */}
                    <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by PO#, vendor, dept..."
                            className="form-control"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <RefreshCw size={28} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--plum-600)' }} />
                        <p style={{ fontWeight: 600 }}>Loading procurement report data...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Layers size={40} style={{ color: 'var(--plum-300)', margin: '0 auto 1rem' }} />
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--plum-950)', marginBottom: '0.4rem' }}>
                            No Purchase Orders Match Criteria
                        </h4>
                        <p style={{ fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                            Try adjusting the date range, selecting all departments or vendors, or clearing the search query.
                        </p>
                        <button onClick={resetFilters} className="btn btn-secondary">
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            minWidth: '1100px',
                            tableLayout: 'fixed',
                            borderCollapse: 'collapse',
                            fontFeatureSettings: "'tnum'"
                        }}>
                            <colgroup>
                                <col style={{ width: '13%' }} /> {/* PO NUMBER */}
                                <col style={{ width: '10%' }} /> {/* DATE */}
                                <col style={{ width: '13%' }} /> {/* DEPARTMENT */}
                                <col style={{ width: '24%' }} /> {/* VENDOR */}
                                <col style={{ width: '10%' }} /> {/* SUBTOTAL */}
                                <col style={{ width: '9%' }} />  {/* TAX (10%) */}
                                <col style={{ width: '11%' }} /> {/* TOTAL */}
                                <col style={{ width: '10%' }} /> {/* STATUS */}
                            </colgroup>
                            <thead>
                                <tr style={{ background: '#F8F7FA', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>PO NUMBER</th>
                                    <th style={{ padding: '0.9rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>DATE</th>
                                    <th style={{ padding: '0.9rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>DEPARTMENT</th>
                                    <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>VENDOR</th>
                                    <th style={{ padding: '0.9rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>SUBTOTAL</th>
                                    <th style={{ padding: '0.9rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>TAX (10%)</th>
                                    <th style={{ padding: '0.9rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>TOTAL</th>
                                    <th style={{ padding: '0.9rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr
                                        key={order?._id || Math.random()}
                                        style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#FAF7FB'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--plum-900)', whiteSpace: 'nowrap' }}>
                                            {order?.poNumber || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                                            <span className="badge" style={{ background: '#F3E8FF', color: '#6B21A8', fontWeight: 600 }}>
                                                {order?.department?.code || order?.department?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem' }}>
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    color: 'var(--plum-950)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                                title={order?.vendor?.companyName}
                                            >
                                                {order?.vendor?.companyName || 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-body)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                            ${(Number(order?.subtotal) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                            ${(Number(order?.taxAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 800, fontSize: '0.925rem', color: 'var(--plum-950)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                            ${(Number(order?.finalTotal) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            <span className={`badge ${getStatusBadgeClass(order?.status)}`}>
                                                {order?.status || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot style={{ background: '#F8F3FA', borderTop: '2px solid var(--plum-300)' }}>
                                <tr>
                                    <td colSpan="4" style={{ padding: '1.1rem 1.25rem', fontWeight: 800, color: 'var(--plum-950)', fontSize: '0.9rem' }}>
                                        AUDIT TOTALS ({filteredOrders.length} Orders)
                                    </td>
                                    <td style={{ padding: '1.1rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--plum-900)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                        ${totalSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '1.1rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                        ${totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '1.1rem 1.25rem', textAlign: 'right', fontWeight: 800, fontSize: '1.05rem', color: 'var(--plum-950)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                                        ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '1.1rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--peach-700)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        {fulfillmentRate}% Fulfilled
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Executive Document Preview & Print Modal */}
            {previewModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(29, 7, 36, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    overflowY: 'auto'
                }}>
                    <div style={{
                        maxWidth: '960px',
                        width: '100%',
                        maxHeight: '90vh',
                        background: '#FFFFFF',
                        borderRadius: '20px',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* Modal Toolbar */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            background: 'var(--plum-950)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '2px solid var(--peach-500)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <ShieldCheck size={20} style={{ color: 'var(--peach-400)' }} />
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                                        Executive Audit Preview
                                    </h3>
                                    <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Official Purchasing & Spend Ledger ({filteredOrders.length} orders)
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button
                                    onClick={() => window.print()}
                                    className="btn btn-secondary"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.45rem',
                                        padding: '0.45rem 1rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        background: '#FFFFFF',
                                        color: 'var(--plum-950)'
                                    }}
                                >
                                    <Printer size={15} />
                                    Print / Save Browser PDF
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    disabled={exportingPDF}
                                    className="btn btn-primary"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.45rem',
                                        padding: '0.45rem 1rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        background: 'linear-gradient(135deg, var(--plum-800), var(--peach-500))'
                                    }}
                                >
                                    <Download size={15} />
                                    Download Vector PDF
                                </button>
                                <button
                                    onClick={() => setPreviewModalOpen(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#FFFFFF',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <X size={22} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body / Printable Letterhead Sheet */}
                        <div style={{
                            padding: '2.5rem',
                            overflowY: 'auto',
                            background: '#FDFBFD'
                        }}>
                            {/* Document Sheet */}
                            <div style={{
                                background: '#FFFFFF',
                                border: '1px solid #EAE1EA',
                                borderRadius: '12px',
                                padding: '2.5rem',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                            }}>
                                {/* Top Banner */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderBottom: '2px solid var(--peach-500)',
                                    paddingBottom: '1.25rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <Logo size={40} variant="full" textColor="dark" />
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                            OFFICIAL PROCUREMENT AUDIT
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Date: {new Date().toLocaleDateString()} | Ref: AUD-{Date.now().toString(36).toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                {/* KPI Summary Bar in Document */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '1rem',
                                    marginBottom: '1.5rem',
                                    background: 'var(--plum-50)',
                                    padding: '1rem',
                                    borderRadius: '8px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>COMMITTED SPEND</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                            ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PURCHASE ORDERS</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D84A28' }}>
                                            {filteredOrders.length}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>AVG. ORDER VALUE</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                            ${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>FULFILLMENT RATE</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
                                            {fulfillmentRate}%
                                        </div>
                                    </div>
                                </div>

                                {/* Table inside preview */}
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '2rem' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--plum-900)', color: '#FFFFFF' }}>
                                            <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left' }}>PO #</th>
                                            <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left' }}>DATE</th>
                                            <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left' }}>DEPT</th>
                                            <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left' }}>VENDOR</th>
                                            <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>SUBTOTAL</th>
                                            <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>TAX (10%)</th>
                                            <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>TOTAL</th>
                                            <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map(o => (
                                            <tr key={o?._id} style={{ borderBottom: '1px solid #EAE1EA' }}>
                                                <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>{o?.poNumber}</td>
                                                <td style={{ padding: '0.65rem 0.75rem' }}>{o?.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</td>
                                                <td style={{ padding: '0.65rem 0.75rem' }}>{o?.department?.code || o?.department?.name}</td>
                                                <td style={{ padding: '0.65rem 0.75rem' }}>{o?.vendor?.companyName}</td>
                                                <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>${(Number(o?.subtotal) || 0).toFixed(2)}</td>
                                                <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>${(Number(o?.taxAmount) || 0).toFixed(2)}</td>
                                                <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>${(Number(o?.finalTotal) || 0).toFixed(2)}</td>
                                                <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>{o?.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot style={{ background: '#FAF2FC', fontWeight: 800 }}>
                                        <tr>
                                            <td colSpan="4" style={{ padding: '0.75rem' }}>TOTALS</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>${totalSubtotal.toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>${totalTax.toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--plum-950)' }}>${totalSpend.toFixed(2)}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>{fulfillmentRate}%</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {/* Footer Signoff */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: '1.5rem',
                                    borderTop: '1px solid #EAE1EA',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    <div>
                                        Prepared By: Procurement Officer<br />
                                        Signature: __________________________
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        Approved By: Financial Controller<br />
                                        Signature: __________________________
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}