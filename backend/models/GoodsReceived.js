const mongoose = require('mongoose');

const GRNItemSchema = new mongoose.Schema({
    poItemIndex: { type: Number, required: true },
    description: { type: String, required: true },
    orderedQuantity: { type: Number, required: true },
    receivedQuantity: { type: Number, required: true, min: 0 },
    damagedQuantity: { type: Number, default: 0, min: 0 },
    rejectedQuantity: { type: Number, default: 0, min: 0 },
    notes: { type: String }
});

const GRNSchema = new mongoose.Schema({
    grnNumber: { type: String, required: true, unique: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [GRNItemSchema],
    deliveryNoteUrl: { type: String },
    inspectionDocumentUrl: { type: String },
    deliveryDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('GoodsReceived', GRNSchema);