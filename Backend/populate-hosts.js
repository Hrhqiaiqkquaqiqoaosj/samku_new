const mongoose = require("mongoose");
require("dotenv").config();

const Host = require("./models/Host");

const sampleHosts = [
  {
    name: "Metro Energy",
    contactPerson: "Yashwant Ghorband",
    contactEmail: "yashuchrist@metroenergy.com",
    countryCode: "+91",
    phoneNumber: "9876543210",
    address: {
      streetLine1: "123 Main Street",
      streetLine2: "Office 456",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      postalCode: "400001",
    },
    clientHostBillable: true,
    isActive: true,
  },
  {
    name: "Highway Solutions",
    contactPerson: "Amol Rakh",
    contactEmail: "amluzat@highway.com",
    countryCode: "+91",
    phoneNumber: "9876543211",
    address: {
      streetLine1: "456 Highway Road",
      streetLine2: "Tower A",
      city: "Ahmedabad",
      state: "Gujarat",
      country: "India",
      postalCode: "380001",
    },
    clientHostBillable: true,
    isActive: true,
  },
  {
    name: "EcoCharge Solutions",
    contactPerson: "Sahil Wadaskar",
    contactEmail: "sahil@ecocharge.com",
    countryCode: "+91",
    phoneNumber: "9876543212",
    address: {
      streetLine1: "789 Tech Park",
      streetLine2: "Building B",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      postalCode: "560100",
    },
    clientHostBillable: true,
    isActive: true,
  },
  {
    name: "GreenPower Inc",
    contactPerson: "Priya Sharma",
    contactEmail: "priya@greenpower.com",
    countryCode: "+91",
    phoneNumber: "9876543213",
    address: {
      streetLine1: "321 Green Avenue",
      streetLine2: "Floor 3",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      postalCode: "411001",
    },
    clientHostBillable: true,
    isActive: true,
  },
  {
    name: "City Charging Network",
    contactPerson: "Rajesh Kumar",
    contactEmail: "rajesh@citycharging.com",
    countryCode: "+91",
    phoneNumber: "9876543214",
    address: {
      streetLine1: "987 Urban Plaza",
      streetLine2: "Suite 201",
      city: "Delhi",
      state: "Delhi",
      country: "India",
      postalCode: "110001",
    },
    clientHostBillable: true,
    isActive: true,
  },
];

async function populateHosts() {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/samku_cms",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("Connected to MongoDB");

    // Clear existing hosts
    await Host.deleteMany({});
    console.log("Cleared existing hosts");

    // Insert sample hosts
    const createdHosts = await Host.insertMany(sampleHosts);
    console.log(`Created ${createdHosts.length} hosts:`);

    createdHosts.forEach((host) => {
      console.log(`- ${host.name} (${host.contactEmail})`);
    });

    console.log("\nHost population completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error populating hosts:", error);
    process.exit(1);
  }
}

populateHosts();
