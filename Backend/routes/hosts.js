const express = require("express");
const { auth } = require("../middleware/auth");
const Host = require("../models/Host");

const router = express.Router();

// Get all hosts
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 100, search, city, state, isActive } = req.query;

    // Build filter object
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (city) {
      filter["address.city"] = { $regex: city, $options: "i" };
    }

    if (state) {
      filter["address.state"] = { $regex: state, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { contactEmail: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const [hosts, total] = await Promise.all([
      Host.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      Host.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: hosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching hosts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching hosts",
      error: error.message,
    });
  }
});

// Get host by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const host = await Host.findById(req.params.id);

    if (!host) {
      return res.status(404).json({
        success: false,
        message: "Host not found",
      });
    }

    res.json({
      success: true,
      data: host,
    });
  } catch (error) {
    console.error("Error fetching host:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching host",
      error: error.message,
    });
  }
});

// Create new host
router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      contactEmail,
      countryCode,
      phoneNumber,
      address,
      clientHostBillable,
    } = req.body;

    // Validate required fields
    if (!name || !contactPerson || !contactEmail || !phoneNumber || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if host with same email already exists
    const existingHost = await Host.findOne({ contactEmail });
    if (existingHost) {
      return res.status(400).json({
        success: false,
        message: "Host with this email already exists",
      });
    }

    // Create new host
    const host = new Host({
      name,
      contactPerson,
      contactEmail,
      countryCode: countryCode || "+91",
      phoneNumber,
      address,
      clientHostBillable:
        clientHostBillable !== undefined ? clientHostBillable : true,
    });

    await host.save();

    res.status(201).json({
      success: true,
      message: "Host created successfully",
      data: host,
    });
  } catch (error) {
    console.error("Error creating host:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Host with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating host",
      error: error.message,
    });
  }
});

// Update host
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      contactEmail,
      countryCode,
      phoneNumber,
      address,
      clientHostBillable,
      isActive,
    } = req.body;

    const host = await Host.findById(req.params.id);

    if (!host) {
      return res.status(404).json({
        success: false,
        message: "Host not found",
      });
    }

    // Check if email is being changed and if it conflicts with another host
    if (contactEmail && contactEmail !== host.contactEmail) {
      const existingHost = await Host.findOne({
        contactEmail,
        _id: { $ne: req.params.id },
      });

      if (existingHost) {
        return res.status(400).json({
          success: false,
          message: "Host with this email already exists",
        });
      }
    }

    // Update fields
    if (name !== undefined) host.name = name;
    if (contactPerson !== undefined) host.contactPerson = contactPerson;
    if (contactEmail !== undefined) host.contactEmail = contactEmail;
    if (countryCode !== undefined) host.countryCode = countryCode;
    if (phoneNumber !== undefined) host.phoneNumber = phoneNumber;
    if (address !== undefined) host.address = address;
    if (clientHostBillable !== undefined)
      host.clientHostBillable = clientHostBillable;
    if (isActive !== undefined) host.isActive = isActive;

    await host.save();

    res.json({
      success: true,
      message: "Host updated successfully",
      data: host,
    });
  } catch (error) {
    console.error("Error updating host:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Host with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating host",
      error: error.message,
    });
  }
});

// Delete host
router.delete("/:id", auth, async (req, res) => {
  try {
    const host = await Host.findById(req.params.id);

    if (!host) {
      return res.status(404).json({
        success: false,
        message: "Host not found",
      });
    }

    // Check if host has associated stations
    const Station = require("../models/Station");
    const stationCount = await Station.countDocuments({
      hostId: req.params.id,
    });

    if (stationCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete host. It has ${stationCount} associated station(s). Please delete or reassign the stations first.`,
      });
    }

    await Host.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Host deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting host:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting host",
      error: error.message,
    });
  }
});

module.exports = router;
