const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const crewSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Crew name is required'],
    trim: true,
    maxlength: [255, 'Name cannot exceed 255 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    maxlength: [100, 'Username cannot exceed 100 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for unique username per admin
crewSchema.index({ adminId: 1, username: 1 }, { unique: true });

// Hash password before saving (for reference/tracking only, NOT for authentication)
crewSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Remove password from JSON output
crewSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Crew', crewSchema);