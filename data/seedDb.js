const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  User,
  Event,
  EventFeedback,
  EventGallery,
  AccessibilitySetting
} = require('../models');
const { events: initialEvents, registrations: initialRegistrations } = require('./store');

const CATEGORY_META = {
  Workshop: { id: 1, desc: 'Interactive skill-building hands-on sessions' },
  Community: { id: 2, desc: 'Civic, social, and accessible public gatherings' },
  Recreation: { id: 3, desc: 'Inclusive sports, adaptive fitness, and leisure activities' },
  Technical: { id: 4, desc: 'Assistive technology, devices, and digital accessibility labs' }
};

function buildEventDocs() {
  return initialEvents.map(e => {
    const catMeta = CATEGORY_META[e.category] || { id: 5, desc: 'General public events' };

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

    return {
      event_id: e.id,
      id: e.id,
      title: e.title,
      slug,
      description: e.description,
      longDescription: e.longDescription || e.description,
      mode: 'offline',
      start_datetime: new Date(`${e.date}T${e.startTime ? '10:00:00' : '09:00:00'}Z`),
      end_datetime: new Date(`${e.endDate || e.date}T${e.endTime ? '13:00:00' : '17:00:00'}Z`),
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

      date: e.date,
      endDate: e.endDate || e.date,
      time: e.time || e.startTime,
      startTime: e.startTime || e.time,
      endTime: e.endTime || '04:00 PM',

      category_id: catMeta.id,
      category_name: e.category,
      category: e.category,
      category_description: catMeta.desc,
      is_category_active: true,

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

      registrations: eventRegs,
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
}

async function getNextUserId() {
  const highest = await User.findOne().sort({ user_id: -1 }).select('user_id').lean();
  return highest && typeof highest.user_id === 'number' ? highest.user_id + 1 : 1;
}

/**
 * Safely ensures pre-seeded admin credentials and initial portal data exist
 * without overwriting custom admin accounts or user-created records.
 */
async function seedDatabase() {
  try {
    if (mongoose.connection.readyState !== 1) return;

    // 1. Always guarantee pre-seeded admin account exists for Auto Sign In
    const defaultAdmin = await User.findOne({ email: 'admin@servedeserve.org' });
    if (!defaultAdmin) {
      const nextId = await getNextUserId();
      await User.create({
        user_id: nextId,
        full_name: 'Institutional Administrator',
        name: 'Institutional Administrator',
        email: 'admin@servedeserve.org',
        phone: '+91 98765 43210',
        password_hash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        status: 'active',
        created_at: new Date('2026-09-01T00:00:00Z'),
        updated_at: new Date()
      });
      console.log('🌱 Ensured pre-seeded admin account (admin@servedeserve.org) exists.');
    } else if (defaultAdmin.role !== 'admin') {
      defaultAdmin.role = 'admin';
      defaultAdmin.status = 'active';
      await defaultAdmin.save();
    }

    // 2. Seed sample community users if empty
    const userCount = await User.countDocuments();
    if (userCount <= 1) {
      const defaults = [
        {
          full_name: 'Jane Doe',
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          phone: '(555) 123-4567',
          password_hash: bcrypt.hashSync('user123', 10),
          role: 'user',
          status: 'active',
          created_at: new Date('2026-09-10T00:00:00Z')
        },
        {
          full_name: 'Alex Smith',
          name: 'Alex Smith',
          email: 'alex.smith@example.com',
          phone: '(555) 987-6543',
          password_hash: bcrypt.hashSync('user123', 10),
          role: 'user',
          status: 'active',
          created_at: new Date('2026-09-12T00:00:00Z')
        }
      ];
      for (const u of defaults) {
        const exists = await User.findOne({ email: u.email }).lean();
        if (!exists) {
          const nextId = await getNextUserId();
          await User.create({ ...u, user_id: nextId });
        }
      }
    }

    // 3. Seed Events (Combined 2.2 - 2.6) if Events collection is empty
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      const eventDocs = buildEventDocs();
      await Event.insertMany(eventDocs);
      console.log(`🌱 Seeded ${eventDocs.length} initial events into MongoDB.`);
    }

    // 4. Ensure empty Registration_Passes (2.7) collection exists
    const db = mongoose.connection.db;
    const passCols = await db.listCollections({ name: 'Registration_Passes' }).toArray();
    if (passCols.length === 0) {
      await db.createCollection('Registration_Passes');
    }

    // 5. Seed Event_Feedback (2.8) if empty
    if ((await EventFeedback.countDocuments()) === 0) {
      const feedbackDocs = [];
      let fbId = 1;
      initialEvents.forEach(e => {
        (e.feedbackResponses || []).forEach(r => {
          feedbackDocs.push({
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
      });
      if (feedbackDocs.length > 0) await EventFeedback.insertMany(feedbackDocs);
    }

    // 6. Seed Event_Gallery (2.9) if empty
    if ((await EventGallery.countDocuments()) === 0) {
      const galleryDocs = [];
      let gId = 1;
      initialEvents.forEach(e => {
        (e.gallery || []).forEach(g => {
          galleryDocs.push({
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
      });
      if (galleryDocs.length > 0) await EventGallery.insertMany(galleryDocs);
    }

    // 7. Seed Accessibility_Settings (2.10) if empty
    if ((await AccessibilitySetting.countDocuments()) === 0) {
      await AccessibilitySetting.insertMany([
        { setting_id: 1, user_id: 1, font_size_level: 'normal', high_contrast: false, reduce_motion: false, screen_reader_mode: false, language_code: 'en' },
        { setting_id: 2, user_id: 2, font_size_level: 'normal', high_contrast: false, reduce_motion: false, screen_reader_mode: false, language_code: 'en' },
        { setting_id: 3, user_id: 3, font_size_level: 'large', high_contrast: true, reduce_motion: false, screen_reader_mode: false, language_code: 'en' }
      ]);
    }
  } catch (err) {
    console.error('⚠️  Database startup seed check warning:', err.message);
  }
}

module.exports = seedDatabase;
