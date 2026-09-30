const Vendor = require('../models/Vendor');
const PurchaseOrder = require('../models/PurchaseOrder');
const VendorRating = require('../models/VendorRating');

exports.createVendor = async (req, res, next) => {
    try {
        const { companyName, contactPerson, email, phone, address, taxNumber, paymentTerms, categories } = req.body;

        const emailExists = await Vendor.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            return res.status(400).json({ message: 'A vendor with this email address already exists' });
        }

        const taxExists = await Vendor.findOne({ taxNumber });
        if (taxExists) {
            return res.status(400).json({ message: 'A vendor with this Tax Identification Number already exists' });
        }

        const documents = req.files ? req.files.map(f => ({
            fileName: f.originalname,
            filePath: `/uploads/${f.filename}`,
            uploadedAt: new Date()
        })) : [];

        let parsedCategories = [];
        if (Array.isArray(categories)) {
            parsedCategories = categories;
        } else if (typeof categories === 'string') {
            parsedCategories = categories.split(',').map(c => c.trim()).filter(Boolean);
        }

        const vendor = await Vendor.create({
            companyName,
            contactPerson,
            email: email.toLowerCase(),
            phone,
            address,
            taxNumber,
            paymentTerms: paymentTerms || 'Net 30',
            categories: parsedCategories.length > 0 ? parsedCategories : ['General Supplies'],
            documents
        });

        res.status(201).json(vendor);
    } catch (error) {
        next(error);
    }
};

exports.getVendors = async (req, res, next) => {
    try {
        const { search, category, status, sort = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
        const query = {};

        if (status === 'archived') {
            query.isArchived = true;
        } else if (status === 'all') {
            // return all
        } else {
            query.isArchived = false;
        }

        if (search) {
            query.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { taxNumber: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'All') {
            query.categories = category;
        }

        const count = await Vendor.countDocuments(query);
        const vendors = await Vendor.find(query)
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            vendors,
            totalPages: Math.ceil(count / limit) || 1,
            currentPage: Number(page),
            totalVendors: count
        });
    } catch (error) {
        next(error);
    }
};

exports.getVendorById = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        // Retrieve vendor purchase history and rating profile
        const orders = await PurchaseOrder.find({ vendor: vendor._id })
            .select('poNumber finalTotal status createdAt')
            .sort({ createdAt: -1 });

        const totalSpend = orders.reduce((acc, o) => acc + (o.finalTotal || 0), 0);

        const ratings = await VendorRating.find({ vendor: vendor._id })
            .populate('purchaseOrder', 'poNumber')
            .populate('evaluatedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            vendor,
            orders,
            totalSpend,
            ordersCount: orders.length,
            ratings
        });
    } catch (error) {
        next(error);
    }
};

exports.updateVendor = async (req, res, next) => {
    try {
        const { companyName, contactPerson, email, phone, address, taxNumber, paymentTerms, categories } = req.body;
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        if (email && email.toLowerCase() !== vendor.email) {
            const emailExists = await Vendor.findOne({ email: email.toLowerCase(), _id: { $ne: vendor._id } });
            if (emailExists) return res.status(400).json({ message: 'Email address already in use by another vendor' });
            vendor.email = email.toLowerCase();
        }

        if (taxNumber && taxNumber !== vendor.taxNumber) {
            const taxExists = await Vendor.findOne({ taxNumber, _id: { $ne: vendor._id } });
            if (taxExists) return res.status(400).json({ message: 'Tax number already in use by another vendor' });
            vendor.taxNumber = taxNumber;
        }

        if (companyName) vendor.companyName = companyName;
        if (contactPerson) vendor.contactPerson = contactPerson;
        if (phone) vendor.phone = phone;
        if (address) vendor.address = address;
        if (paymentTerms) vendor.paymentTerms = paymentTerms;

        if (categories) {
            if (Array.isArray(categories)) {
                vendor.categories = categories;
            } else if (typeof categories === 'string') {
                vendor.categories = categories.split(',').map(c => c.trim()).filter(Boolean);
            }
        }

        if (req.files && req.files.length > 0) {
            const newDocs = req.files.map(f => ({
                fileName: f.originalname,
                filePath: `/uploads/${f.filename}`,
                uploadedAt: new Date()
            }));
            vendor.documents = [...(vendor.documents || []), ...newDocs];
        }

        await vendor.save();
        res.json(vendor);
    } catch (error) {
        next(error);
    }
};

exports.toggleArchive = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

        vendor.isArchived = !vendor.isArchived;
        await vendor.save();
        res.json({ message: `Vendor ${vendor.companyName} ${vendor.isArchived ? 'Archived' : 'Restored'}`, vendor });
    } catch (error) {
        next(error);
    }
};