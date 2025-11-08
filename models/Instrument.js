const mongoose = require('mongoose');

const instrumentSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Instrument name is required'],
    trim: true,
    maxlength: [255, 'Name cannot exceed 255 characters']
  },
  type: {
    type: String,
    trim: true,
    maxlength: [100, 'Type cannot exceed 100 characters']
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Serial number cannot exceed 100 characters'],
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'in-use', 'repair', 'lost'],
    default: 'available',
    index: true
  },
  lastServicedOn: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
instrumentSchema.index({ adminId: 1, status: 1 });
instrumentSchema.index({ adminId: 1, lastServicedOn: -1 });

module.exports = mongoose.model('Instrument', instrumentSchema);

