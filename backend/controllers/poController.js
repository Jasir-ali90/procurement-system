const PurchaseOrder = require('../models/PurchaseOrder');
const RFQ = require('../models/RFQ');
const { notifyRoles, notifyUser } = require('../utils/notify');

exports.createPOFromRFQ = async (req, res, next) => {
    try {
        const { rfqId, taxRate = 0, deliveryAddress } = req.body;
        const rfq = await RFQ.findById(rfqId).populate({
            path: 'purchaseRequest',
            populate: { path: 'department' }
        });

        if (!rfq || rfq.status !== 'Awarded') {
            return res.status(400).json({ message: 'Cannot generate PO: RFQ has not been officially awarded' });
        }

        // Check if PO already exists for this RFQ
        const existingPO = await PurchaseOrder.findOne({ rfq: rfqId });
        if (existingPO) {
            return res.status(400).json({ message: `A Purchase Order (${existingPO.poNumber}) already exists for this RFQ` });
        }

        const selectedQuote = rfq.quotations.find(q => q.vendor.toString() === rfq.selectedVendor.toString());
        if (!selectedQuote) {
            return res.status(400).json({ message: 'Awarded quotation not found in RFQ' });
        }

        const count = await PurchaseOrder.countDocuments();
        const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        // Distribute unit prices across items based on quoted total
        const prTotal = rfq.purchaseRequest.totalEstimatedCost || 1;
        const items = rfq.purchaseRequest.items.map(i => {
            const itemEstTotal = i.quantity * i.estimatedCost;
            const ratio = itemEstTotal / prTotal;
            const itemTotal = ratio * selectedQuote.quotedPrice;
            const unitPrice = Number((itemTotal / i.quantity).toFixed(2));
            return {
                description: i.description,
                quantity: i.quantity,
                unitPrice,
                receivedQuantity: 0
            };
        });

        const subtotal = items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
        const parsedTaxRate = Number(taxRate || 0);
        const taxAmount = Number(((subtotal * parsedTaxRate) / 100).toFixed(2));
        const finalTotal = Number((subtotal + taxAmount).toFixed(2));

        const po = await PurchaseOrder.create({
            poNumber,
            rfq: rfq._id,
            purchaseRequest: rfq.purchaseRequest._id,
            department: rfq.purchaseRequest.department._id,
            vendor: rfq.selectedVendor,
            items,
            subtotal,
            taxRate: parsedTaxRate,
            taxAmount,
            finalTotal,
            deliveryAddress: deliveryAddress || 'Company Headquarters, Dock 1, 100 Main St.',
            paymentTerms: selectedQuote.paymentTerms,
            status: 'Issued'
        });

        await notifyRoles({
            roles: ['Procurement Manager', 'Admin'],
            title: 'Purchase Order Issued',
            message: `${poNumber} generated for RFQ ${rfq.rfqNumber} ($${finalTotal.toLocaleString()})`,
            link: '/purchase-orders',
            type: 'success'
        });

        if (rfq.purchaseRequest.requester) {
            await notifyUser({
                recipient: rfq.purchaseRequest.requester,
                title: 'Purchase Order Issued',
                message: `PO ${poNumber} has been issued for your purchase request (${rfq.purchaseRequest.prNumber})`,
                link: '/purchase-orders',
                type: 'info'
            });
        }

        const populated = await PurchaseOrder.findById(po._id)
            .populate('vendor', 'companyName email phone address taxNumber paymentTerms')
            .populate('department', 'name code')
            .populate('purchaseRequest', 'prNumber');

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

exports.revisePO = async (req, res, next) => {
    try {
        const { modificationReason, updatedItems, taxRate, deliveryAddress, paymentTerms } = req.body;
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: 'PO not found' });

        if (['Received', 'Cancelled', 'Closed'].includes(po.status)) {
            return res.status(400).json({ message: `Cannot revise purchase order in '${po.status}' state` });
        }

        // Business Rule: Modifications to issued Purchase Orders require a structured revision reason
        if (!modificationReason || modificationReason.trim() === '') {
            return res.status(400).json({ message: 'Modifications to issued Purchase Orders require a structured revision reason' });
        }

        po.revisions.push({
            revisionNumber: po.revisions.length + 1,
            modifiedBy: req.user._id,
            modificationReason,
            snapshot: {
                items: po.items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice, receivedQuantity: i.receivedQuantity })),
                subtotal: po.subtotal,
                taxRate: po.taxRate,
                taxAmount: po.taxAmount,
                finalTotal: po.finalTotal,
                deliveryAddress: po.deliveryAddress,
                paymentTerms: po.paymentTerms
            },
            timestamp: new Date()
        });

        if (updatedItems && Array.isArray(updatedItems)) {
            po.items = updatedItems.map((i, idx) => ({
                description: i.description,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                receivedQuantity: po.items[idx] ? po.items[idx].receivedQuantity : 0
            }));
            po.subtotal = po.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
        }

        if (taxRate !== undefined) po.taxRate = Number(taxRate);
        po.taxAmount = Number(((po.subtotal * po.taxRate) / 100).toFixed(2));
        po.finalTotal = Number((po.subtotal + po.taxAmount).toFixed(2));

        if (deliveryAddress) po.deliveryAddress = deliveryAddress;
        if (paymentTerms) po.paymentTerms = paymentTerms;

        await po.save();

        const updated = await PurchaseOrder.findById(po._id)
            .populate('vendor', 'companyName email phone')
            .populate('department', 'name code')
            .populate('revisions.modifiedBy', 'name email');

        res.json(updated);
    } catch (error) {
        next(error);
    }
};

exports.updatePOStatus = async (req, res, next) => {
    try {
        const { status, reason } = req.body;
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ message: 'PO not found' });

        if (!['Cancelled', 'Closed', 'Issued'].includes(status)) {
            return res.status(400).json({ message: 'Invalid target status' });
        }

        po.status = status;
        if (reason) {
            po.revisions.push({
                revisionNumber: po.revisions.length + 1,
                modifiedBy: req.user._id,
                modificationReason: `Status changed to ${status}: ${reason}`,
                snapshot: { status: po.status },
                timestamp: new Date()
            });
        }

        await po.save();
        res.json(po);
    } catch (error) {
        next(error);
    }
};

exports.getPOs = async (req, res, next) => {
    try {
        const { status, department, search } = req.query;
        const filter = {};

        if (req.user.role === 'Department User') {
            filter.department = req.user.department;
        } else if (department) {
            filter.department = department;
        }

        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { poNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const pos = await PurchaseOrder.find(filter)
            .populate('vendor', 'companyName email phone averageRating')
            .populate('department', 'name code')
            .populate('purchaseRequest', 'prNumber')
            .populate('revisions.modifiedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(pos);
    } catch (error) {
        next(error);
    }
};

exports.getPOById = async (req, res, next) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id)
            .populate('vendor', 'companyName contactPerson email phone address taxNumber paymentTerms averageRating')
            .populate('department', 'name code')
            .populate('purchaseRequest', 'prNumber requester')
            .populate('rfq', 'rfqNumber closingDate')
            .populate('revisions.modifiedBy', 'name email');

        if (!po) return res.status(404).json({ message: 'PO not found' });

        if (req.user.role === 'Department User' && po.department._id.toString() !== req.user.department?.toString()) {
            return res.status(403).json({ message: 'Access denied to purchase orders outside your assigned department' });
        }

        res.json(po);
    } catch (error) {
        next(error);
    }
};