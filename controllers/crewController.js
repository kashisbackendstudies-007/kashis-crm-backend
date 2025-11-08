const Crew = require('../models/Crew');

exports.getCrews = async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 10 } = req.query;
    const query = { adminId: req.admin._id };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const crews = await Crew.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Crew.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: crews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get crews error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.getCrew = async (req, res) => {
  try {
    const crew = await Crew.findOne({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!crew) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Crew member not found' }
      });
    }
    
    res.status(200).json({ success: true, data: crew });
  } catch (error) {
    console.error('Get crew error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.createCrew = async (req, res) => {
  try {
    // Check if username exists for this admin
    const existingCrew = await Crew.findOne({
      adminId: req.admin._id,
      username: req.body.username
    });
    
    if (existingCrew) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Username already exists'
        }
      });
    }
    
    const crew = await Crew.create({
      ...req.body,
      adminId: req.admin._id
    });
    
    res.status(201).json({ success: true, data: crew });
  } catch (error) {
    console.error('Create crew error:', error);
    
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

exports.updateCrew = async (req, res) => {
  try {
    const crew = await Crew.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!crew) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Crew member not found' }
      });
    }
    
    res.status(200).json({ success: true, data: crew });
  } catch (error) {
    console.error('Update crew error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};

exports.deleteCrew = async (req, res) => {
  try {
    const crew = await Crew.findOneAndDelete({
      _id: req.params.id,
      adminId: req.admin._id
    });
    
    if (!crew) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Crew member not found' }
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Crew member deleted successfully'
    });
  } catch (error) {
    console.error('Delete crew error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' }
    });
  }
};