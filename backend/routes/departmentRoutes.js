const router = require('express').Router();
const { getDepartments, createDepartment, updateDepartment } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getDepartments);
router.post('/', authorize('Admin'), createDepartment);
router.put('/:id', authorize('Admin'), updateDepartment);

module.exports = router;
