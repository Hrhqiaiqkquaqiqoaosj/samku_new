const mongoose = require('mongoose');
const Charger = require('./models/Charger');
const Station = require('./models/Station');
const Host = require('./models/Host');
require('dotenv').config();

const testChargers = [
  'CH-001',
  'CH-002', 
  'CH-003',
  'CH-004',
  'CH-005'
];

async function createTestChargers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find or create a test host
    let testHost = await Host.findOne({ name: 'Test Host' });
    if (!testHost) {
      testHost = new Host({
        name: 'Test Host',
        contactPerson: 'Test Contact Person',
        contactEmail: 'testhost@example.com',
        countryCode: '+91',
        phoneNumber: '1234567890',
        address: {
          streetLine1: '123 Test Street',
          streetLine2: 'Test Area',
          city: 'Test City',
          state: 'Test State',
          country: 'India',
          postalCode: '12345'
        },
        clientHostBillable: true,
        isActive: true
      });
      await testHost.save();
      console.log('✅ Created test host');
    }

    // Find or create a test station
    let testStation = await Station.findOne({ name: 'Test Station' });
    if (!testStation) {
      testStation = new Station({
        name: 'Test Station',
        ownedBy: 'Test Host Company',
        hostId: testHost._id,
        address: {
          area: 'Test Area',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          coordinates: {
            latitude: 12.9716,
            longitude: 77.5946
          }
        },
        contact: {
          phone: '+91-1234567890',
          email: 'teststation@example.com'
        },
        operatingHours: {
          open: '00:00',
          close: '23:59',
          is24x7: true
        },
        amenities: ['parking', 'restroom', 'wifi'],
        status: 'ACTIVE',
        isVerified: true,
        features: ['covered_parking', 'security', 'lighting'],
        pricing: {
          baseRate: 10,
          currency: 'INR',
          taxIncluded: true
        }
      });
      await testStation.save();
      console.log('✅ Created test station');
    }

    // Create test chargers
    for (const chargerId of testChargers) {
      const existingCharger = await Charger.findOne({ serialNumber: chargerId });
      
      if (!existingCharger) {
        const charger = new Charger({
          serialNumber: chargerId,
          name: `Test Charger ${chargerId}`,
          stationId: testStation._id,
          powerType: 'AC',
          capacity: 22, // 22 kW
          connectorType: 'Type2',
          numberOfConnectors: 1,
          maxPower: 22,
          status: 'OFFLINE',
          isActive: true,
          pricing: {
            ratePerKWh: 10, // 10 rupees per kWh
            currency: 'INR'
          },
          ocppConnection: {
            isConnected: false,
            protocolVersion: '1.6'
          },
          configuration: {
            meterValueSampleInterval: 60,
            heartbeatInterval: 300,
            authorizationCacheEnabled: true,
            localAuthListEnabled: true
          }
        });
        
        await charger.save();
        console.log(`✅ Created test charger: ${chargerId}`);
      } else {
        console.log(`⚠️  Charger ${chargerId} already exists`);
      }
    }

    console.log('\n🎉 Test chargers setup completed!');
    console.log('\n📋 Test Charger IDs:');
    testChargers.forEach(id => console.log(`   - ${id}`));
    
    console.log('\n💡 Next steps:');
    console.log('1. Run the QR code generator: node generate-qr-test.js');
    console.log('2. Use the QR scanner in the user dashboard to test');
    console.log('3. Each scan will create a ₹1 test transaction');
    
  } catch (error) {
    console.error('❌ Error creating test chargers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

// Run the script
if (require.main === module) {
  createTestChargers();
}

module.exports = { createTestChargers, testChargers }; 