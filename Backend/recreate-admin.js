/**
 * Script to recreate admin user with correct password
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const recreateAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Delete existing admin user
    await User.deleteOne({ email: "admin@samku.com" });
    console.log("Deleted existing admin user");

    // Create new admin user
    const adminUser = new User({
      username: "admin",
      email: "admin@samku.com",
      password: "admin123", // This will be hashed by the pre-save middleware
      role: "ADMIN",
      profile: {
        firstName: "Admin",
        lastName: "User",
        phone: "+91 9876543210",
      },
      isEmailVerified: true,
      isActive: true,
    });

    await adminUser.save();
    console.log("✅ New admin user created successfully!");

    // Test the password immediately
    const testUser = await User.findByEmailOrUsername("admin@samku.com");
    const passwordMatch = await testUser.comparePassword("admin123");

    console.log("Verification:");
    console.log(`- Email: ${testUser.email}`);
    console.log(
      `- Password verification: ${passwordMatch ? "SUCCESS" : "FAILED"}`
    );

    if (passwordMatch) {
      console.log("\n✅ You can now log in with:");
      console.log("Email: admin@samku.com");
      console.log("Password: admin123");
    } else {
      console.log(
        "❌ Password verification failed - something is wrong with the hashing"
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("Error recreating admin user:", error);
    process.exit(1);
  }
};

recreateAdmin();
