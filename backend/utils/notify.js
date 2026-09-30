const Notification = require('../models/Notification');
const User = require('../models/User');

const notifyUser = async ({ recipient, title, message, link, type = 'info' }) => {
    try {
        if (!recipient) return null;
        return await Notification.create({ recipient, title, message, link, type });
    } catch (err) {
        console.error('Notification creation failed:', err.message);
        return null;
    }
};

const notifyRoles = async ({ roles, department, title, message, link, type = 'info', excludeUserId = null }) => {
    try {
        const query = { isActive: true, role: { $in: roles } };
        if (department) query.department = department;
        if (excludeUserId) query._id = { $ne: excludeUserId };

        const users = await User.find(query);
        const notifications = users.map(u => ({
            recipient: u._id,
            title,
            message,
            link,
            type
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (err) {
        console.error('Role notifications failed:', err.message);
    }
};

module.exports = { notifyUser, notifyRoles };
