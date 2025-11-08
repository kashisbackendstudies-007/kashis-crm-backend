const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: [true, 'Expense type is required'],
    enum: ['FUEL', 'FOOD', 'SALARY', 'OTHERS'],
    index: true
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    index: true
  },
  crewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crew',
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  description: {
    type: String,
    trim: true
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required'],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
expenseSchema.index({ adminId: 1, type: 1 });
expenseSchema.index({ adminId: 1, expenseDate: -1 });
expenseSchema.index({ adminId: 1, createdAt: -1 });

// Virtual populate
expenseSchema.virtual('site', {
  ref: 'Site',
  localField: 'siteId',
  foreignField: '_id',
  justOne: true
});

expenseSchema.virtual('crew', {
  ref: 'Crew',
  localField: 'crewId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Expense', expenseSchema);