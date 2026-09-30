const mongoose = require('mongoose');

const QuotationSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    quotedPrice: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    promisedDeliveryDate: { type: Date, required: true },
    deliveryLeadTimeDays: { type: Number, required: true },
    paymentTerms: { type: String, required: true },
    documentUrl: { type: String },
    submittedAt: { type: Date, default: Date.now }
});

const RFQSchema = new mongoose.Schema({
    rfqNumber: { type: String, required: true, unique: true },
    purchaseRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseRequest', required: true },
    closingDate: { type: Date, required: true },
    invitedVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
    quotations: [QuotationSchema],
    status: { type: String, enum: ['Open', 'Closed', 'Awarded'], default: 'Open' },
    selectedVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    selectionReason: { type: String },
    awardedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('RFQ', RFQSchema);