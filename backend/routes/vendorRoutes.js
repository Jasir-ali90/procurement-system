const router = require('express').Router();
const { createVendor, getVendors, getVendorById, updateVendor, toggleArchive } = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getVendors);
router.get('/:id', getVendorById);
router.post('/', authorize('Admin', 'Procurement Manager'), upload.array('documents', 5), createVendor);
router.put('/:id', authorize('Admin', 'Procurement Manager'), upload.array('documents', 5), updateVendor);
router.patch('/:id/toggle-archive', authorize('Admin', 'Procurement Manager'), toggleArchive);

module.exports = router;