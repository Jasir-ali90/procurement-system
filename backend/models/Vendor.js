const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    taxNumber: { type: String, required: true, unique: true },
    paymentTerms: { type: String, required: true },
    categories: [{ type: String, required: true }],
    documents: [{
        fileName: String,
        filePath: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    averageRating: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', VendorSchema);