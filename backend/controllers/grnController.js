const GoodsReceived = require('../models/GoodsReceived');
const PurchaseOrder = require('../models/PurchaseOrder');
const { notifyRoles, notifyUser } = require('../utils/notify');

exports.createGRN = async (req, res, next) => {
    try {
        const { purchaseOrderId, receivedItems } = req.body;
        const parsedItems = typeof receivedItems === 'string' ? JSON.parse(receivedItems) : receivedItems;
        const po = await PurchaseOrder.findById(purchaseOrderId).populate('purchaseRequest');
        if (!po) return res.status(404).json({ message: 'Purchase Order not found' });

        if (['Cancelled', 'Closed'].includes(po.status)) {
            return res.status(400).json({ message: `Cannot record receipt on a '${po.status}' purchase order` });
        }

        // Validate line by line to prevent overage
        for (const entry of parsedItems) {
            const poItem = po.items[entry.poItemIndex];
            if (!poItem) {
                return res.status(400).json({ message: `Invalid item index ${entry.poItemIndex}` });
            }
            const newlyReceived = Number(entry.receivedQuantity || 0);
            if (poItem.receivedQuantity + newlyReceived > poItem.quantity) {
                return res.status(400).json({
                    message: `Overage blocked: Received total exceeds ordered quantity on line '${poItem.description}'. Ordered: ${poItem.quantity}, Already Received: ${poItem.receivedQuantity}, Trying to receive: ${newlyReceived}`
                });
            }
            poItem.receivedQuantity += newlyReceived;
        }

        const count = await GoodsReceived.countDocuments();
        const grnNumber = `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        const deliveryNoteUrl = req.files && req.files['deliveryNote'] ? `/uploads/${req.files['deliveryNote'][0].filename}` : null;
        const inspectionDocumentUrl = req.files && req.files['inspection'] ? `/uploads/${req.files['inspection'][0].filename}` : null;

        const grn = await GoodsReceived.create({
            grnNumber,
            purchaseOrder: po._id,
            receivedBy: req.user._id,
            items: parsedItems,
            deliveryNoteUrl,
            inspectionDocumentUrl,
            deliveryDate: new Date()
        });

        // Determine if all items are fully received
        const isFullyReceived = po.items.every(i => i.receivedQuantity >= i.quantity);
        po.status = isFullyReceived ? 'Received' : 'Partially Received';
        await po.save();

        await notifyRoles({
            roles: ['Procurement Manager', 'Admin'],
            title: 'Goods Receipt Logged',
            message: `${grnNumber} recorded for ${po.poNumber} (${po.status})`,
            link: '/goods-receipt',
            type: isFullyReceived ? 'success' : 'info'
        });

        if (po.purchaseRequest?.requester) {
            await notifyUser({
                recipient: po.purchaseRequest.requester,
                title: 'Goods Delivered',
                message: `Delivery recorded for your order (${po.poNumber}). Status: ${po.status}`,
                link: '/goods-receipt',
                type: 'info'
            });
        }

        const populated = await GoodsReceived.findById(grn._id)
            .populate('purchaseOrder', 'poNumber vendor items finalTotal status')
            .populate('receivedBy', 'name email');

        res.status(201).json({ grn: populated, updatedPOStatus: po.status });
    } catch (error) {
        next(error);
    }
};

exports.getGRNs = async (req, res, next) => {
    try {
        const { purchaseOrderId } = req.query;
        const filter = {};
        if (purchaseOrderId) filter.purchaseOrder = purchaseOrderId;

        const grns = await GoodsReceived.find(filter)
            .populate({
                path: 'purchaseOrder',
                select: 'poNumber vendor department finalTotal status',
                populate: [
                    { path: 'vendor', select: 'companyName email' },
                    { path: 'department', select: 'name code' }
                ]
            })
            .populate('receivedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(grns);
    } catch (error) {
        next(error);
    }
};

exports.getGRNById = async (req, res, next) => {
    try {
        const grn = await GoodsReceived.findById(req.params.id)
            .populate({
                path: 'purchaseOrder',
                populate: [
                    { path: 'vendor', select: 'companyName email phone address' },
                    { path: 'department', select: 'name code' }
                ]
            })
            .populate('receivedBy', 'name email');

        if (!grn) return res.status(404).json({ message: 'Goods Received Note not found' });
        res.json(grn);
    } catch (error) {
        next(error);
    }
};