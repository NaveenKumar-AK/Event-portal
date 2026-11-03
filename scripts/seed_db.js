require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  User,
  Event,
  RegistrationPass,
  EventFeedback,
  EventGallery,
  AccessibilitySetting
} = require('../models');
const { events: initialEvents, registrations: initialRegistrations } = require('../data/store');

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment.');
    process.exit(1);
  }

  console.log('🍃 Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log(`Connected to database: ${mongoose.connection.name}`);

  const db = mongoose.connection.db;

  // Clean up legacy collections if they exist
  const existingCols = (await db.listCollections().toArray()).map(c => c.name);
  console.log('Existing collections before seed:', existingCols);

  for (const oldCol of ['adminusers', 'registrations']) {
    if (existingCols.includes(oldCol)) {
      console.log(`Dropping legacy collection: ${oldCol}`);
      await db.collection(oldCol).drop();
    }
  }

  // ─── 1. Seed Users (2.1) ───
  console.log('\n--- Seeding Users (2.1) ---');
  await User.deleteMany({});
  const usersToInsert = [
    {
      user_id: 1,
      full_name: 'Institutional Administrator',
      name: 'Institutional Administrator',
      email: 'admin@servedeserve.org',
      phone: '+91 98765 43210',
      password_hash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      status: 'active',
      created_at: new Date('2026-09-01T00:00:00Z'),
      updated_at: new Date()
    },
    {
      user_id: 2,
      full_name: 'Jane Doe',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '(555) 123-4567',
      password_hash: bcrypt.hashSync('user123', 10),
      role: 'user',
      status: 'active',
      created_at: new Date('2026-09-10T00:00:00Z'),
      updated_at: new Date()
    },
    {
      user_id: 3,
      full_name: 'Alex Smith',
      name: 'Alex Smith',
      email: 'alex.smith@example.com',
      phone: '(555) 987-6543',
      password_hash: bcrypt.hashSync('user123', 10),
      role: 'user',
      status: 'active',
      created_at: new Date('2026-09-12T00:00:00Z'),
      updated_at: new Date()
    }
  ];
  await User.insertMany(usersToInsert);
  console.log(`✓ Inserted ${usersToInsert.length} users into Users collection.`);

  // ─── 2. Seed Events (Combined 2.2 - 2.6) ───
  console.log('\n--- Seeding Events (Combined 2.2 - 2.6) ---');
  await Event.deleteMany({});

  const categoryMap = {
    'Workshop': { id: 1, desc: 'Interactive skill-building hands-on sessions' },
    'Community': { id: 2, desc: 'Civic, social, and accessible public gatherings' },
    'Recreation': { id: 3, desc: 'Inclusive sports, adaptive fitness, and leisure activities' },
    'Technical': { id: 4, desc: 'Assistive technology, devices, and digital accessibility labs' }
  };

  const eventsToInsert = initialEvents.map(e => {
    // 2.2 Category info
    const catMeta = categoryMap[e.category] || { id: 5, desc: 'General public events' };

    // 2.6 Registrations for this event
    const eventRegs = initialRegistrations
      .filter(r => String(r.eventId) === String(e.id))
      .map((r, idx) => {
        const uId = r.email === 'jane.doe@example.com' ? 2 : (r.email === 'alex.smith@example.com' ? 3 : 4);
        return {
          registration_id: idx + 1,
          id: r.id,
          event_id: e.id,
          user_id: uId,
          registration_no: r.referenceId,
          referenceId: r.referenceId,
          full_name: r.fullName,
          fullName: r.fullName,
          firstName: r.fullName.split(' ')[0],
          lastName: r.fullName.split(' ').slice(1).join(' '),
          email: r.email,
          phone: r.phone,
          department: r.department,
          organization: r.department,
          status: (r.status || 'Confirmed').toLowerCase(),
          registered_at: r.registeredAt ? new Date(r.registeredAt) : new Date(),
          registeredAt: r.registeredAt || new Date().toISOString()
        };
      });

    const slug = e.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const startDateTime = new Date(`${e.date}T${e.startTime ? '10:00:00' : '09:00:00'}Z`);
    const endDateTime = new Date(`${e.endDate || e.date}T${e.endTime ? '13:00:00' : '17:00:00'}Z`);

    return {
      // 2.5 Events
      event_id: e.id,
      id: e.id,
      title: e.title,
      slug,
      description: e.description,
      longDescription: e.longDescription || e.description,
      mode: 'offline',
      start_datetime: startDateTime,
      end_datetime: endDateTime,
      registration_deadline: new Date(`${e.date}T23:59:59Z`),
      capacity: e.capacity || 50,
      remainingPlaces: e.remainingPlaces !== undefined ? e.remainingPlaces : 25,
      registeredCount: eventRegs.length,
      banner_image_url: e.image,
      image: e.image,
      alt: e.alt || e.title,
      status: e.status || 'published',
      isFeatured: Boolean(e.isFeatured),
      isFree: Boolean(e.isFree !== false),
      accessibilityFeatures: e.accessibilityFeatures || ['Step-free entrance', 'Accessible parking', 'Hearing loop'],
      created_by: 1,

      // App compatibility
      date: e.date,
      endDate: e.endDate || e.date,
      time: e.time || e.startTime,
      startTime: e.startTime || e.time,
      endTime: e.endTime || '04:00 PM',

      // 2.2 Event_Categories
      category_id: catMeta.id,
      category_name: e.category,
      category: e.category,
      category_description: catMeta.desc,
      is_category_active: true,

      // 2.3 Event_Hosts
      host_id: 1,
      host_name: typeof e.host === 'object' ? (e.host.name || 'Community Support Team') : (e.host || 'Community Support Team'),
      host: e.host,
      hostDetails: e.hostDetails || {
        name: typeof e.host === 'object' ? e.host.name : e.host,
        email: 'events@servedeserve.org',
        phone: '(555) 014-2025'
      },
      contact_person: 'Events Coordinator',
      contact_email: 'events@servedeserve.org',
      contact_phone: '(555) 014-2025',
      host_description: 'Institutional community support facilitators.',

      // 2.4 Host_Locations
      location_id: e.id,
      location_name: e.venue || e.location || 'Civic Hall',
      venue: e.venue || e.location,
      location: e.location || e.venue,
      address_line: e.address || `${e.location}, ${e.city || 'Chennai'}`,
      address: e.address || `${e.location}, ${e.city || 'Chennai'}`,
      city: e.city || 'Chennai',
      state: e.state || 'Tamil Nadu',
      district: e.district || e.city || 'Chennai',
      postal_code: '600025',
      country: 'India',
      latitude: e.coordinates?.lat || 13.0827,
      longitude: e.coordinates?.lng || 80.2707,
      coordinates: e.coordinates || { lat: 13.0827, lng: 80.2707 },

      // 2.6 Event_Registrations (Embedded)
      registrations: eventRegs,

      // Gallery & Feedback embedded
      gallery: e.gallery || [],
      feedbackActive: Boolean(e.feedbackActive),
      feedbackQuestions: e.feedbackQuestions || [],
      feedbackResponses: e.feedbackResponses || [],
      liveTracking: e.liveTracking || {
        enabled: false,
        hostName: typeof e.host === 'object' ? (e.host.name || 'Presiding Host') : (e.host || 'Presiding Host'),
        currentLocation: e.coordinates || { lat: 13.0827, lng: 80.2707 },
        status: 'Not Started',
        eta: '--',
        distanceKm: 0,
        speedKmh: 0,
        updatedAt: new Date()
      }
    };
  });

  await Event.insertMany(eventsToInsert);
  console.log(`✓ Inserted ${eventsToInsert.length} combined events into Events collection.`);

  // ─── 3. Create Registration_Passes (2.7) ───
  // Prompt instruction: "for 2.7 just create that table, no need to add values there"
  console.log('\n--- Creating Registration_Passes (2.7) [Empty Table] ---');
  try {
    const existing = await db.listCollections({ name: 'Registration_Passes' }).toArray();
    if (existing.length === 0) {
      await db.createCollection('Registration_Passes');
    } else {
      await db.collection('Registration_Passes').deleteMany({});
    }
    console.log('✓ Registration_Passes collection created (empty, 0 documents) as requested.');
  } catch (err) {
    console.log('Notice regarding Registration_Passes:', err.message);
  }

  // ─── 4. Seed Event_Feedback (2.8) ───
  console.log('\n--- Seeding Event_Feedback (2.8) ---');
  await EventFeedback.deleteMany({});
  const feedbackToInsert = [];
  let fbId = 1;
  initialEvents.forEach(e => {
    if (e.feedbackResponses && e.feedbackResponses.length > 0) {
      e.feedbackResponses.forEach(r => {
        feedbackToInsert.push({
          feedback_id: fbId++,
          registration_id: 3,
          event_id: e.id,
          user_name: r.userName,
          user_email: r.userEmail,
          rating: r.rating || 5,
          comments: r.answers?.q4 || 'Great experience and helpful staff.',
          answers: r.answers,
          is_visible: true,
          submitted_at: r.submittedAt ? new Date(r.submittedAt) : new Date()
        });
      });
    }
  });

  if (feedbackToInsert.length > 0) {
    await EventFeedback.insertMany(feedbackToInsert);
    console.log(`✓ Inserted ${feedbackToInsert.length} feedback records into Event_Feedback collection.`);
  }

  // ─── 5. Seed Event_Gallery (2.9) ───
  console.log('\n--- Seeding Event_Gallery (2.9) ---');
  await EventGallery.deleteMany({});
  const galleryToInsert = [];
  let gId = 1;
  initialEvents.forEach(e => {
    if (e.gallery && e.gallery.length > 0) {
      e.gallery.forEach(g => {
        galleryToInsert.push({
          gallery_id: gId++,
          event_id: e.id,
          uploaded_by: 1,
          media_type: 'image',
          file_url: g.url,
          caption: g.caption,
          alt_text: g.alt || g.caption,
          is_published: true,
          uploaded_at: new Date('2026-10-16T12:00:00Z')
        });
      });
    }
  });

  if (galleryToInsert.length > 0) {
    await EventGallery.insertMany(galleryToInsert);
    console.log(`✓ Inserted ${galleryToInsert.length} gallery records into Event_Gallery collection.`);
  }

  // ─── 6. Seed Accessibility_Settings (2.10) ───
  console.log('\n--- Seeding Accessibility_Settings (2.10) ---');
  await AccessibilitySetting.deleteMany({});
  const a11yToInsert = [
    {
      setting_id: 1,
      user_id: 1,
      font_size_level: 'normal',
      high_contrast: false,
      reduce_motion: false,
      screen_reader_mode: false,
      language_code: 'en',
      updated_at: new Date()
    },
    {
      setting_id: 2,
      user_id: 2,
      font_size_level: 'normal',
      high_contrast: false,
      reduce_motion: false,
      screen_reader_mode: false,
      language_code: 'en',
      updated_at: new Date()
    },
    {
      setting_id: 3,
      user_id: 3,
      font_size_level: 'large',
      high_contrast: true,
      reduce_motion: false,
      screen_reader_mode: false,
      language_code: 'en',
      updated_at: new Date()
    }
  ];
  await AccessibilitySetting.insertMany(a11yToInsert);
  console.log(`✓ Inserted ${a11yToInsert.length} settings into Accessibility_Settings collection.`);

  // ─── Verify All Collections in Compass ───
  console.log('\n========================================');
  console.log('   MONGODB COMPASS REFLECTION SUMMARY   ');
  console.log('========================================');
  const finalCols = await db.listCollections().toArray();
  for (const c of finalCols) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`📦 Collection: "${c.name}" -> ${count} document(s)`);
  }
  console.log('========================================\n');

  await mongoose.disconnect();
  console.log('Database seeded and disconnected successfully!');
}

seedDatabase().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});

