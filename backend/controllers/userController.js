const User = require('../models/User');
const Notification = require('../models/Notification');
const { notifyRoles } = require('../utils/notify');

exports.getUsers = async (req, res, next) => {
    try {
        const { search, role, department } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.role = role;
        if (department) query.department = department;

        const users = await User.find(query)
            .select('-password')
            .populate('department', 'name code')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        next(error);
    }
};

exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, department, approvalLimit, phone } = req.body;
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const user = await User.create({
            name,
            email,
            password: password || 'password123',
            role: role || 'Department User',
            department: department || null,
            approvalLimit: Number(approvalLimit) || 0,
            phone: phone || ''
        });

        const populated = await User.findById(user._id).select('-password').populate('department', 'name code');
        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    try {
        const { name, email, role, department, approvalLimit, isActive, phone } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const oldRole = user.role;
        const roleChanged = role && role !== oldRole;

        if (name) user.name = name.trim();
        if (email) user.email = email.trim().toLowerCase();
        if (role) user.role = role;
        if (department !== undefined) user.department = department || null;
        if (approvalLimit !== undefined) user.approvalLimit = Number(approvalLimit);
        if (isActive !== undefined) user.isActive = isActive;
        if (phone !== undefined) user.phone = phone.trim();

        await user.save();

        // If Role was changed, trigger high-priority notification to the target user and system managers
        if (roleChanged) {
            await Notification.create({
                recipient: user._id,
                title: 'Your Account Role Has Been Changed',
                message: `Administrator has updated your system role from "${oldRole}" to "${role}". Your access permissions have been updated.`,
                link: '/purchase-requests',
                type: 'warning'
            });

            await notifyRoles({
                roles: ['Admin', 'Procurement Manager'],
                title: 'User Role Updated',
                message: `Role for ${user.name} (${user.email}) changed from "${oldRole}" to "${role}" by Admin.`,
                link: '/admin/users',
                type: 'info'
            });
        }

        const updated = await User.findById(user._id).select('-password').populate('department', 'name code');
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

exports.toggleUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot deactivate your own active admin account' });
        }

        user.isActive = !user.isActive;
        await user.save();
        res.json({ message: `User account ${user.isActive ? 'activated' : 'deactivated'}`, user });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.password = newPassword;
        await user.save();
        res.json({ message: `Password reset successfully for ${user.email}` });
    } catch (error) {
        next(error);
    }
};
