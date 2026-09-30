const PurchaseRequest = require('../models/PurchaseRequest');
const { notifyRoles, notifyUser } = require('../utils/notify');

exports.createPR = async (req, res, next) => {
    try {
        const { items, priority, status } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Purchase request must contain at least one item' });
        }

        const totalEstimatedCost = items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.estimatedCost)), 0);
        const count = await PurchaseRequest.countDocuments();
        const prNumber = `PR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        const isSubmit = status === 'Submitted';

        const pr = await PurchaseRequest.create({
            prNumber,
            requester: req.user._id,
            department: req.user.department,
            priority: priority || 'Medium',
            items,
            totalEstimatedCost,
            status: isSubmit ? 'Submitted' : 'Draft'
        });

        if (isSubmit) {
            await notifyRoles({
                roles: ['Procurement Manager', 'Admin'],
                title: 'New Purchase Request',
                message: `${prNumber} submitted for approval (Estimated: $${totalEstimatedCost.toLocaleString()})`,
                link: '/purchase-requests',
                type: 'info'
            });
        }

        const populated = await PurchaseRequest.findById(pr._id)
            .populate('requester', 'name email')
            .populate('department', 'name code');

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

exports.getPRs = async (req, res, next) => {
    try {
        const { status, priority, search } = req.query;
        const filter = {};

        if (req.user.role === 'Department User') {
            filter.department = req.user.department;
        }

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (search) {
            filter.$or = [
                { prNumber: { $regex: search, $options: 'i' } },
                { 'items.description': { $regex: search, $options: 'i' } }
            ];
        }

        const prs = await PurchaseRequest.find(filter)
            .populate('requester', 'name email')
            .populate('department', 'name code')
            .populate('approvalHistory.reviewer', 'name email role')
            .sort({ createdAt: -1 });

        res.json(prs);
    } catch (error) {
        next(error);
    }
};

exports.getPRById = async (req, res, next) => {
    try {
        const pr = await PurchaseRequest.findById(req.params.id)
            .populate('requester', 'name email')
            .populate('department', 'name code')
            .populate('approvalHistory.reviewer', 'name email role');

        if (!pr) return res.status(404).json({ message: 'Purchase request not found' });

        if (req.user.role === 'Department User' && pr.department._id.toString() !== req.user.department?.toString()) {
            return res.status(403).json({ message: 'Access denied: You can only view requests from your department' });
        }

        res.json(pr);
    } catch (error) {
        next(error);
    }
};

exports.updatePR = async (req, res, next) => {
    try {
        const pr = await PurchaseRequest.findById(req.params.id);
        if (!pr) return res.status(404).json({ message: 'Purchase request not found' });

        // Only requester can edit their own request
        if (pr.requester.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own purchase requests' });
        }

        // Only Draft or Returned requests can be edited
        if (!['Draft', 'Returned for Correction'].includes(pr.status)) {
            return res.status(400).json({ message: 'Submitted or approved requests are locked against edits' });
        }

        const { items, priority, status } = req.body;
        if (items) {
            pr.items = items;
            pr.totalEstimatedCost = items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.estimatedCost)), 0);
        }
        if (priority) pr.priority = priority;

        if (status === 'Submitted') {
            pr.status = 'Submitted';
            await notifyRoles({
                roles: ['Procurement Manager', 'Admin'],
                title: 'Purchase Request Resubmitted',
                message: `${pr.prNumber} has been resubmitted for approval`,
                link: '/purchase-requests',
                type: 'info'
            });
        }

        await pr.save();
        const updated = await PurchaseRequest.findById(pr._id)
            .populate('requester', 'name email')
            .populate('department', 'name code');

        res.json(updated);
    } catch (error) {
        next(error);
    }
};

exports.deletePR = async (req, res, next) => {
    try {
        const pr = await PurchaseRequest.findById(req.params.id);
        if (!pr) return res.status(404).json({ message: 'Purchase request not found' });

        if (pr.requester.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own requests' });
        }

        if (pr.status !== 'Draft') {
            return res.status(400).json({ message: 'Only draft purchase requests can be deleted' });
        }

        await pr.deleteOne();
        res.json({ message: 'Draft purchase request deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.reviewPR = async (req, res, next) => {
    try {
        const { decision, comment } = req.body;
        const pr = await PurchaseRequest.findById(req.params.id);
        if (!pr) return res.status(404).json({ message: 'PR not found' });

        if (pr.status !== 'Submitted') {
            return res.status(400).json({ message: `Cannot review request with status '${pr.status}'. Only 'Submitted' requests can be reviewed.` });
        }

        // Business Rule: Separation of duties: requester cannot approve their own PR
        if (pr.requester.toString() === req.user._id.toString()) {
            return res.status(403).json({ message: 'Separation of duties violation: Users cannot approve their own requests' });
        }

        // Business Rule: Approval limit check
        if (decision === 'Approved' && req.user.role !== 'Admin' && req.user.approvalLimit < pr.totalEstimatedCost) {
            return res.status(403).json({
                message: `Exceeds approval threshold. Your limit is $${req.user.approvalLimit.toLocaleString()}, but request total is $${pr.totalEstimatedCost.toLocaleString()}`
            });
        }

        // Business Rule: Written justification required for rejections or returns
        if (['Rejected', 'Returned for Correction'].includes(decision) && (!comment || comment.trim() === '')) {
            return res.status(400).json({ message: 'A written audit justification comment is required for returns or rejections' });
        }

        pr.status = decision;
        pr.approvalHistory.push({
            reviewer: req.user._id,
            decision,
            comment: comment || '',
            timestamp: new Date()
        });

        await pr.save();

        // Notify requester about decision
        const alertType = decision === 'Approved' ? 'success' : decision === 'Rejected' ? 'danger' : 'warning';
        await notifyUser({
            recipient: pr.requester,
            title: `PR ${decision}`,
            message: `Your purchase request ${pr.prNumber} has been ${decision.toLowerCase()} by ${req.user.name}. ${comment ? 'Comment: "' + comment + '"' : ''}`,
            link: '/purchase-requests',
            type: alertType
        });

        const updated = await PurchaseRequest.findById(pr._id)
            .populate('requester', 'name email')
            .populate('department', 'name code')
            .populate('approvalHistory.reviewer', 'name email role');

        res.json(updated);
    } catch (error) {
        next(error);
    }
};