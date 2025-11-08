const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [255, 'Subject cannot exceed 255 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['new', 'in-progress', 'completed', 'closed'],
    default: 'new',
    index: true
  },
  followUpDate: {
    type: Date,
    index: true
  },
  responseNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
enquirySchema.index({ adminId: 1, status: 1 });
enquirySchema.index({ adminId: 1, followUpDate: 1 });
enquirySchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model('Enquiry', enquirySchema);