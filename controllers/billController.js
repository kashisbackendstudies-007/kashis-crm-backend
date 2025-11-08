const Bill = require('../models/Bill');
const Site = require('../models/Site');

exports.getBills = async (req, res) => {
  try {
    const {
      search,
      customerId,
      paymentStatus,
      startDate,
      endDate,
      year,
      page = 1,
      limit = 10,
      sortBy = 'billDate',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { adminId: req.admin._id };
    
    if (customerId) query.customerId = customerId;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (startDate) query.billDate = { $gte: new Date(startDate) };
    if (endDate) query.billDate = { ...query.billDate, $lte: new Date(endDate) };
    if (year) {
      query.billDate = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }
    
    if (search) {
      const customers = await require('../models/Client').find({
        adminId: req.admin._id,
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { customerId: { $in: customers.map(c => c._id) } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const bills = await Bill.find(query)
      .populate('customerId', 'name company')
      .populate('siteIds', 'name city')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Bill.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: bills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.getBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      adminId: req.admin._id
    })
      .populate('customerId')
      .populate('siteIds', 'name address city');
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Bill not found' }
      });
    }
    
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.createBill = async (req, res) => {
  try {
    const { items, ...billData } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one bill item is required'
        }
      });
    }
    
    // Extract site IDs from items
    const siteIds = [...new Set(items.map(item => item.siteId))];
    
    const bill = await Bill.create({
      ...billData,
      adminId: req.admin._id,
      siteIds,
      items
    });
    
    // Update sites with bill reference
    await Site.updateMany(
      { _id: { $in: siteIds } },
      { 
        billId: bill._id,
        status: bill.paymentStatus === 'PAID' ? 'BILL PAID' : 'BILL SUBMITTED'
      }
    );
    
    const populatedBill = await Bill.findById(bill._id)
      .populate('customerId', 'name company')
      .populate('siteIds', 'name city');
    
    res.status(201).json({ success: true, data: populatedBill });
  } catch (error) {
    console.error('Create bill error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Bill number already exists'
        }
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: { fields: errors }
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const oldBill = await Bill.findOne({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!oldBill) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Bill not found' }
      });
    }
    
    const { items, ...billData } = req.body;
    
    // Update site IDs if items changed
    if (items) {
      billData.siteIds = [...new Set(items.map(item => item.siteId))];
      billData.items = items;
    }
    
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      billData,
      { new: true, runValidators: true }
    );
    
    // Update site statuses if payment status changed
    if (billData.paymentStatus && billData.paymentStatus !== oldBill.paymentStatus) {
      const newStatus = billData.paymentStatus === 'PAID' ? 'BILL PAID' : 'BILL SUBMITTED';
      await Site.updateMany(
        { _id: { $in: bill.siteIds } },
        { status: newStatus }
      );
    }
    
    const populatedBill = await Bill.findById(bill._id)
      .populate('customerId', 'name company')
      .populate('siteIds', 'name city');
    
    res.status(200).json({ success: true, data: populatedBill });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Bill not found' }
      });
    }
    
    // Remove bill reference from sites
    await Site.updateMany(
      { billId: bill._id },
      { $unset: { billId: '' }, status: 'DRAWING COMPLETED' }
    );
    
    await bill.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.getNextBillNumber = async (req, res) => {
  try {
    const latestBill = await Bill.findOne({ adminId: req.admin._id })
      .sort({ billNumber: -1 })
      .select('billNumber');
    
    let nextNumber = '1';
    if (latestBill && latestBill.billNumber) {
      const currentNumber = parseInt(latestBill.billNumber);
      if (!isNaN(currentNumber)) {
        nextNumber = (currentNumber + 1).toString();
      }
    }
    
    res.status(200).json({
      success: true,
      data: { nextBillNumber: nextNumber }
    });
  } catch (error) {
    console.error('Get next bill number error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};