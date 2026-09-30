const mongoose = require('mongoose');

const POItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    receivedQuantity: { type: Number, default: 0 }
});

const RevisionHistorySchema = new mongoose.Schema({
    revisionNumber: { type: Number, required: true },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modificationReason: { type: String, required: true },
    snapshot: { type: Object, required: true },
    timestamp: { type: Date, default: Date.now }
});

const POSchema = new mongoose.Schema({
    poNumber: { type: String, required: true, unique: true },
    rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ' },
    purchaseRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseRequest', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    items: [POItemSchema],
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, required: true },
    finalTotal: { type: Number, required: true },
    deliveryAddress: { type: String, required: true },
    paymentTerms: { type: String, required: true },
    status: {
        type: String,
        enum: ['Draft', 'Issued', 'Partially Received', 'Received', 'Cancelled', 'Closed'],
        default: 'Draft'
    },
    revisions: [RevisionHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', POSchema);