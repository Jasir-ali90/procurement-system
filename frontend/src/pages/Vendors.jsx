import { useEffect, useState, useContext } from 'react';
import {
    Plus,
    Search,
    Building2,
    Mail,
    Phone,
    MapPin,
    FileText,
    Star,
    Archive,
    RotateCcw,
    Edit3,
    Eye,
    Tag,
    DollarSign,
    Upload,
    AlertCircle,
    CheckCircle2,
    X,
    ExternalLink
} from 'lucide-react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function Vendors() {
    const { isAdmin, isProcurement } = useContext(AuthContext);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('active'); // active, archived, all
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [selectedVendor, setSelectedVendor] = useState(null);
    const [vendorProfile, setVendorProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Form State
    const initialForm = {
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        taxNumber: '',
        paymentTerms: 'Net 30',
        categories: ''
    };
    const [formData, setFormData] = useState(initialForm);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 9,
                status: statusFilter
            };
            if (search) params.search = search;
            if (categoryFilter !== 'All') params.category = categoryFilter;

            const { data } = await API.get('/vendors', { params });
            setVendors(data.vendors || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error('Failed to load vendors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, [currentPage, categoryFilter, statusFilter]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchVendors();
    };

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    // Create / Update Vendor
    const handleSaveVendor = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        const formPayload = new FormData();
        formPayload.append('companyName', formData.companyName);
        formPayload.append('contactPerson', formData.contactPerson);
        formPayload.append('email', formData.email);
        formPayload.append('phone', formData.phone);
        formPayload.append('address', formData.address);
        formPayload.append('taxNumber', formData.taxNumber);
        formPayload.append('paymentTerms', formData.paymentTerms);
        formPayload.append('categories', formData.categories);

        selectedFiles.forEach(file => {
            formPayload.append('documents', file);
        });

        try {
            if (isEditModalOpen && selectedVendor) {
                await API.put(`/vendors/${selectedVendor._id}`, formPayload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setIsEditModalOpen(false);
            } else {
                await API.post('/vendors', formPayload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setIsCreateModalOpen(false);
            }
            setFormData(initialForm);
            setSelectedFiles([]);
            setSelectedVendor(null);
            fetchVendors();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Vendor save failed');
        } finally {
            setFormLoading(false);
        }
    };

    // Toggle Archive / Restore
    const handleToggleArchive = async (vendor) => {
        const action = vendor.isArchived ? 'restore' : 'archive';
        if (!window.confirm(`Are you sure you want to ${action} ${vendor.companyName}?`)) return;
        try {
            await API.patch(`/vendors/${vendor._id}/toggle-archive`);
            fetchVendors();
        } catch (err) {
            alert(err.response?.data?.message || 'Archive toggle failed');
        }
    };

    // Open Edit Modal
    const openEditModal = (vendor) => {
        setSelectedVendor(vendor);
        setFormData({
            companyName: vendor.companyName,
            contactPerson: vendor.contactPerson,
            email: vendor.email,
            phone: vendor.phone,
            address: vendor.address,
            taxNumber: vendor.taxNumber,
            paymentTerms: vendor.paymentTerms,
            categories: Array.isArray(vendor.categories) ? vendor.categories.join(', ') : ''
        });
        setSelectedFiles([]);
        setFormError('');
        setIsEditModalOpen(true);
    };

    // Open Detail Modal & Fetch Deep Profile
    const openDetailModal = async (vendor) => {
        setSelectedVendor(vendor);
        setIsDetailModalOpen(true);
        setProfileLoading(true);
        try {
            const { data } = await API.get(`/vendors/${vendor._id}`);
            setVendorProfile(data);
        } catch (err) {
            console.error('Failed to load vendor profile:', err);
        } finally {
            setProfileLoading(false);
        }
    };

    const categoriesList = ['All', 'Hardware', 'IT Services', 'Cloud Infrastructure', 'Office Supplies', 'Furniture', 'Maintenance', 'Logistics'];

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
                        Vendor Management
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.2rem 0 0 0' }}>
                        Supplier onboarding, document compliance, category grouping, and performance analytics
                    </p>
                </div>

                {(isAdmin || isProcurement) && (
                    <button
                        onClick={() => {
                            setFormData(initialForm);
                            setSelectedFiles([]);
                            setFormError('');
                            setIsCreateModalOpen(true);
                        }}
                        className="btn-primary"
                    >
                        <Plus size={16} />
                        Register New Vendor
                    </button>
                )}
            </div>

            {/* Filter & Search Bar */}
            <div className="aura-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                    <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '420px' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="text"
                                className="form-input"
                                style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', height: '38px', fontSize: '0.8125rem' }}
                                placeholder="Search by name, contact, email or tax ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 0.9rem' }}>
                            Search
                        </button>
                    </form>

                    {/* Active vs Archived Toggle */}
                    <div style={{ display: 'flex', background: 'var(--plum-50)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                        <button
                            onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
                            style={{
                                padding: '0.4rem 0.9rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: statusFilter === 'active' ? '#FFFFFF' : 'transparent',
                                color: statusFilter === 'active' ? 'var(--plum-900)' : 'var(--text-muted)',
                                fontWeight: statusFilter === 'active' ? 700 : 500,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                boxShadow: statusFilter === 'active' ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            Active Vendors
                        </button>
                        <button
                            onClick={() => { setStatusFilter('archived'); setCurrentPage(1); }}
                            style={{
                                padding: '0.4rem 0.9rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: statusFilter === 'archived' ? '#FFFFFF' : 'transparent',
                                color: statusFilter === 'archived' ? 'var(--plum-900)' : 'var(--text-muted)',
                                fontWeight: statusFilter === 'archived' ? 700 : 500,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                boxShadow: statusFilter === 'archived' ? 'var(--shadow-sm)' : 'none'
                            }}
                        >
                            Archived ({statusFilter === 'archived' ? vendors.length : 'View'})
                        </button>
                    </div>
                </div>

                {/* Category Pills Filter */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                        Category:
                    </span>
                    {categoriesList.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                            style={{
                                padding: '0.25rem 0.65rem',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid ' + (categoryFilter === cat ? 'var(--plum-600)' : 'var(--border-subtle)'),
                                background: categoryFilter === cat ? 'var(--plum-100)' : '#FFFFFF',
                                color: categoryFilter === cat ? 'var(--plum-800)' : 'var(--text-body)',
                                fontWeight: categoryFilter === cat ? 700 : 500,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Vendor Cards Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--plum-700)' }}>
                    Loading supplier database...
                </div>
            ) : vendors.length === 0 ? (
                <div className="aura-card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Building2 size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ fontWeight: 600 }}>No vendors found matching your current filter criteria</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem'
                }}>
                    {vendors.map((vendor) => (
                        <div
                            key={vendor._id}
                            className="aura-card aura-card-hover"
                            style={{
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                opacity: vendor.isArchived ? 0.75 : 1
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--plum-950)', margin: 0 }}>
                                            {vendor.companyName}
                                        </h3>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                            Contact: <strong>{vendor.contactPerson}</strong>
                                        </div>
                                    </div>

                                    {/* Rating Chip */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        background: 'var(--plum-50)',
                                        border: '1px solid var(--plum-200)',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '8px'
                                    }}>
                                        <Star size={14} fill="#F59E0B" color="#F59E0B" />
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--plum-950)' }}>
                                            {vendor.averageRating ? Number(vendor.averageRating).toFixed(1) : 'New'}
                                        </span>
                                    </div>
                                </div>

                                {/* Categories */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                                    {vendor.categories?.map((cat, i) => (
                                        <span key={i} className="badge" style={{ background: '#FAF2FC', color: 'var(--plum-800)', border: '1px solid var(--plum-200)', fontSize: '0.68rem' }}>
                                            {cat}
                                        </span>
                                    ))}
                                </div>

                                {/* Contact Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-body)', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={14} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                                        <span>{vendor.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Phone size={14} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                                        <span>{vendor.phone}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={14} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {vendor.address}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer & Actions */}
                            <div style={{
                                paddingTop: '0.85rem',
                                borderTop: '1px solid var(--border-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    Tax: <strong>{vendor.taxNumber}</strong> • {vendor.paymentTerms}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <button
                                        onClick={() => openDetailModal(vendor)}
                                        className="btn-outline"
                                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                        title="View Vendor Performance Profile"
                                    >
                                        <Eye size={14} /> Profile
                                    </button>

                                    {(isAdmin || isProcurement) && (
                                        <>
                                            <button
                                                onClick={() => openEditModal(vendor)}
                                                className="btn-secondary"
                                                style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
                                                title="Edit Vendor"
                                            >
                                                <Edit3 size={14} />
                                            </button>

                                            <button
                                                onClick={() => handleToggleArchive(vendor)}
                                                className="btn-outline"
                                                style={{
                                                    padding: '0.35rem 0.55rem',
                                                    fontSize: '0.75rem',
                                                    color: vendor.isArchived ? 'var(--success-text)' : 'var(--danger)',
                                                    borderColor: vendor.isArchived ? 'var(--success-border)' : 'var(--danger-border)'
                                                }}
                                                title={vendor.isArchived ? 'Restore Vendor' : 'Archive Vendor'}
                                            >
                                                {vendor.isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}
                    >
                        Previous
                    </button>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-body)' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Modal 1: Create or Edit Vendor */}
            {(isCreateModalOpen || isEditModalOpen) && (
                <div className="modal-overlay" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>
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
                                    {isEditModalOpen ? `Edit ${selectedVendor?.companyName}` : 'Register New Vendor'}
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Provide supplier legal entity credentials and category capabilities
                                </p>
                            </div>
                            <button
                                onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveVendor} style={{ padding: '1.5rem' }}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Company Legal Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="e.g. Apex Tech Solutions Inc."
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Contact Person *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="Full name of representative"
                                        value={formData.contactPerson}
                                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Official Email Address *</label>
                                    <input
                                        type="email"
                                        required
                                        className="form-input"
                                        placeholder="contact@company.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Physical / Delivery Address *</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="Street, Suite, City, State, ZIP"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Tax ID Number (TIN) *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="TAX-XXXX-YYYY"
                                        value={formData.taxNumber}
                                        onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Payment Terms *</label>
                                    <select
                                        className="form-select"
                                        value={formData.paymentTerms}
                                        onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    >
                                        <option value="Net 15">Net 15</option>
                                        <option value="Net 30">Net 30</option>
                                        <option value="Net 60">Net 60</option>
                                        <option value="Due on Receipt">Due on Receipt</option>
                                        <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Supply Categories (comma-separated)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Hardware, IT Services, Maintenance"
                                    value={formData.categories}
                                    onChange={e => setFormData({ ...formData, categories: e.target.value })}
                                />
                            </div>

                            {/* File Upload */}
                            <div className="form-group">
                                <label className="form-label">
                                    Upload Compliance Documents (PDF, DOCX, PNG, JPG • Max 5MB)
                                </label>
                                <div style={{
                                    border: '2px dashed var(--border-subtle)',
                                    padding: '1.25rem',
                                    borderRadius: 'var(--radius-md)',
                                    textAlign: 'center',
                                    background: '#FAF8FA'
                                }}>
                                    <Upload size={24} style={{ color: 'var(--plum-500)', marginBottom: '0.4rem' }} />
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-body)', marginBottom: '0.4rem' }}>
                                        Drag & drop files or click below
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                        onChange={handleFileChange}
                                        style={{ fontSize: '0.78rem' }}
                                    />
                                    {selectedFiles.length > 0 && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--plum-800)', fontWeight: 600 }}>
                                            {selectedFiles.length} file(s) selected
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={formLoading} className="btn-primary">
                                    {formLoading ? 'Saving Supplier...' : isEditModalOpen ? 'Update Vendor' : 'Register Vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Vendor Profile & Performance Analytics */}
            {isDetailModalOpen && selectedVendor && (
                <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
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
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                    {selectedVendor.companyName}
                                </h3>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Supplier Profile • Tax ID: {selectedVendor.taxNumber}
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
                            {profileLoading ? (
                                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--plum-700)' }}>
                                    Loading supplier metrics...
                                </div>
                            ) : (
                                <>
                                    {/* Scorecards */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ padding: '1rem', background: '#FAF8FA', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Performance Rating</div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                                                <Star size={20} fill="#F59E0B" color="#F59E0B" />
                                                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--plum-950)' }}>
                                                    {selectedVendor.averageRating ? Number(selectedVendor.averageRating).toFixed(1) : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ padding: '1rem', background: '#FAF8FA', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Purchase Orders</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--plum-950)', marginTop: '0.25rem' }}>
                                                {vendorProfile?.ordersCount || 0}
                                            </div>
                                        </div>

                                        <div style={{ padding: '1rem', background: '#FAF8FA', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Spend Allocated</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--peach-700)', marginTop: '0.25rem' }}>
                                                ${(vendorProfile?.totalSpend || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ratings History & Issue Notes */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--plum-950)', marginBottom: '0.75rem' }}>
                                            Post-Delivery Evaluations ({vendorProfile?.ratings?.length || 0})
                                        </h4>
                                        {vendorProfile?.ratings && vendorProfile.ratings.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {vendorProfile.ratings.map((r, i) => (
                                                    <div key={i} style={{ padding: '0.85rem 1rem', background: '#FAF8FA', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--plum-950)' }}>
                                                                Order: {r.purchaseOrder?.poNumber || 'PO'} • Overall: {r.overallScore}★
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                Evaluator: {r.evaluatedBy?.name} • {new Date(r.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-body)', marginBottom: '0.35rem' }}>
                                                            <span>Timeliness: <strong>{r.timelinessScore}★</strong></span>
                                                            <span>Product Quality: <strong>{r.qualityScore}★</strong></span>
                                                            <span>Communication: <strong>{r.communicationScore}★</strong></span>
                                                        </div>
                                                        {r.issueNotes && (
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--danger-text)' }}>
                                                                <strong>Issues Logged:</strong> {r.issueNotes}
                                                            </div>
                                                        )}
                                                        {r.resolutionNotes && (
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--success-text)' }}>
                                                                <strong>Resolution:</strong> {r.resolutionNotes}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                No performance reviews submitted yet. Reviews are recorded after goods receipt.
                                            </p>
                                        )}
                                    </div>

                                    {/* Uploaded Documents */}
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--plum-950)', marginBottom: '0.75rem' }}>
                                            Compliance Documents ({selectedVendor.documents?.length || 0})
                                        </h4>
                                        {selectedVendor.documents && selectedVendor.documents.length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                                                {selectedVendor.documents.map((doc, i) => (
                                                    <a
                                                        key={i}
                                                        href={`http://localhost:5000${doc.filePath}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            padding: '0.45rem 0.85rem',
                                                            background: 'var(--plum-50)',
                                                            border: '1px solid var(--plum-200)',
                                                            borderRadius: 'var(--radius-md)',
                                                            color: 'var(--plum-800)',
                                                            textDecoration: 'none',
                                                            fontSize: '0.78rem',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <FileText size={14} />
                                                        {doc.fileName || 'Vendor Document'}
                                                        <ExternalLink size={12} />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No documents uploaded.</p>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                        <button type="button" onClick={() => setIsDetailModalOpen(false)} className="btn-secondary">
                                            Close Profile
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}