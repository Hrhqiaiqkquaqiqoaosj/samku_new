const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

const sampleUsers = [
  {
    username: "john_doe",
    email: "john.doe@example.com",
    password: "password123",
    role: "USER",
    profile: {
      firstName: "John",
      lastName: "Doe",
      phone: "+91 9876543210",
      address: {
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India"
      }
    },
    isActive: true,
    isVerified: true
  },
  {
    username: "jane_smith",
    email: "jane.smith@example.com",
    password: "password123",
    role: "USER",
    profile: {
      firstName: "Jane",
      lastName: "Smith",
      phone: "+91 9876543211",
      address: {
        street: "456 Park Avenue",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        country: "India"
      }
    },
    isActive: true,
    isVerified: false
  },
  {
    username: "mike_johnson",
    email: "mike.johnson@example.com",
    password: "password123",
    role: "USER",
    profile: {
      firstName: "Mike",
      lastName: "Johnson",
      phone: "+91 9876543212",
      address: {
        street: "789 Tech Park",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560100",
        country: "India"
      }
    },
    isActive: false,
    isVerified: true
  },
  {
    username: "sarah_wilson",
    email: "sarah.wilson@example.com",
    password: "password123",
    role: "USER",
    profile: {
      firstName: "Sarah",
      lastName: "Wilson",
      phone: "+91 9876543213",
      address: {
        street: "321 Green Avenue",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        country: "India"
      }
    },
    isActive: true,
    isVerified: true
  },
  {
    username: "alex_brown",
    email: "alex.brown@example.com",
    password: "password123",
    role: "USER",
    profile: {
      firstName: "Alex",
      lastName: "Brown",
      phone: "+91 9876543214",
      address: {
        street: "987 Urban Plaza",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
        country: "India"
      }
    },
    isActive: true,
    isVerified: false
  }
];

async function populateUsers() {
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

    // Clear existing users with USER role
    await User.deleteMany({ role: "USER" });
    console.log("Cleared existing USER role users");

    // Insert sample users
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`Created ${createdUsers.length} users:`);

    createdUsers.forEach((user) => {
      console.log(`- ${user.fullName} (${user.email}) - Active: ${user.isActive}, Verified: ${user.isVerified}`);
    });

    console.log("\nUser population completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error populating users:", error);
    process.exit(1);
  }
}

populateUsers(); 