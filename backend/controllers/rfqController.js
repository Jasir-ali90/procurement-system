const RFQ = require('../models/RFQ');
const PurchaseRequest = require('../models/PurchaseRequest');
const Vendor = require('../models/Vendor');
const { notifyRoles, notifyUser } = require('../utils/notify');

exports.createRFQ = async (req, res, next) => {
    try {
        const { purchaseRequestId, closingDate, invitedVendors } = req.body;
        const pr = await PurchaseRequest.findById(purchaseRequestId);
        if (!pr || pr.status !== 'Approved') {
            return res.status(400).json({ message: 'An RFQ can only be issued against fully Approved purchase requests' });
        }

        if (!closingDate) {
            return res.status(400).json({ message: 'A closing submission deadline date is required' });
        }

        const count = await RFQ.countDocuments();
        const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        const rfq = await RFQ.create({
            rfqNumber,
            purchaseRequest: purchaseRequestId,
            closingDate,
            invitedVendors: Array.isArray(invitedVendors) ? invitedVendors : []
        });

        await notifyRoles({
            roles: ['Procurement Manager', 'Admin'],
            title: 'New RFQ Created',
            message: `${rfqNumber} has been created for ${pr.prNumber}`,
            link: '/rfqs',
            type: 'info'
        });

        const populated = await RFQ.findById(rfq._id)
            .populate('purchaseRequest')
            .populate('invitedVendors', 'companyName email averageRating');

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

exports.submitQuotation = async (req, res, next) => {
    try {
        const { vendorId, quotedPrice, taxAmount, promisedDeliveryDate, deliveryLeadTimeDays, paymentTerms } = req.body;
        const rfq = await RFQ.findById(req.params.id);
        if (!rfq) return res.status(404).json({ message: 'RFQ not found' });

        if (rfq.status === 'Awarded') {
            return res.status(400).json({ message: 'Cannot submit quotes: RFQ has already been awarded' });
        }

        // Business Rule: Late quotations are rejected
        if (new Date() > new Date(rfq.closingDate)) {
            return res.status(400).json({ message: 'Quotation deadline has passed. Late quotations are rejected.' });
        }

        // Check if vendor already submitted quotation
        const alreadySubmitted = rfq.quotations.some(q => q.vendor.toString() === vendorId.toString());
        if (alreadySubmitted) {
            return res.status(400).json({ message: 'This vendor has already submitted a quotation for this RFQ' });
        }

        const documentUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const subtotal = Number(quotedPrice);
        const tax = Number(taxAmount || 0);
        const totalAmount = subtotal + tax;

        rfq.quotations.push({
            vendor: vendorId,
            quotedPrice: subtotal,
            taxAmount: tax,
            totalAmount,
            promisedDeliveryDate,
            deliveryLeadTimeDays: Number(deliveryLeadTimeDays || 0),
            paymentTerms,
            documentUrl
        });

        await rfq.save();

        const updated = await RFQ.findById(rfq._id)
            .populate('purchaseRequest')
            .populate('invitedVendors', 'companyName email averageRating')
            .populate('quotations.vendor', 'companyName email averageRating paymentTerms');

        res.json(updated);
    } catch (error) {
        next(error);
    }
};

exports.awardRFQ = async (req, res, next) => {
    try {
        const { vendorId, selectionReason } = req.body;
        if (!selectionReason || selectionReason.trim() === '') {
            return res.status(400).json({ message: 'Formal selection reasoning is mandatory for vendor awarding' });
        }

        const rfq = await RFQ.findById(req.params.id).populate('purchaseRequest');
        if (!rfq) return res.status(404).json({ message: 'RFQ not found' });

        const quote = rfq.quotations.find(q => q.vendor.toString() === vendorId.toString());
        if (!quote) {
            return res.status(400).json({ message: 'Selected vendor has not submitted a quotation for this RFQ' });
        }

        rfq.selectedVendor = vendorId;
        rfq.selectionReason = selectionReason;
        rfq.status = 'Awarded';
        rfq.awardedAt = new Date();
        await rfq.save();

        // Notify Procurement & Requester
        const vendor = await Vendor.findById(vendorId);
        await notifyRoles({
            roles: ['Procurement Manager', 'Admin'],
            title: 'RFQ Awarded',
            message: `${rfq.rfqNumber} awarded to ${vendor?.companyName || 'Vendor'}. Ready for PO creation.`,
            link: '/rfqs',
            type: 'success'
        });

        if (rfq.purchaseRequest?.requester) {
            await notifyUser({
                recipient: rfq.purchaseRequest.requester,
                title: 'Vendor Awarded for your Request',
                message: `Vendor ${vendor?.companyName || ''} selected for your PR (${rfq.purchaseRequest.prNumber})`,
                link: '/purchase-requests',
                type: 'info'
            });
        }

        const updated = await RFQ.findById(rfq._id)
            .populate('purchaseRequest')
            .populate('invitedVendors', 'companyName email averageRating')
            .populate('quotations.vendor', 'companyName email averageRating paymentTerms')
            .populate('selectedVendor', 'companyName email phone paymentTerms');

        res.json(updated);
    } catch (error) {
        next(error);
    }
};

exports.getRFQs = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const rfqs = await RFQ.find(filter)
            .populate({
                path: 'purchaseRequest',
                populate: { path: 'department', select: 'name code' }
            })
            .populate('invitedVendors', 'companyName email averageRating categories')
            .populate('quotations.vendor', 'companyName email averageRating paymentTerms')
            .populate('selectedVendor', 'companyName email phone paymentTerms')
            .sort({ createdAt: -1 });

        res.json(rfqs);
    } catch (error) {
        next(error);
    }
};

exports.getRFQById = async (req, res, next) => {
    try {
        const rfq = await RFQ.findById(req.params.id)
            .populate({
                path: 'purchaseRequest',
                populate: [
                    { path: 'department', select: 'name code' },
                    { path: 'requester', select: 'name email' }
                ]
            })
            .populate('invitedVendors', 'companyName email phone address taxNumber averageRating categories paymentTerms')
            .populate('quotations.vendor', 'companyName email phone address taxNumber averageRating paymentTerms')
            .populate('selectedVendor', 'companyName email phone paymentTerms');

        if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
        res.json(rfq);
    } catch (error) {
        next(error);
    }
};