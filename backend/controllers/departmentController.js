const Department = require('../models/Department');
const PurchaseOrder = require('../models/PurchaseOrder');

exports.getDepartments = async (req, res, next) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json(departments);
    } catch (error) {
        next(error);
    }
};

exports.createDepartment = async (req, res, next) => {
    try {
        const { name, code } = req.body;
        const exists = await Department.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
        if (exists) {
            return res.status(400).json({ message: 'Department with this name or code already exists' });
        }

        const dept = await Department.create({
            name,
            code: code.toUpperCase()
        });
        res.status(201).json(dept);
    } catch (error) {
        next(error);
    }
};

exports.updateDepartment = async (req, res, next) => {
    try {
        const { name, code, isActive } = req.body;
        const dept = await Department.findById(req.params.id);
        if (!dept) return res.status(404).json({ message: 'Department not found' });

        if (name) dept.name = name;
        if (code) dept.code = code.toUpperCase();
        if (isActive !== undefined) dept.isActive = isActive;

        await dept.save();
        res.json(dept);
    } catch (error) {
        next(error);
    }
};
