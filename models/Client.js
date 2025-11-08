const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [255, 'Name cannot exceed 255 characters'],
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone cannot exceed 20 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [255, 'Company name cannot exceed 255 characters']
  },
  address: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'GST number cannot exceed 50 characters'],
    index: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for admin-specific queries
clientSchema.index({ adminId: 1, createdAt: -1 });

// Virtual for sites
clientSchema.virtual('sites', {
  ref: 'Site',
  localField: '_id',
  foreignField: 'clientId'
});

// Virtual for bills
clientSchema.virtual('bills', {
  ref: 'Bill',
  localField: '_id',
  foreignField: 'customerId'
});

module.exports = mongoose.model('Client', clientSchema);