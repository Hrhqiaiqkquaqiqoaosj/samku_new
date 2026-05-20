const express = require('express');
const { auth } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Charger = require('../models/Charger');
const User = require('../models/User');

const router = express.Router();

/* =====================================================
   GET ALL TRANSACTIONS
===================================================== */
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, status, userId, chargerId } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (userId) filter.userId = userId;
        if (chargerId) filter.chargerId = chargerId;

        // Non-admin users see only their transactions
        if (req.user.role !== 'admin') {
            filter.userId = req.user.id;
        }

        const transactions = await Transaction.find(filter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * limit);

        const total = await Transaction.countDocuments(filter);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
            error: error.message
        });
    }
});


/* =====================================================
   START TEST CHARGING (FIXED)
===================================================== */
router.post('/start-test-charge', auth, async (req, res) => {
    try {
        const { chargerId } = req.body;
        const userId = req.user.id;

        if (!chargerId) {
            return res.status(400).json({
                success: false,
                message: 'Charger ID is required'
            });
        }

      let charger = await Charger.findOne({ serialNumber: chargerId });

      // 🔥 AUTO CREATE IF NOT EXISTS
      if (!charger) {
        charger = await Charger.create({
           serialNumber: chargerId,
           name: `Charger ${chargerId}`,   // ✅ REQUIRED
           capacity: 7.2,                  // ✅ REQUIRED (kW)
           stationId: null,                // ✅ TEMP FIX (or real station ID)
           status: "OFFLINE",              // ✅ MUST MATCH ENUM
           powerType: "AC"
         });
      }

        const user = await User.findById(userId);

        const transaction = new Transaction({
            transactionId: `TEST-${Date.now()}`,
            userId: userId,
            chargerId: charger.serialNumber,
            connectorId: 1,
            idTag: user.email,
            startTime: new Date(),
            meterStart: 0,
            status: 'ACTIVE'
        });

        await transaction.save();

        // Auto complete after 30 sec
        setTimeout(async () => {
            const t = await Transaction.findById(transaction._id);
            if (t && t.status === 'ACTIVE') {
                t.status = 'COMPLETED';
                t.endTime = new Date();
                t.meterStop = 100;
                t.energyConsumed = 100;

                t.payment.status = 'COMPLETED';
                t.pricing.totalAmount = 1;

                await t.save();
            }
        }, 30000);

        res.json({
            success: true,
            message: 'Test charging started',
            data: transaction
        });

    } catch (error) {
        console.error('Error starting test charge:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


/* =====================================================
   START REGULAR CHARGE
===================================================== */
router.post('/start-charge', auth, async (req, res) => {
    try {
        const { chargerId, connectorId = 1 } = req.body;
        const userId = req.user.id;

        if (!chargerId) {
            return res.status(400).json({
                success: false,
                message: 'Charger ID is required'
            });
        }

        const charger = await Charger.findOne({
            $or: [
                { serialNumber: chargerId },
                { _id: chargerId }
            ]
        });

        if (!charger) {
            return res.status(404).json({
                success: false,
                message: 'Charger not found'
            });
        }

        const user = await User.findById(userId);

        const transaction = new Transaction({
            transactionId: `REG-${Date.now()}`,
            userId: userId,
            chargerId: charger.serialNumber,
            connectorId: connectorId,
            idTag: user.email,
            meterStart: 0,
            startTime: new Date(),
            status: 'ACTIVE'
        });

        await transaction.save();

        res.json({
            success: true,
            message: 'Charging started',
            data: transaction
        });

    } catch (error) {
        console.error('Error starting charge:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;