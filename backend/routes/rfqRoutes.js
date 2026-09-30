const router = require('express').Router();
const { createRFQ, submitQuotation, awardRFQ, getRFQs, getRFQById } = require('../controllers/rfqController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getRFQs);
router.get('/:id', getRFQById);
router.post('/', authorize('Admin', 'Procurement Manager'), createRFQ);
router.post('/:id/quote', authorize('Admin', 'Procurement Manager'), upload.single('quotationDocument'), submitQuotation);
router.put('/:id/award', authorize('Admin', 'Procurement Manager'), awardRFQ);

module.exports = router;