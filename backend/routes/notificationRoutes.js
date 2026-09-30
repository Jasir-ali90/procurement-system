const router = require('express').Router();
const { getMyNotifications, markAsRead, markAllAsRead, clearNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/clear', clearNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;
