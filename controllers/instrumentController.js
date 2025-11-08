const Instrument = require('../models/Instrument');

exports.getInstruments = async (req, res) => {
  try {
    const { search, type, status, page = 1, limit = 10 } = req.query;
    const query = { adminId: req.admin._id };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (type) query.type = type;
    if (status) query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const instruments = await Instrument.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Instrument.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: instruments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get instruments error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.getInstrument = async (req, res) => {
  try {
    const instrument = await Instrument.findOne({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!instrument) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Instrument not found' }
      });
    }
    
    res.status(200).json({ success: true, data: instrument });
  } catch (error) {
    console.error('Get instrument error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.createInstrument = async (req, res) => {
  try {
    const instrument = await Instrument.create({
      ...req.body,
      adminId: req.admin._id
    });
    
    res.status(201).json({ success: true, data: instrument });
  } catch (error) {
    console.error('Create instrument error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Serial number already exists'
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

exports.updateInstrument = async (req, res) => {
  try {
    const instrument = await Instrument.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!instrument) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Instrument not found' }
      });
    }
    
    res.status(200).json({ success: true, data: instrument });
  } catch (error) {
    console.error('Update instrument error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.deleteInstrument = async (req, res) => {
  try {
    const instrument = await Instrument.findOneAndDelete({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!instrument) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Instrument not found' }
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Instrument deleted successfully'
    });
  } catch (error) {
    console.error('Delete instrument error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};