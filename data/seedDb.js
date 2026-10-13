const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AdminUser = require('../models/AdminUser');
const { events: initialEvents, registrations: initialRegistrations, adminUser: initialAdmin } = require('./store');

async function seedDatabase() {
  try {
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      console.log('🌱 Seeding initial events into MongoDB...');
      await Event.insertMany(initialEvents);
      console.log(`✅ Seeded ${initialEvents.length} events into MongoDB.`);
    }

    const regCount = await Registration.countDocuments();
    if (regCount === 0) {
      console.log('🌱 Seeding initial registrations into MongoDB...');
      await Registration.insertMany(initialRegistrations);
      console.log(`✅ Seeded ${initialRegistrations.length} registrations into MongoDB.`);
    }

    const adminExists = await AdminUser.findOne({ email: initialAdmin.email });
    if (!adminExists) {
      console.log('🌱 Seeding default admin user into MongoDB...');
      await AdminUser.create(initialAdmin);
      console.log('✅ Seeded default admin user into MongoDB.');
    }
  } catch (err) {
    console.error('⚠️  Database seeding error:', err.message);
  }
}

module.exports = seedDatabase;
