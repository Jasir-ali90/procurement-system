const router = require('express').Router();
const { createPOFromRFQ, revisePO, updatePOStatus, getPOs, getPOById } = require('../controllers/poController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getPOs);
router.get('/:id', getPOById);
router.post('/from-rfq', authorize('Admin', 'Procurement Manager'), createPOFromRFQ);
router.put('/:id/revise', authorize('Admin', 'Procurement Manager'), revisePO);
router.patch('/:id/status', authorize('Admin', 'Procurement Manager'), updatePOStatus);

module.exports = router;