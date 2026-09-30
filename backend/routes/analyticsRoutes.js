const router = require('express').Router();
const {
    getDashboardStats,
    rateVendor,
    getEligiblePOsForRating,
    getRatingsHistory,
    getFilteredReports,
    exportReportsCSV
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/eligible-pos-for-rating', authorize('Admin', 'Procurement Manager'), getEligiblePOsForRating);
router.get('/ratings', getRatingsHistory);
router.post('/rate-vendor', authorize('Admin', 'Procurement Manager'), rateVendor);
router.get('/reports', getFilteredReports);
router.get('/reports/csv', exportReportsCSV);

module.exports = router;