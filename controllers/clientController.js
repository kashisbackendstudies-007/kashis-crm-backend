const Client = require('../models/Client');
const Site = require('../models/Site');
const Bill = require('../models/Bill');

// @desc    Get all clients
// @route   GET /v1/clients
// @access  Private
exports.getClients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = { adminId: req.admin._id };
    
    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const clients = await Client.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Client.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Server error'
      }
    });
  }
};

// @desc    Get single client
// @route   GET /v1/clients/:id
// @access  Private
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found'
        }
      });
    }
    
    let responseData = client.toObject();
    
    // Include stats if requested
    if (req.query.includeStats === 'true') {
      const sites = await Site.find({ clientId: client._id });
      const bills = await Bill.find({ customerId: client._id });
      
      const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
      const paidAmount = bills
        .filter(bill => bill.paymentStatus === 'PAID')
        .reduce((sum, bill) => sum + bill.totalAmount, 0);
      
      responseData.stats = {
        totalProjects: sites.length,
        activeProjects: sites.filter(s => !['PROJECT COMPLETED'].includes(s.status)).length,
        completedProjects: sites.filter(s => s.status === 'PROJECT COMPLETED').length,
        totalBills: bills.length,
        totalRevenue,
        paidAmount,
        pendingAmount: totalRevenue - paidAmount
      };
    }
    
    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Server error'
      }
    });
  }
};

// @desc    Create client
// @route   POST /v1/clients
// @access  Private
exports.createClient = async (req, res) => {
  try {
    const clientData = {
      ...req.body,
      adminId: req.admin._id
    };
    
    const client = await Client.create(clientData);
    
    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Create client error:', error);
    
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
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Server error'
      }
    });
  }
};

// @desc    Update client
// @route   PUT /v1/clients/:id
// @access  Private
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Update client error:', error);
    
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
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Server error'
      }
    });
  }
};

// @desc    Delete client
// @route   DELETE /v1/clients/:id
// @access  Private
exports.deleteClient = async (req, res) => {
  try {
    // Check if client has associated bills or active sites
    const bills = await Bill.countDocuments({ customerId: req.params.id });
    const activeSites = await Site.countDocuments({
      clientId: req.params.id,
      status: { $nin: ['PROJECT COMPLETED'] }
    });
    
    if (bills > 0 || activeSites > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Cannot delete client with associated bills or active sites'
        }
      });
    }
    
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Server error'
      }
    });
  }
};