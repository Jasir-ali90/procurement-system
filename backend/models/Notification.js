const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Procurement Notification' },
    message: { type: String, required: true },
    link: { type: String },
    type: { type: String, enum: ['info', 'success', 'warning', 'danger'], default: 'info' },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);