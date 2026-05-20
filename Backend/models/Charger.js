const mongoose = require('mongoose');

const chargerSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9_-]+$/, 'Serial number can only contain letters, numbers, underscores and hyphens']
  },
  protocol: {
    type: String,
    enum: ['OCPP1.6', 'OCPP2.0.1', 'MQTT'],
    required: true,
    default: 'OCPP1.6'
  },
  name: {
    type: String,
    required: [true, 'Charger name is required'],
    trim: true,
    maxlength: [100, 'Charger name cannot exceed 100 characters']
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: [true, 'Station ID is required']
  },
  powerType: {
    type: String,
    enum: ['AC', 'DC'],
    required: [true, 'Power type is required']
  },
  capacity: {
    type: String,
    required: [true, 'Capacity is required'],
    trim: true
  },
  maxPower: {
    type: Number,
    min: [0, 'Max power cannot be negative']
  },
  connectorType: {
    type: String,
    enum: ['CCS', 'CHAdeMO', 'Type2', 'Type1', 'GB/T'],
    default: 'Type2'
  },
  numberOfConnectors: {
    type: Number,
    default: 1,
    min: [1, 'Number of connectors must be at least 1'],
    max: [4, 'Number of connectors cannot exceed 4']
  },
  status: {
    type: String,
    enum: ['ONLINE', 'OFFLINE', 'CONFIGURING', 'FAULTED', 'RESERVED', 'UNAVAILABLE'],
    default: 'OFFLINE'
  },
  ocppConnection: {
    isConnected: {
      type: Boolean,
      default: false
    },
    websocketUrl: {
      type: String,
      trim: true
    },
    lastHeartbeat: {
      type: Date
    },
    protocolVersion: {
      type: String,
      enum: ['1.5', '1.6', '2.0', '2.0.1'],
      default: '1.6'
    },
    connectionId: {
      type: String,
      trim: true
    }
  },
  firmware: {
    version: {
      type: String,
      trim: true
    },
    lastUpdated: {
      type: Date
    },
    updateStatus: {
      type: String,
      enum: ['IDLE', 'DOWNLOADING', 'DOWNLOADED', 'INSTALLING', 'INSTALLED', 'FAILED'],
      default: 'IDLE'
    }
  },
  configuration: {
    meterValueSampleInterval: {
      type: Number,
      default: 60, // seconds
      min: [10, 'Sample interval cannot be less than 10 seconds']
    },
    heartbeatInterval: {
      type: Number,
      default: 300, // seconds
      min: [30, 'Heartbeat interval cannot be less than 30 seconds']
    },
    authorizationCacheEnabled: {
      type: Boolean,
      default: true
    },
    localAuthListEnabled: {
      type: Boolean,
      default: true
    },
    stopTransactionOnInvalidId: {
      type: Boolean,
      default: false
    },
    unlockConnectorOnEVSideDisconnect: {
      type: Boolean,
      default: true
    }
  },
  lastOnline: {
    type: Date,
    default: Date.now
  },
  lastOffline: {
    type: Date
  },
  errorCodes: [{
    code: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  meterValues: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    values: [{
      measurand: {
        type: String,
        enum: ['Energy.Active.Import.Register', 'Power.Active.Import', 'Current.Import', 'Voltage', 'Temperature']
      },
      value: Number,
      unit: String,
      phase: String,
      location: String
    }]
  }],
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  currentTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  pricing: {
    ratePerKWh: {
      type: Number,
      min: [0, 'Rate per kWh cannot be negative'],
      default: 0
    },
    ratePerMinute: {
      type: Number,
      min: [0, 'Rate per minute cannot be negative'],
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  maintenance: {
    lastServiceDate: Date,
    nextServiceDate: Date,
    serviceInterval: {
      type: Number,
      default: 90, // days
      min: [1, 'Service interval must be at least 1 day']
    },
    maintenanceNotes: [{
      date: {
        type: Date,
        default: Date.now
      },
      technician: String,
      notes: String,
      type: {
        type: String,
        enum: ['ROUTINE', 'REPAIR', 'UPGRADE', 'INSPECTION']
      }
    }]
  },
  qrCode: {
    url: String,
    generated: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for station details
chargerSchema.virtual('station', {
  ref: 'Station',
  localField: 'stationId',
  foreignField: '_id',
  justOne: true
});

// Indexes for better performance
chargerSchema.index({ serialNumber: 1 }, { unique: true });
chargerSchema.index({ stationId: 1 });
chargerSchema.index({ status: 1 });
chargerSchema.index({ 'ocppConnection.isConnected': 1 });
chargerSchema.index({ powerType: 1 });
chargerSchema.index({ isActive: 1 });

// Pre-save middleware to generate OCPP WebSocket URL
chargerSchema.pre('save', function(next) {

  // If charger is OCPP → generate WebSocket URL
  if (this.protocol === 'OCPP1.6' || this.protocol === 'OCPP2.0.1') {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'wss://cms-o4rp.onrender.com'
      : 'ws://localhost:5000';

    this.ocppConnection.websocketUrl = `${baseUrl}/ocpp/${this.serialNumber}`;
  }

  // If charger is MQTT → no WebSocket needed
  if (this.protocol === 'MQTT') {
    this.ocppConnection.websocketUrl = null;
    this.ocppConnection.isConnected = false;
  }

  next();
});

// Method to generate QR code URL
chargerSchema.methods.generateQRCode = function() {
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://cms-o4rp.onrender.com' 
    : 'http://localhost:5173';
  this.qrCode = {
    url: `${frontendUrl}/charge/${this.serialNumber}`,
    generated: new Date()
  };
  return this.qrCode.url;
};

// Method to update status
chargerSchema.methods.updateStatus = function(newStatus, additional = {}) {
  this.status = newStatus;
  
  if (newStatus === 'ONLINE') {
    this.lastOnline = new Date();
    this.ocppConnection.isConnected = true;
  } else if (newStatus === 'OFFLINE') {
    this.lastOffline = new Date();
    this.ocppConnection.isConnected = false;
  }
  
  // Update additional fields if provided
  Object.assign(this, additional);
  
  return this.save();
};

// Method to add meter values
chargerSchema.methods.addMeterValues = function(values) {
  this.meterValues.push({
    timestamp: new Date(),
    values: values
  });
  
  // Keep only last 1000 meter value records
  if (this.meterValues.length > 1000) {
    this.meterValues = this.meterValues.slice(-1000);
  }
  
  return this.save();
};

// Static method to find chargers by station
chargerSchema.statics.findByStation = function(stationId) {
  return this.find({ stationId, isActive: true }).populate('station');
};

// Static method to find online chargers
chargerSchema.statics.findOnline = function() {
  return this.find({ status: 'ONLINE', isActive: true });
};

module.exports = mongoose.model('Charger', chargerSchema);
