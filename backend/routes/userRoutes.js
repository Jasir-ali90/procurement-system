const router = require('express').Router();
const { getUsers, createUser, updateUser, toggleUserStatus, resetPassword } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('Admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/toggle-status', toggleUserStatus);
router.put('/:id/reset-password', resetPassword);

module.exports = router;
