require('dotenv').config();
const mongoose = require('mongoose');
const {
  User,
  Event,
  RegistrationPass,
  EventFeedback,
  EventGallery,
  AccessibilitySetting
} = require('../models');

async function verify() {
  console.log('Testing MongoDB connection and collections...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB Atlas successfully.');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const colNames = collections.map(c => c.name).sort();
  console.log('\n--- Active Collections in Compass ---');
  colNames.forEach(name => console.log(' • ' + name));

  const expectedCollections = [
    'Accessibility_Settings',
    'Event_Feedback',
    'Event_Gallery',
    'Events',
    'Registration_Passes',
    'Users'
  ];

  console.log('\n--- Document Counts in Compass ---');
  for (const name of expectedCollections) {
    const count = await db.collection(name).countDocuments();
    console.log(` 📦 ${name}: ${count} document(s)`);
  }

  // Check Registration_Passes is 0
  const passesCount = await db.collection('Registration_Passes').countDocuments();
  if (passesCount === 0) {
    console.log('✓ Registration_Passes verified: Created and empty (0 records) as requested.');
  } else {
    console.warn('⚠️ Registration_Passes has records:', passesCount);
  }

  // Check Combined Events (2.2 - 2.6)
  const sampleEvent = await Event.findOne({ id: 1 }).lean();
  console.log('\n--- Verifying Combined 2.2 - 2.6 Table Schema ---');
  console.log(' • Event Title (2.5):', sampleEvent.title);
  console.log(' • Category (2.2):', sampleEvent.category_name, `(id: ${sampleEvent.category_id})`);
  console.log(' • Host (2.3):', sampleEvent.host_name, `(id: ${sampleEvent.host_id})`);
  console.log(' • Location (2.4):', sampleEvent.location_name, `(city: ${sampleEvent.city}, district: ${sampleEvent.district})`);
  console.log(' • Embedded Registrations (2.6):', sampleEvent.registrations ? sampleEvent.registrations.length : 0, 'registration(s)');

  // Check Users Table (2.1)
  const adminUser = await User.findOne({ role: 'admin' });
  console.log('\n--- Verifying Users Table (2.1) ---');
  console.log(' • Admin User:', adminUser.full_name, `(${adminUser.email})`);
  const isMatch = adminUser.comparePassword('admin123');
  console.log(' • Password verification test (admin123):', isMatch ? 'PASSED' : 'FAILED');

  // Check Event_Feedback Table (2.8)
  const fbCount = await EventFeedback.countDocuments();
  console.log('\n--- Verifying Event_Feedback Table (2.8) ---');
  console.log(` • Document count: ${fbCount}`);

  // Check Event_Gallery Table (2.9)
  const galleryCount = await EventGallery.countDocuments();
  console.log('\n--- Verifying Event_Gallery Table (2.9) ---');
  console.log(` • Document count: ${galleryCount}`);

  // Check Accessibility_Settings Table (2.10)
  const a11yCount = await AccessibilitySetting.countDocuments();
  console.log('\n--- Verifying Accessibility_Settings Table (2.10) ---');
  console.log(` • Document count: ${a11yCount}`);

  await mongoose.disconnect();
  console.log('\nAll checks completed successfully!');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

