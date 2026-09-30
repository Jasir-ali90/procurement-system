const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, unique: true },
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timelinessScore: { type: Number, min: 1, max: 5, required: true },
    qualityScore: { type: Number, min: 1, max: 5, required: true },
    communicationScore: { type: Number, min: 1, max: 5, required: true },
    overallScore: { type: Number, min: 1, max: 5, required: true },
    issueNotes: { type: String },
    resolutionNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('VendorRating', RatingSchema);