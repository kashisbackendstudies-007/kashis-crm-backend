const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    index: true
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    index: true
  },
  name: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true,
    maxlength: [255, 'Name cannot exceed 255 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters']
  },
  locationUrl: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: [
      'PENDING',
      'ON SITE COMPLETED',
      'DRAWING COMPLETED',
      'BILL SUBMITTED',
      'BILL PAID',
      'PROJECT COMPLETED'
    ],
    default: 'PENDING',
    index: true
  },
  crewIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crew'
  }],
  instrumentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instrument'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
siteSchema.index({ adminId: 1, status: 1 });
siteSchema.index({ adminId: 1, startDate: -1 });
siteSchema.index({ adminId: 1, createdAt: -1 });

// Virtual populate
siteSchema.virtual('client', {
  ref: 'Client',
  localField: 'clientId',
  foreignField: '_id',
  justOne: true
});

siteSchema.virtual('crews', {
  ref: 'Crew',
  localField: 'crewIds',
  foreignField: '_id'
});

siteSchema.virtual('instruments', {
  ref: 'Instrument',
  localField: 'instrumentIds',
  foreignField: '_id'
});

siteSchema.virtual('vehicle', {
  ref: 'Vehicle',
  localField: 'vehicleId',
  foreignField: '_id',
  justOne: true
});

siteSchema.virtual('bill', {
  ref: 'Bill',
  localField: 'billId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Site', siteSchema);