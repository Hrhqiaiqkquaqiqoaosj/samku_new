const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Station name is required'],
    trim: true,
    maxlength: [100, 'Station name cannot exceed 100 characters']
  },
  ownedBy: {
    type: String,
    required: [true, 'Owner information is required'],
    trim: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Host',
    required: [true, 'Host ID is required']
  },
  address: {
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    }
  },
  operatingHours: {
    open: {
      type: String,
      required: [true, 'Opening time is required'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
    },
    close: {
      type: String,
      required: [true, 'Closing time is required'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
    },
    is24x7: {
      type: Boolean,
      default: false
    }
  },
  amenities: [{
    type: String,
    enum: ['parking', 'restroom', 'cafe', 'wifi', 'restaurant', 'shopping', 'atm', 'medical']
  }],
  totalChargers: {
    type: Number,
    default: 0,
    min: [0, 'Total chargers cannot be negative']
  },
  activeChargers: {
    type: Number,
    default: 0,
    min: [0, 'Active chargers cannot be negative']
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  features: [{
    type: String,
    enum: ['covered_parking', 'security', 'cctv', 'lighting', 'accessible']
  }],
  pricing: {
    baseRate: {
      type: Number,
      min: [0, 'Base rate cannot be negative'],
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    taxIncluded: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for chargers
stationSchema.virtual('chargers', {
  ref: 'Charger',
  localField: '_id',
  foreignField: 'stationId'
});

// Indexes for better performance
stationSchema.index({ hostId: 1 });
stationSchema.index({ 'address.city': 1, 'address.state': 1 });
stationSchema.index({ status: 1 });
stationSchema.index({ isVerified: 1 });
stationSchema.index({ 'address.coordinates.latitude': 1, 'address.coordinates.longitude': 1 });

// Pre-save middleware to calculate total chargers
stationSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('hostId')) {
    // You can add logic here to calculate total chargers
    // For now, we'll handle this in the charger model
  }
  next();
});

module.exports = mongoose.model('Station', stationSchema);
