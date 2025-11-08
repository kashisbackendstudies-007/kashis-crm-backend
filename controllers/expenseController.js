const Expense = require('../models/Expense');

exports.getExpenses = async (req, res) => {
  try {
    const {
      type,
      siteId,
      crewId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'expenseDate',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { adminId: req.admin._id };
    
    if (type) query.type = type;
    if (siteId) query.siteId = siteId;
    if (crewId) query.crewId = crewId;
    if (startDate) query.expenseDate = { $gte: new Date(startDate) };
    if (endDate) query.expenseDate = { ...query.expenseDate, $lte: new Date(endDate) };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const expenses = await Expense.find(query)
      .populate('siteId', 'name city')
      .populate('crewId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Expense.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      adminId: req.admin._id
    })
      .populate('siteId', 'name city')
      .populate('crewId', 'name');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Expense not found' }
      });
    }
    
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      adminId: req.admin._id
    });
    
    const populatedExpense = await Expense.findById(expense._id)
      .populate('siteId', 'name city')
      .populate('crewId', 'name');
    
    res.status(201).json({ success: true, data: populatedExpense });
  } catch (error) {
    console.error('Create expense error:', error);
    
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

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin._id },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('siteId', 'name city')
      .populate('crewId', 'name');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Expense not found' }
      });
    }
    
    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Expense not found' }
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};