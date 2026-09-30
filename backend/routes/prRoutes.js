const router = require('express').Router();
const { createPR, getPRs, getPRById, updatePR, deletePR, reviewPR } = require('../controllers/prController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', createPR);
router.get('/', getPRs);
router.get('/:id', getPRById);
router.put('/:id', updatePR);
router.delete('/:id', deletePR);
router.put('/:id/review', authorize('Admin', 'Procurement Manager'), reviewPR);

module.exports = router;