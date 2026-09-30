const mongoose = require('mongoose');

const PRIItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    requiredDate: { type: Date, required: true },
    estimatedCost: { type: Number, required: true, min: 0 }
});

const ApprovalHistorySchema = new mongoose.Schema({
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decision: { type: String, enum: ['Approved', 'Rejected', 'Returned for Correction'] },
    comment: { type: String },
    timestamp: { type: Date, default: Date.now }
});

const PRSchema = new mongoose.Schema({
    prNumber: { type: String, required: true, unique: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    items: [PRIItemSchema],
    totalEstimatedCost: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Returned for Correction'],
        default: 'Draft'
    },
    approvalHistory: [ApprovalHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('PurchaseRequest', PRSchema);