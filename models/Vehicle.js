
const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Vehicle name is required'],
    trim: true,
    maxlength: [255, 'Name cannot exceed 255 characters']
  },
  type: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['car', 'truck', 'van', 'bike', 'other']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    trim: true,
    uppercase: true,
    unique: true,
    maxlength: [50, 'Registration number cannot exceed 50 characters'],
    index: true
  },
  model: {
    type: String,
    trim: true,
    maxlength: [100, 'Model cannot exceed 100 characters']
  },
  year: {
    type: Number,
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active',
    index: true
  },
  insuranceExpiry: {
    type: Date,
    index: true
  },
  pollutionExpiry: {
    type: Date,
    index: true
  },
  serviceDueDate: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
vehicleSchema.index({ adminId: 1, status: 1 });
vehicleSchema.index({ adminId: 1, insuranceExpiry: 1 });
vehicleSchema.index({ adminId: 1, pollutionExpiry: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);