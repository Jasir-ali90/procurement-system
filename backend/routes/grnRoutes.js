const router = require('express').Router();
const { createGRN, getGRNs, getGRNById } = require('../controllers/grnController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getGRNs);
router.get('/:id', getGRNById);
router.post('/',
    authorize('Admin', 'Procurement Manager'),
    upload.fields([
        { name: 'deliveryNote', maxCount: 1 },
        { name: 'inspection', maxCount: 1 }
    ]),
    createGRN
);

module.exports = router;