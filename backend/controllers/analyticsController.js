const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseRequest = require('../models/PurchaseRequest');
const RFQ = require('../models/RFQ');
const Vendor = require('../models/Vendor');
const VendorRating = require('../models/VendorRating');
const GoodsReceived = require('../models/GoodsReceived');
const { notifyRoles } = require('../utils/notify');

exports.getDashboardStats = async (req, res, next) => {
    try {
        const pendingPRs = await PurchaseRequest.countDocuments({ status: 'Submitted' });
        const openRFQs = await RFQ.countDocuments({ status: 'Open' });
        const openPOs = await PurchaseOrder.countDocuments({ status: { $in: ['Issued', 'Partially Received'] } });
        const partiallyReceivedPOs = await PurchaseOrder.countDocuments({ status: 'Partially Received' });
        const totalVendors = await Vendor.countDocuments({ isArchived: false });
        const totalGRNs = await GoodsReceived.countDocuments();

        const totalSpendResult = await PurchaseOrder.aggregate([
            { $match: { status: { $in: ['Issued', 'Partially Received', 'Received', 'Closed'] } } },
            { $group: { _id: null, total: { $sum: '$finalTotal' } } }
        ]);
        const monthlyPurchasingTotal = totalSpendResult[0] ? totalSpendResult[0].total : 0;

        const departmentSpend = await PurchaseOrder.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: '$department', total: { $sum: '$finalTotal' }, ordersCount: { $sum: 1 } } },
            { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
            { $unwind: '$dept' },
            { $project: { departmentName: '$dept.name', departmentCode: '$dept.code', total: 1, ordersCount: 1 } },
            { $sort: { total: -1 } }
        ]);

        const topVendors = await PurchaseOrder.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: '$vendor', totalSpend: { $sum: '$finalTotal' }, ordersCount: { $sum: 1 } } },
            { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
            { $unwind: '$vendor' },
            { $project: { companyName: '$vendor.companyName', totalSpend: 1, ordersCount: 1, rating: '$vendor.averageRating', categories: '$vendor.categories' } },
            { $sort: { totalSpend: -1 } },
            { $limit: 6 }
        ]);

        const poStatusBreakdown = await PurchaseOrder.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$finalTotal' } } }
        ]);

        const recentPRs = await PurchaseRequest.find()
            .populate('requester', 'name email')
            .populate('department', 'name code')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentPOs = await PurchaseOrder.find()
            .populate('vendor', 'companyName')
            .populate('department', 'name code')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            pendingPRs,
            openRFQs,
            openPOs,
            partiallyReceivedPOs,
            totalVendors,
            totalGRNs,
            monthlyPurchasingTotal,
            departmentSpend,
            topVendors,
            poStatusBreakdown,
            recentPRs,
            recentPOs
        });
    } catch (error) {
        next(error);
    }
};

exports.rateVendor = async (req, res, next) => {
    try {
        const { vendorId, purchaseOrderId, timelinessScore, qualityScore, communicationScore, issueNotes, resolutionNotes } = req.body;
        const po = await PurchaseOrder.findById(purchaseOrderId);
        if (!po) return res.status(404).json({ message: 'Purchase Order not found' });

        // Business Rule: Allow ratings only after goods or services are received
        if (!['Received', 'Partially Received'].includes(po.status)) {
            return res.status(400).json({ message: 'Performance evaluation can only occur after items have been received against the order' });
        }

        const existingRating = await VendorRating.findOne({ purchaseOrder: purchaseOrderId });
        if (existingRating) {
            return res.status(400).json({ message: 'A performance evaluation has already been submitted for this Purchase Order' });
        }

        const t = Number(timelinessScore);
        const q = Number(qualityScore);
        const c = Number(communicationScore);

        if ([t, q, c].some(score => isNaN(score) || score < 1 || score > 5)) {
            return res.status(400).json({ message: 'All rating categories (timeliness, quality, communication) must be scored between 1 and 5' });
        }

        const overallScore = Number(((t + q + c) / 3).toFixed(2));

        const rating = await VendorRating.create({
            vendor: vendorId,
            purchaseOrder: purchaseOrderId,
            evaluatedBy: req.user._id,
            timelinessScore: t,
            qualityScore: q,
            communicationScore: c,
            overallScore,
            issueNotes: issueNotes || '',
            resolutionNotes: resolutionNotes || ''
        });

        // Recalculate vendor's average rating
        const allRatings = await VendorRating.find({ vendor: vendorId });
        const avg = allRatings.reduce((acc, cur) => acc + cur.overallScore, 0) / allRatings.length;
        const updatedVendor = await Vendor.findByIdAndUpdate(vendorId, { averageRating: Number(avg.toFixed(2)) }, { new: true });

        await notifyRoles({
            roles: ['Procurement Manager', 'Admin'],
            title: 'Vendor Evaluated',
            message: `New rating of ${overallScore}★ recorded for ${updatedVendor?.companyName || 'Vendor'}`,
            link: '/vendors',
            type: 'info'
        });

        res.status(201).json(rating);
    } catch (error) {
        next(error);
    }
};

exports.getEligiblePOsForRating = async (req, res, next) => {
    try {
        // POs that are Partially Received or Received, and haven't been rated yet
        const ratedPOIds = await VendorRating.distinct('purchaseOrder');
        const pos = await PurchaseOrder.find({
            status: { $in: ['Received', 'Partially Received'] },
            _id: { $nin: ratedPOIds }
        })
            .populate('vendor', 'companyName email averageRating')
            .populate('department', 'name code')
            .sort({ updatedAt: -1 });

        res.json(pos);
    } catch (error) {
        next(error);
    }
};

exports.getRatingsHistory = async (req, res, next) => {
    try {
        const { vendorId } = req.query;
        const filter = {};
        if (vendorId) filter.vendor = vendorId;

        const ratings = await VendorRating.find(filter)
            .populate('vendor', 'companyName categories averageRating')
            .populate('purchaseOrder', 'poNumber finalTotal status')
            .populate('evaluatedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(ratings);
    } catch (error) {
        next(error);
    }
};

exports.getFilteredReports = async (req, res, next) => {
    try {
        const { startDate, endDate, department, vendor, status } = req.query;
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                filter.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        if (department && department !== 'All') filter.department = department;
        if (vendor && vendor !== 'All') filter.vendor = vendor;
        if (status && status !== 'All') filter.status = status;

        const orders = await PurchaseOrder.find(filter)
            .populate('vendor', 'companyName email')
            .populate('department', 'name code')
            .sort({ createdAt: -1 });

        const totalValue = orders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);

        res.json({ orders, totalValue, count: orders.length });
    } catch (error) {
        next(error);
    }
};

exports.exportReportsCSV = async (req, res, next) => {
    try {
        const { startDate, endDate, department, vendor, status } = req.query;
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                filter.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        if (department && department !== 'All') filter.department = department;
        if (vendor && vendor !== 'All') filter.vendor = vendor;
        if (status && status !== 'All') filter.status = status;

        const orders = await PurchaseOrder.find(filter)
            .populate('vendor', 'companyName')
            .populate('department', 'name');

        let csv = 'PO Number,Department,Vendor,Subtotal ($),Tax ($),Final Total ($),Status,Created Date\n';
        orders.forEach(o => {
            const dateStr = o.createdAt ? o.createdAt.toISOString().split('T')[0] : '';
            csv += `"${o.poNumber}","${o.department?.name || 'N/A'}","${o.vendor?.companyName || 'N/A'}",${o.subtotal.toFixed(2)},${o.taxAmount.toFixed(2)},${o.finalTotal.toFixed(2)},"${o.status}","${dateStr}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="procurement-report.csv"');
        return res.send(csv);
    } catch (error) {
        next(error);
    }
};