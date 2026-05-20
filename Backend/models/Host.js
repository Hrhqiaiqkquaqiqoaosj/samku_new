const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  streetLine1: {
    type: String,
    required: true,
    trim: true,
  },
  streetLine2: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: "India",
  },
  postalCode: {
    type: String,
    required: true,
    trim: true,
  },
});

const hostSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    countryCode: {
      type: String,
      required: true,
      default: "+91",
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: addressSchema,
      required: true,
    },
    clientHostBillable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for efficient searching
hostSchema.index({ name: 1 });
hostSchema.index({ contactEmail: 1 });
hostSchema.index({ "address.city": 1 });
hostSchema.index({ "address.state": 1 });

// Virtual for formatted address
hostSchema.virtual("formattedAddress").get(function () {
  const addr = this.address;
  if (!addr || !addr.streetLine1) {
    return '';
  }
  return `${
    addr.streetLine1
  }${addr.streetLine2 ? ", " + addr.streetLine2 : ""}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
});

// Transform output to include id and formatted timestamps
hostSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    ret.createdAt = ret.createdAt.toISOString();
    ret.updatedAt = ret.updatedAt.toISOString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Host", hostSchema);
