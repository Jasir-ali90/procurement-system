const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['Admin', 'Procurement Manager', 'Department User'],
        default: 'Department User'
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    approvalLimit: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' }
}, { timestamps: true });

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);