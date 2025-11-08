const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  siteName: {
    type: String,
    required: true,
    maxlength: [255, 'Site name cannot exceed 255 characters']
  },
  description: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'Rate cannot be negative']
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  }
}, { _id: true });

const billSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  siteIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site'
  }],
  billNumber: {
    type: String,
    required: [true, 'Bill number is required'],
    trim: true,
    maxlength: [50, 'Bill number cannot exceed 50 characters']
  },
  billDate: {
    type: Date,
    required: [true, 'Bill date is required'],
    index: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  isGSTBill: {
    type: Boolean,
    default: false
  },
  stateGST: {
    type: Number,
    default: 0,
    min: [0, 'State GST cannot be negative'],
    max: [100, 'State GST cannot exceed 100%']
  },
  centralGST: {
    type: Number,
    default: 0,
    min: [0, 'Central GST cannot be negative'],
    max: [100, 'Central GST cannot exceed 100%']
  },
  totalTaxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['UNPAID', 'PARTIAL', 'PAID'],
    default: 'UNPAID',
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  items: [billItemSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Unique bill number per admin
billSchema.index({ adminId: 1, billNumber: 1 }, { unique: true });
billSchema.index({ adminId: 1, billDate: -1 });
billSchema.index({ adminId: 1, paymentStatus: 1 });

// Virtual populate customer
billSchema.virtual('customer', {
  ref: 'Client',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate sites
billSchema.virtual('sites', {
  ref: 'Site',
  localField: 'siteIds',
  foreignField: '_id'
});

// Pre-save middleware to calculate totals
billSchema.pre('save', function(next) {
  // Calculate subtotal from items
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  }
  
  // Calculate tax
  if (this.isGSTBill) {
    const taxRate = (this.stateGST + this.centralGST) / 100;
    this.totalTaxAmount = this.subtotal * taxRate;
  } else {
    this.totalTaxAmount = 0;
  }
  
  // Calculate total
  this.totalAmount = this.subtotal + this.totalTaxAmount;
  
  next();
});

module.exports = mongoose.model('Bill', billSchema);