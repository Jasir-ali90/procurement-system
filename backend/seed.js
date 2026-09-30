const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Department = require('./models/Department');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
const PurchaseRequest = require('./models/PurchaseRequest');
const RFQ = require('./models/RFQ');
const PurchaseOrder = require('./models/PurchaseOrder');
const GoodsReceived = require('./models/GoodsReceived');
const VendorRating = require('./models/VendorRating');
const Notification = require('./models/Notification');

dotenv.config();

const seedData = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/procurement_system';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing collections
        await Promise.all([
            Department.deleteMany(),
            User.deleteMany(),
            Vendor.deleteMany(),
            PurchaseRequest.deleteMany(),
            RFQ.deleteMany(),
            PurchaseOrder.deleteMany(),
            GoodsReceived.deleteMany(),
            VendorRating.deleteMany(),
            Notification.deleteMany()
        ]);

        console.log('Cleared existing records.');

        // 1. Create Departments
        const itDept = await Department.create({ name: 'Information Technology', code: 'IT' });
        const opsDept = await Department.create({ name: 'Operations & Facilities', code: 'OPS' });
        const finDept = await Department.create({ name: 'Finance & Accounts', code: 'FIN' });

        // 2. Create Users (with pre-save password hashing)
        const adminUser = await User.create({
            name: 'Sophia Vance (Admin)',
            email: 'admin@local.com',
            password: 'password123',
            role: 'Admin',
            department: itDept._id,
            approvalLimit: 1000000
        });

        const procurementManager = await User.create({
            name: 'Marcus Sterling (Procurement)',
            email: 'procurement@local.com',
            password: 'password123',
            role: 'Procurement Manager',
            department: opsDept._id,
            approvalLimit: 250000
        });

        const itRequester = await User.create({
            name: 'Liam Chen (IT Dept)',
            email: 'user.it@local.com',
            password: 'password123',
            role: 'Department User',
            department: itDept._id,
            approvalLimit: 0
        });

        const opsRequester = await User.create({
            name: 'Elena Rostova (Ops Dept)',
            email: 'user.ops@local.com',
            password: 'password123',
            role: 'Department User',
            department: opsDept._id,
            approvalLimit: 0
        });

        // 3. Create Vendors
        const vendor1 = await Vendor.create({
            companyName: 'Apex Tech Solutions Inc.',
            contactPerson: 'David Miller',
            email: 'sales@apextech.fake',
            phone: '+1 (555) 234-5678',
            address: '100 Silicon Blvd, Suite 400, San Jose, CA',
            taxNumber: 'TAX-APEX-8901',
            paymentTerms: 'Net 30',
            categories: ['Hardware', 'IT Services', 'Cloud Infrastructure'],
            averageRating: 4.8,
            documents: [{ fileName: 'Apex_Tax_Certificate.pdf', filePath: '/uploads/sample_tax.pdf' }]
        });

        const vendor2 = await Vendor.create({
            companyName: 'Global Supplies & Stationery',
            contactPerson: 'Sarah Jenkins',
            email: 'orders@globalsupplies.fake',
            phone: '+1 (555) 876-5432',
            address: '450 Industrial Parkway, Chicago, IL',
            taxNumber: 'TAX-GLOB-4321',
            paymentTerms: 'Net 60',
            categories: ['Office Supplies', 'Furniture', 'Stationery'],
            averageRating: 4.2,
            documents: [{ fileName: 'Global_Compliance_2026.pdf', filePath: '/uploads/sample_compliance.pdf' }]
        });

        const vendor3 = await Vendor.create({
            companyName: 'CloudMatrix Networks',
            contactPerson: 'Alex Rivera',
            email: 'contact@cloudmatrix.fake',
            phone: '+1 (555) 345-6789',
            address: '77 Cyber Way, Austin, TX',
            taxNumber: 'TAX-CLD-1122',
            paymentTerms: 'Net 30',
            categories: ['Cloud Infrastructure', 'Software Licenses', 'CyberSecurity'],
            averageRating: 4.9,
            documents: [{ fileName: 'CloudMatrix_SOC2_Summary.pdf', filePath: '/uploads/sample_soc2.pdf' }]
        });

        const vendor4 = await Vendor.create({
            companyName: 'Precision Facility Services',
            contactPerson: 'Robert Hayes',
            email: 'service@precisionfacility.fake',
            phone: '+1 (555) 456-7890',
            address: '220 Maintenance Rd, Columbus, OH',
            taxNumber: 'TAX-PREC-3344',
            paymentTerms: 'Net 15',
            categories: ['Maintenance', 'HVAC', 'Janitorial'],
            averageRating: 4.1
        });

        const vendor5 = await Vendor.create({
            companyName: 'NexaLogistics Express',
            contactPerson: 'Karen Patel',
            email: 'support@nexalogistics.fake',
            phone: '+1 (555) 567-8901',
            address: '890 Harbor Way, Newark, NJ',
            taxNumber: 'TAX-NEXA-5566',
            paymentTerms: 'Due on Receipt',
            categories: ['Logistics', 'Warehousing', 'Freight'],
            averageRating: 4.5
        });

        // 4. Create Purchase Requests
        // PR-1: Approved PR for Developer Workstations
        const pr1 = await PurchaseRequest.create({
            prNumber: 'PR-2026-0001',
            requester: itRequester._id,
            department: itDept._id,
            priority: 'High',
            items: [
                { description: 'Dell Precision 5690 Core Ultra Workstations', quantity: 5, requiredDate: new Date(Date.now() + 14 * 86400000), estimatedCost: 2800 },
                { description: 'Dell UltraSharp 32" 4K USB-C Hub Monitors', quantity: 10, requiredDate: new Date(Date.now() + 14 * 86400000), estimatedCost: 650 }
            ],
            totalEstimatedCost: 20500,
            status: 'Approved',
            approvalHistory: [{
                reviewer: procurementManager._id,
                decision: 'Approved',
                comment: 'Budget verified against FY2026 Q1 IT expansion capital. Approved for RFQ.',
                timestamp: new Date(Date.now() - 3 * 86400000)
            }]
        });

        // PR-2: Submitted PR for Ergonomic Chairs (Pending Approval)
        const pr2 = await PurchaseRequest.create({
            prNumber: 'PR-2026-0002',
            requester: opsRequester._id,
            department: opsDept._id,
            priority: 'Medium',
            items: [
                { description: 'Herman Miller Aeron Ergonomic Task Chairs (Graphite)', quantity: 15, requiredDate: new Date(Date.now() + 20 * 86400000), estimatedCost: 950 },
                { description: 'Height-Adjustable Dual-Motor Standing Desks', quantity: 8, requiredDate: new Date(Date.now() + 20 * 86400000), estimatedCost: 550 }
            ],
            totalEstimatedCost: 18650,
            status: 'Submitted'
        });

        // PR-3: Returned for Correction
        const pr3 = await PurchaseRequest.create({
            prNumber: 'PR-2026-0003',
            requester: itRequester._id,
            department: itDept._id,
            priority: 'Urgent',
            items: [
                { description: 'Enterprise Cisco Catalyst 9300 Switches', quantity: 4, requiredDate: new Date(Date.now() + 5 * 86400000), estimatedCost: 4500 }
            ],
            totalEstimatedCost: 18000,
            status: 'Returned for Correction',
            approvalHistory: [{
                reviewer: procurementManager._id,
                decision: 'Returned for Correction',
                comment: 'Please specify the port count (24 or 48-port PoE+) and include support contract duration before re-submitting.',
                timestamp: new Date(Date.now() - 1 * 86400000)
            }]
        });

        // PR-4: Draft
        const pr4 = await PurchaseRequest.create({
            prNumber: 'PR-2026-0004',
            requester: opsRequester._id,
            department: opsDept._id,
            priority: 'Low',
            items: [
                { description: 'Commercial Air Purifiers HEPA 13', quantity: 6, requiredDate: new Date(Date.now() + 30 * 86400000), estimatedCost: 400 }
            ],
            totalEstimatedCost: 2400,
            status: 'Draft'
        });

        // 5. Create RFQ from Approved PR-1
        const rfq1 = await RFQ.create({
            rfqNumber: 'RFQ-2026-0001',
            purchaseRequest: pr1._id,
            closingDate: new Date(Date.now() + 7 * 86400000),
            invitedVendors: [vendor1._id, vendor3._id, vendor2._id],
            status: 'Awarded',
            quotations: [
                {
                    vendor: vendor1._id,
                    quotedPrice: 19800,
                    taxAmount: 1584,
                    totalAmount: 21384,
                    promisedDeliveryDate: new Date(Date.now() + 10 * 86400000),
                    deliveryLeadTimeDays: 10,
                    paymentTerms: 'Net 30',
                    submittedAt: new Date(Date.now() - 2 * 86400000)
                },
                {
                    vendor: vendor3._id,
                    quotedPrice: 20600,
                    taxAmount: 1648,
                    totalAmount: 22248,
                    promisedDeliveryDate: new Date(Date.now() + 14 * 86400000),
                    deliveryLeadTimeDays: 14,
                    paymentTerms: 'Net 30',
                    submittedAt: new Date(Date.now() - 1 * 86400000)
                }
            ],
            selectedVendor: vendor1._id,
            selectionReason: 'Apex Tech Solutions submitted the lowest compliant bid with the shortest delivery lead time (10 days vs 14 days) and favorable Net 30 payment terms.',
            awardedAt: new Date(Date.now() - 1 * 86400000)
        });

        // 6. Create Purchase Order from Awarded RFQ
        const po1 = await PurchaseOrder.create({
            poNumber: 'PO-2026-0001',
            rfq: rfq1._id,
            purchaseRequest: pr1._id,
            department: itDept._id,
            vendor: vendor1._id,
            items: [
                { description: 'Dell Precision 5690 Core Ultra Workstations', quantity: 5, unitPrice: 2700, receivedQuantity: 5 },
                { description: 'Dell UltraSharp 32" 4K USB-C Hub Monitors', quantity: 10, unitPrice: 630, receivedQuantity: 10 }
            ],
            subtotal: 19800,
            taxRate: 8,
            taxAmount: 1584,
            finalTotal: 21384,
            deliveryAddress: 'Tech Dock 2, 500 Enterprise Way, San Jose HQ',
            paymentTerms: 'Net 30',
            status: 'Received'
        });

        // 7. Create Goods Received Notes (GRN) for PO-1
        const grn1 = await GoodsReceived.create({
            grnNumber: 'GRN-2026-0001',
            purchaseOrder: po1._id,
            receivedBy: procurementManager._id,
            items: [
                { poItemIndex: 0, description: 'Dell Precision 5690 Core Ultra Workstations', orderedQuantity: 5, receivedQuantity: 5, damagedQuantity: 0, rejectedQuantity: 0, notes: 'All 5 laptops inspected and serial numbers verified.' },
                { poItemIndex: 1, description: 'Dell UltraSharp 32" 4K USB-C Hub Monitors', orderedQuantity: 10, receivedQuantity: 10, damagedQuantity: 0, rejectedQuantity: 0, notes: 'Boxes intact, screen testing passed.' }
            ],
            deliveryDate: new Date(Date.now() - 86400000)
        });

        // 8. Create Vendor Rating for Delivered PO-1
        await VendorRating.create({
            vendor: vendor1._id,
            purchaseOrder: po1._id,
            evaluatedBy: procurementManager._id,
            timelinessScore: 5,
            qualityScore: 5,
            communicationScore: 4.8,
            overallScore: 4.93,
            issueNotes: 'None. Delivered 2 days ahead of promised schedule.',
            resolutionNotes: 'Standard intake completed with IT Asset Management tag.'
        });

        // 9. Create Notifications
        await Notification.create([
            {
                recipient: procurementManager._id,
                title: 'PR Awaiting Approval',
                message: 'Elena Rostova submitted PR-2026-0002 for Ergonomic Chairs ($18,650)',
                link: '/purchase-requests',
                type: 'info',
                isRead: false
            },
            {
                recipient: itRequester._id,
                title: 'Purchase Order Delivered',
                message: 'PO-2026-0001 for Developer Workstations has been fully delivered and inspected.',
                link: '/goods-receipt',
                type: 'success',
                isRead: false
            },
            {
                recipient: itRequester._id,
                title: 'PR Returned for Correction',
                message: 'PR-2026-0003 was returned. Please specify port count and support duration.',
                link: '/purchase-requests',
                type: 'warning',
                isRead: true
            },
            {
                recipient: adminUser._id,
                title: 'New PO Issued',
                message: 'PO-2026-0001 was generated for Apex Tech Solutions Inc. ($21,384)',
                link: '/purchase-orders',
                type: 'info',
                isRead: false
            }
        ]);

        console.log('✅ Enterprise Production Seed Data Successfully Inserted!');
        console.log('---------------------------------------------------------');
        console.log('Test Accounts Available:');
        console.log('1. Admin:               admin@local.com / password123');
        console.log('2. Procurement Manager: procurement@local.com / password123');
        console.log('3. IT Dept Requester:   user.it@local.com / password123');
        console.log('4. Ops Dept Requester:  user.ops@local.com / password123');
        console.log('---------------------------------------------------------');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();