const router = require('express').Router();
const { login, changePassword, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, upload.single('avatar'), updateProfile);

module.exports = router;