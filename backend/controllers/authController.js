const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).populate('department');
        if (user && (await user.matchPassword(password))) {
            if (!user.isActive) {
                return res.status(403).json({ message: 'Account has been deactivated. Contact Admin.' });
            }
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                approvalLimit: user.approvalLimit,
                avatar: user.avatar || '',
                phone: user.phone || '',
                token: generateToken(user._id)
            });
        }
        res.status(401).json({ message: 'Invalid email or password' });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);
        if (await user.matchPassword(currentPassword)) {
            user.password = newPassword;
            await user.save();
            return res.json({ message: 'Password updated successfully' });
        }
        res.status(400).json({ message: 'Incorrect current password' });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('department', 'name code');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name && name.trim()) user.name = name.trim();
        if (phone !== undefined) user.phone = phone.trim();

        if (req.file) {
            user.avatar = `/uploads/${req.file.filename}`;
        }

        await user.save();
        const updated = await User.findById(user._id).select('-password').populate('department', 'name code');
        res.json({
            message: 'Profile updated successfully',
            user: updated
        });
    } catch (error) {
        next(error);
    }
};