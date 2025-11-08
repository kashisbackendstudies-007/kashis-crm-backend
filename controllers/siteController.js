const Site = require('../models/Site');
const Instrument = require('../models/Instrument');

// @desc    Get all sites
// @route   GET /v1/sites
// @access  Private
exports.getSites = async (req, res) => {
  try {
    const {
      search,
      status,
      clientId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'startDate',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { adminId: req.admin._id };
    
    // Filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.startDate = { ...query.startDate, $lte: new Date(endDate) };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const sites = await Site.find(query)
      .populate('clientId', 'name company')
      .populate('crewIds', 'name')
      .populate('instrumentIds', 'name status')
      .populate('vehicleId', 'name registrationNumber')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Site.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: sites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Server error'
      }
    });
  }
};

// @desc    Get single site
// @route   GET /v1/sites/:id
// @access  Private
exports.getSite = async (req, res) => {
  try {
    const includes = req.query.include ? req.query.include.split(',') : [];
    
    let query = Site.findOne({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    // Populate based on includes
    if (includes.includes('client')) query = query.populate('clientId', 'name company');
    if (includes.includes('crews')) query = query.populate('crewIds', 'name isActive');
    if (includes.includes('instruments')) query = query.populate('instrumentIds', 'name status');
    if (includes.includes('vehicle')) query = query.populate('vehicleId', 'name registrationNumber');
    if (includes.includes('bill')) query = query.populate('billId', 'billNumber totalAmount paymentStatus');
    
    const site = await query;
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Site not found'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Server error'
      }
    });
  }
};

// @desc    Create site
// @route   POST /v1/sites
// @access  Private
exports.createSite = async (req, res) => {
  try {
    const { crewIds, instrumentIds, ...siteData } = req.body;
    
    const site = await Site.create({
      ...siteData,
      adminId: req.admin._id,
      crewIds: crewIds || [],
      instrumentIds: instrumentIds || []
    });
    
    // Update instrument statuses to in-use
    if (instrumentIds && instrumentIds.length > 0) {
      await Instrument.updateMany(
        { _id: { $in: instrumentIds }, status: 'available' },
        { status: 'in-use' }
      );
    }
    
    res.status(201).json({
      success: true,
      data: site
    });
  } catch (error) {
    console.error('Create site error:', error);
    
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

// @desc    Update site
// @route   PUT /v1/sites/:id
// @access  Private
exports.updateSite = async (req, res) => {
  try {
    const site = await Site.findOne({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Site not found'
        }
      });
    }
    
    const { crewIds, instrumentIds, ...updateData } = req.body;
    
    // Handle instrument changes
    if (instrumentIds) {
      const oldInstrumentIds = site.instrumentIds.map(id => id.toString());
      const newInstrumentIds = instrumentIds.map(id => id.toString());
      
      // Find removed instruments
      const removedIds = oldInstrumentIds.filter(id => !newInstrumentIds.includes(id));
      if (removedIds.length > 0) {
        await Instrument.updateMany(
          { _id: { $in: removedIds } },
          { status: 'available' }
        );
      }
      
      // Find added instruments
      const addedIds = newInstrumentIds.filter(id => !oldInstrumentIds.includes(id));
      if (addedIds.length > 0) {
        await Instrument.updateMany(
          { _id: { $in: addedIds }, status: 'available' },
          { status: 'in-use' }
        );
      }
      
      updateData.instrumentIds = instrumentIds;
    }
    
    if (crewIds) {
      updateData.crewIds = crewIds;
    }
    
    Object.assign(site, updateData);
    await site.save();
    
    res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    console.error('Update site error:', error);
    
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

// @desc    Delete site
// @route   DELETE /v1/sites/:id
// @access  Private
exports.deleteSite = async (req, res) => {
  try {
    const site = await Site.findOne({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Site not found'
        }
      });
    }
    
    // Release instruments
    if (site.instrumentIds && site.instrumentIds.length > 0) {
      await Instrument.updateMany(
        { _id: { $in: site.instrumentIds } },
        { status: 'available' }
      );
    }
    
    await site.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Site deleted successfully'
    });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Server error'
      }
    });
  }
};