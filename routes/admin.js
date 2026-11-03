const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { User, Event, EventGallery, EventFeedback } = require('../models');
const { calculateDistanceKm, calculateETA } = require('../data/store');

function getEventQuery(idParam) {
  const num = Number(idParam);
  const conditions = [];
  if (!isNaN(num)) {
    conditions.push({ id: num }, { event_id: num });
  }
  if (typeof idParam === 'string' && mongoose.isValidObjectId(idParam)) {
    conditions.push({ _id: idParam });
  }
  return conditions.length > 1 ? { $or: conditions } : (conditions[0] || { id: -1 });
}

// In-memory set for active admin session tokens
const adminSessions = new Set();

// Helper to save base64 image data from client device into public/uploads
function saveBase64Image(dataString, prefix = 'upload') {
  if (!dataString || typeof dataString !== 'string') return dataString;
  const match = dataString.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!match) return dataString; // Return as-is if already a valid URL or path

  const rawExt = match[1].toLowerCase();
  const ext = (rawExt === 'jpeg' || rawExt === 'jpg') ? 'jpg' : (rawExt === 'png' ? 'png' : (rawExt === 'webp' ? 'webp' : 'jpg'));
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${filename}`;
}

router.saveBase64Image = saveBase64Image;

// GET /api/admin/setup-status — checks if first-time administrator password setup is available
router.get('/setup-status', async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    const isSetupNeeded = !admin || !admin.password_hash;
    res.json({
      success: true,
      isSetupNeeded,
      email: admin ? admin.email : 'admin@servedeserve.org'
    });
  } catch (err) {
    console.error('Error checking setup status:', err);
    res.json({ success: true, isSetupNeeded: false, email: 'admin@servedeserve.org' });
  }
});

// POST /api/admin/setup — set administrator credentials on first-time setup
router.post('/setup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both administrator email and a secure password.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const hash = bcrypt.hashSync(password, 10);
    let admin = await User.findOne({ role: 'admin' });

    if (admin) {
      admin.email = cleanEmail;
      admin.password_hash = hash;
      if (name) admin.full_name = name.trim();
      admin.status = 'active';
      admin.updated_at = new Date();
      await admin.save();
    } else {
      admin = await User.create({
        user_id: 'USR-' + Date.now(),
        full_name: (name || 'Institutional Administrator').trim(),
        email: cleanEmail,
        password_hash: hash,
        role: 'admin',
        status: 'active'
      });
    }

    const token = 'adm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    adminSessions.add(token);

    res.json({
      success: true,
      message: 'Administrator password successfully set with BCrypt.',
      token,
      user: { name: admin.full_name, email: admin.email, role: 'admin' }
    });
  } catch (err) {
    console.error('Error during setup:', err);
    res.status(500).json({ success: false, message: 'Server error during setup' });
  }
});

// POST /api/admin/login — BCrypt password verification using MongoDB Users collection
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail, role: 'admin' });

    if (user && user.password_hash) {
      const isMatch = bcrypt.compareSync(password, user.password_hash);
      if (isMatch) {
        const token = 'adm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
        adminSessions.add(token);
        return res.json({
          success: true,
          token,
          user: { name: user.full_name, email: user.email, role: 'admin' }
        });
      }
    }

    res.status(401).json({ success: false, message: 'Invalid email or password. Access denied.' });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token) adminSessions.delete(token);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Middleware: block regular users and unauthenticated requests from calling administrative endpoints
router.use((req, res, next) => {
  let token = req.headers['x-admin-token'];
  if (!token && req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ');
    token = parts.length === 2 ? parts[1] : parts[0];
  }
  const role = req.headers['x-role'];
  if (role === 'user' || !token || !adminSessions.has(token)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Valid password authentication required for administrative actions.'
    });
  }
  next();
});

// GET /api/admin/stats — dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const events = await Event.find().lean();
    const totalEvents = events.length;
    let totalRegistrations = 0;
    let totalCapacity = 0;
    let totalRegistered = 0;
    let activeEvents = 0;

    events.forEach(e => {
      if (e.status === 'upcoming' || e.status === 'published') activeEvents++;
      const regCount = (e.registrations || []).length;
      totalRegistrations += regCount;
      totalCapacity += (e.capacity || 0);
      totalRegistered += (e.registeredCount || regCount || 0);
    });

    res.json({
      success: true,
      stats: {
        totalEvents,
        activeEvents,
        totalRegistrations,
        totalCapacity,
        totalRegistered,
        fillRate: totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
});

// GET /api/admin/events — admin event list with registration counts
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ id: 1 }).lean();
    const enriched = events.map(e => {
      const regCount = (e.registrations || []).length;
      return {
        ...e,
        venue: e.location || e.venue || 'Civic Hall',
        time: e.startTime || e.time || '10:00 AM',
        registeredCount: regCount,
        registrationCount: regCount
      };
    });
    res.json({ success: true, events: enriched });
  } catch (err) {
    console.error('Error fetching admin events:', err);
    res.status(500).json({ success: false, message: 'Server error fetching events' });
  }
});

// POST /api/admin/upload — upload image from admin device
router.post('/upload', (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }
    const savedUrl = saveBase64Image(image, 'img');
    res.json({ success: true, url: savedUrl, message: 'Image uploaded from device successfully' });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

// POST /api/admin/events — create a new event with location mapping
router.post('/events', async (req, res) => {
  try {
    const hostObj = typeof req.body.host === 'object' ? req.body.host : { name: req.body.host || 'Community Support Team' };
    const hostName = hostObj.name || (typeof req.body.host === 'string' ? req.body.host : 'Community Support Team');

    const venueName = req.body.venue || req.body.location || 'Civic Hall';
    const cityName = req.body.city || '';
    const stateName = req.body.state || 'Tamil Nadu';
    const districtName = req.body.district || cityName || 'Chennai';
    const addressText = req.body.address || (cityName ? `${venueName}, ${cityName}, ${stateName}` : venueName);
    const coords = (req.body.coordinates && req.body.coordinates.lat)
      ? req.body.coordinates
      : (req.body.lat && req.body.lng ? { lat: Number(req.body.lat), lng: Number(req.body.lng) } : { lat: 13.0827, lng: 80.2707 });

    let coverImage = req.body.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80';
    if (coverImage && coverImage.startsWith('data:image/')) {
      coverImage = saveBase64Image(coverImage, 'event-cover');
    }

    const count = await Event.countDocuments();
    const highest = await Event.findOne().sort({ id: -1 }).select('id').lean();
    const nextId = highest && highest.id ? highest.id + 1 : count + 1;

    const slugBase = (req.body.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${nextId}`;

    const newEvent = new Event({
      event_id: nextId,
      id: nextId,
      title: req.body.title || 'Untitled Community Event',
      slug,
      description: req.body.description || 'Accessible community event organized for inclusive participation.',
      longDescription: req.body.longDescription || req.body.description || '',
      mode: req.body.mode || 'offline',
      capacity: Number(req.body.capacity) || 30,
      remainingPlaces: Number(req.body.capacity) || 30,
      registeredCount: 0,
      banner_image_url: coverImage,
      image: coverImage,
      alt: req.body.title || 'Community event',
      status: req.body.status || 'upcoming',
      isFeatured: Boolean(req.body.isFeatured),
      isFree: req.body.isFree !== undefined ? Boolean(req.body.isFree) : true,
      accessibilityFeatures: Array.isArray(req.body.accessibilityFeatures) ? req.body.accessibilityFeatures : ['Step-free entrance', 'Accessible seating'],
      created_by: 1,

      date: req.body.date || new Date().toISOString().split('T')[0],
      endDate: req.body.endDate || req.body.date || new Date().toISOString().split('T')[0],
      time: req.body.time || req.body.startTime || '10:00 AM',
      startTime: req.body.startTime || req.body.time || '10:00 AM',
      endTime: req.body.endTime || '1:00 PM',

      // 2.2 Category
      category_id: 1,
      category_name: req.body.category || 'Workshop',
      category: req.body.category || 'Workshop',
      is_category_active: true,

      // 2.3 Host
      host_id: 1,
      host_name: hostName,
      host: hostName,
      hostDetails: hostObj,
      contact_person: hostName,

      // 2.4 Location
      location_id: 1,
      location_name: venueName,
      venue: venueName,
      location: venueName,
      address_line: addressText,
      address: addressText,
      city: cityName,
      district: districtName,
      state: stateName,
      country: 'India',
      latitude: coords.lat,
      longitude: coords.lng,
      coordinates: coords,

      // 2.6 Registrations
      registrations: [],

      // Feedback & Gallery
      gallery: [],
      feedbackActive: false,
      feedbackQuestions: [
        { id: 'q1', text: 'How would you rate your overall experience with this event?', type: 'rating' },
        { id: 'q2', text: 'Were the venue accessibility accommodations helpful and easy to use?', type: 'choice', options: ['Extremely helpful', 'Satisfactory', 'Needs improvements'] },
        { id: 'q3', text: 'What suggestions do you have for future events or sessions?', type: 'text' }
      ],
      feedbackResponses: []
    });

    await newEvent.save();
    res.status(201).json({ success: true, event: newEvent });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ success: false, message: 'Server error creating event' });
  }
});

// PUT /api/admin/events/:id/status — update event status
router.put('/events/:id/status', async (req, res) => {
  try {
    const event = await Event.findOne(getEventQuery(req.params.id));
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    event.status = req.body.status;
    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    console.error('Error updating event status:', err);
    res.status(500).json({ success: false, message: 'Server error updating event status' });
  }
});

// DELETE /api/admin/events/:id — delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const deleted = await Event.findOneAndDelete(getEventQuery(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Event not found' });
    // Also clean up any associated gallery records in Event_Gallery
    try {
      await EventGallery.deleteMany({ event_id: deleted.id || deleted.event_id });
    } catch (gErr) {
      console.warn('Note: EventGallery cleanup:', gErr.message);
    }
    res.json({ success: true, message: 'Event deleted', event: deleted });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ success: false, message: 'Server error deleting event' });
  }
});

// GET /api/admin/registrations — all registrations for admin
router.get('/registrations', async (req, res) => {
  try {
    const { eventId, status } = req.query;
    const events = await Event.find().lean();
    let result = [];

    events.forEach(event => {
      (event.registrations || []).forEach(r => {
        const name = r.fullName || r.full_name || `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Attendee';
        const parts = name.split(' ');
        result.push({
          ...r,
          fullName: name,
          firstName: r.firstName || parts[0] || name,
          lastName: r.lastName || parts.slice(1).join(' ') || '',
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location || event.venue
        });
      });
    });

    if (eventId && eventId !== 'all') {
      result = result.filter(r => String(r.eventId || r.event_id) === String(eventId));
    }
    if (status && status !== 'all') {
      result = result.filter(r => (r.status || '').toLowerCase() === status.toLowerCase());
    }

    result.sort((a, b) => new Date(b.registeredAt || b.registered_at || 0) - new Date(a.registeredAt || a.registered_at || 0));

    res.json({ success: true, count: result.length, registrations: result });
  } catch (err) {
    console.error('Error fetching admin registrations:', err);
    res.status(500).json({ success: false, message: 'Server error fetching registrations' });
  }
});

// PUT /api/admin/registrations/:id/status — update registration status
router.put('/registrations/:id/status', async (req, res) => {
  try {
    const regId = req.params.id;
    const event = await Event.findOne({
      $or: [
        { "registrations.id": regId },
        { "registrations.referenceId": regId },
        { "registrations.registration_id": Number(regId) || 0 }
      ]
    });

    if (!event) return res.status(404).json({ success: false, message: 'Registration not found' });

    const reg = (event.registrations || []).find(r =>
      String(r.id) === String(regId) ||
      String(r.referenceId) === String(regId) ||
      String(r.registration_id) === String(regId)
    );

    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });

    reg.status = req.body.status;
    await event.save();

    res.json({ success: true, registration: reg });
  } catch (err) {
    console.error('Error updating registration status:', err);
    res.status(500).json({ success: false, message: 'Server error updating registration status' });
  }
});

// PUT /api/admin/events/:id — update event details
router.put('/events/:id', async (req, res) => {
  try {
    const event = await Event.findOne(getEventQuery(req.params.id));
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    Object.assign(event, req.body);
    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ success: false, message: 'Server error updating event' });
  }
});

// POST /api/admin/events/:id/gallery — add photo to event gallery (supports device uploads or URLs)
router.post('/events/:id/gallery', async (req, res) => {
  try {
    const event = await Event.findOne(getEventQuery(req.params.id));
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.gallery) event.gallery = [];

    let photoUrl = req.body.url || req.body.image;
    if (!photoUrl) {
      return res.status(400).json({ success: false, message: 'Photo image or URL is required' });
    }

    if (photoUrl.startsWith('data:image/')) {
      photoUrl = saveBase64Image(photoUrl, `ev${event.id}-photo`);
    }

    const photo = {
      id: 'g-' + Date.now(),
      url: photoUrl,
      caption: req.body.caption || event.title,
      alt: req.body.alt || req.body.caption || event.title
    };
    event.gallery.push(photo);
    await event.save();

    // Also insert record into Event_Gallery collection (Table 2.9)
    try {
      await EventGallery.create({
        gallery_id: Date.now(),
        event_id: event.id || event.event_id,
        uploaded_by: 1,
        media_type: 'image',
        file_url: photoUrl,
        caption: photo.caption,
        alt_text: photo.alt,
        is_published: true,
        uploaded_at: new Date()
      });
    } catch (gErr) {
      console.warn('Note: EventGallery record creation:', gErr.message);
    }

    res.status(201).json({ success: true, photo, gallery: event.gallery, message: 'Photo uploaded to gallery successfully' });
  } catch (err) {
    console.error('Error uploading gallery photo:', err);
    res.status(500).json({ success: false, message: 'Server error uploading photo' });
  }
});

// DELETE /api/admin/events/:id/gallery/:photoId — delete photo
router.delete('/events/:id/gallery/:photoId', async (req, res) => {
  try {
    const event = await Event.findOne(getEventQuery(req.params.id));
    if (!event || !event.gallery) return res.status(404).json({ success: false, message: 'Photo or event not found' });

    const photoIndex = event.gallery.findIndex(p => String(p.id) === String(req.params.photoId));
    if (photoIndex === -1) return res.status(404).json({ success: false, message: 'Photo not found' });

    const deleted = event.gallery.splice(photoIndex, 1)[0];
    await event.save();

    // Also delete from Event_Gallery collection
    try {
      await EventGallery.deleteOne({
        $or: [
          { file_url: deleted.url },
          { caption: deleted.caption, event_id: event.id || event.event_id }
        ]
      });
    } catch (gErr) {
      console.warn('Note: EventGallery cleanup:', gErr.message);
    }

    res.json({ success: true, message: 'Photo deleted', photo: deleted, gallery: event.gallery });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ success: false, message: 'Server error deleting photo' });
  }
});

// POST /api/admin/events/:id/feedback/toggle — toggle feedback active state
router.post('/events/:id/feedback/toggle', async (req, res) => {
  try {
    const event = await Event.findOne(getEventQuery(req.params.id));
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.feedbackActive = typeof req.body.active === 'boolean' ? req.body.active : !event.feedbackActive;
    await event.save();
    res.json({ success: true, feedbackActive: event.feedbackActive });
  } catch (err) {
    console.error('Error toggling feedback:', err);
    res.status(500).json({ success: false, message: 'Server error toggling feedback' });
  }
});

// POST /api/admin/events/:id/feedback/questions — add or update feedback questions
router.post('/events/:id/feedback/questions', async (req, res) => {
  try {
    const event = await Event.findOne(getEventQuery(req.params.id));
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (Array.isArray(req.body.questions)) {
      event.feedbackQuestions = req.body.questions;
    } else if (req.body.question) {
      if (!event.feedbackQuestions) event.feedbackQuestions = [];
      const newQ = {
        id: 'q-' + Date.now(),
        text: req.body.question.text,
        type: req.body.question.type || 'rating',
        options: req.body.question.options || []
      };
      event.feedbackQuestions.push(newQ);
    }
    await event.save();
    res.json({ success: true, questions: event.feedbackQuestions });
  } catch (err) {
    console.error('Error updating feedback questions:', err);
    res.status(500).json({ success: false, message: 'Server error updating feedback questions' });
  }
});

// GET /api/admin/events/:id/feedback — get questions and responses
router.get('/events/:id/feedback', async (req, res) => {
  try {
    const event = await Event.findOne(getEventQuery(req.params.id)).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({
      success: true,
      feedbackActive: Boolean(event.feedbackActive),
      questions: event.feedbackQuestions || [],
      responses: event.feedbackResponses || []
    });
  } catch (err) {
    console.error('Error fetching admin feedback:', err);
    res.status(500).json({ success: false, message: 'Server error fetching feedback' });
  }
});

// GET /api/admin/locations — all locations
router.get('/locations', async (req, res) => {
  try {
    const events = await Event.find().lean();
    const locMap = new Map();
    events.forEach(e => {
      const name = e.venue || e.location || 'Civic Hall';
      if (!locMap.has(name)) {
        locMap.set(name, {
          id: locMap.size + 1,
          name,
          address: e.address || `${name}, ${e.city || 'Chennai'}`,
          eventsCount: 1
        });
      } else {
        locMap.get(name).eventsCount++;
      }
    });
    res.json({ success: true, locations: Array.from(locMap.values()) });
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ success: false, message: 'Server error fetching locations' });
  }
});

// PUT /api/admin/events/:id/host-tracking — toggle live host tracking
router.put('/events/:id/host-tracking', async (req, res) => {
  try {
    const event = await Event.findOne(getEventQuery(req.params.id));
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const hostName = req.body.hostName || (typeof event.host === 'object' ? event.host.name : event.host) || 'Presiding Host';
    const venueCoords = event.coordinates || { lat: 13.0827, lng: 80.2707 };

    if (!event.liveTracking) {
      const startLat = venueCoords.lat + 0.035;
      const startLng = venueCoords.lng - 0.030;
      event.liveTracking = {
        enabled: false,
        hostName,
        token: 'ht_' + event.id + '_' + Math.random().toString(36).substring(2, 8),
        currentLocation: { lat: startLat, lng: startLng },
        startLocation: { lat: startLat, lng: startLng },
        status: 'Not Started',
        eta: '--',
        distanceKm: calculateDistanceKm(startLat, startLng, venueCoords.lat, venueCoords.lng),
        speedKmh: 0,
        updatedAt: new Date()
      };
    }

    if (typeof req.body.enabled === 'boolean') {
      event.liveTracking.enabled = req.body.enabled;
      if (event.liveTracking.enabled && event.liveTracking.status === 'Not Started') {
        event.liveTracking.status = 'En Route';
        event.liveTracking.speedKmh = 28;
        event.liveTracking.eta = calculateETA(event.liveTracking.distanceKm, 28);
      }
    }
    if (req.body.hostName) event.liveTracking.hostName = req.body.hostName;
    if (req.body.status) event.liveTracking.status = req.body.status;
    if (req.body.reset) {
      const startLat = venueCoords.lat + 0.035;
      const startLng = venueCoords.lng - 0.030;
      event.liveTracking.currentLocation = { lat: startLat, lng: startLng };
      event.liveTracking.startLocation = { lat: startLat, lng: startLng };
      event.liveTracking.distanceKm = calculateDistanceKm(startLat, startLng, venueCoords.lat, venueCoords.lng);
      event.liveTracking.status = 'En Route';
      event.liveTracking.speedKmh = 28;
      event.liveTracking.eta = calculateETA(event.liveTracking.distanceKm, 28);
      event.liveTracking.updatedAt = new Date();
    }

    await event.save();

    res.json({
      success: true,
      message: `Host live tracking ${event.liveTracking.enabled ? 'enabled' : 'disabled'}`,
      liveTracking: event.liveTracking
    });
  } catch (err) {
    console.error('Error updating live tracking:', err);
    res.status(500).json({ success: false, message: 'Server error updating tracking' });
  }
});

// POST /api/admin/events/:id/host-tracking/simulate-step — simulate host moving towards venue
router.post('/events/:id/host-tracking/simulate-step', async (req, res) => {
  try {
    const event = await Event.findOne(getEventQuery(req.params.id));
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const venueCoords = event.coordinates || { lat: 13.0827, lng: 80.2707 };
    if (!event.liveTracking) {
      const startLat = venueCoords.lat + 0.035;
      const startLng = venueCoords.lng - 0.030;
      event.liveTracking = {
        enabled: true,
        hostName: typeof event.host === 'object' ? event.host.name : event.host,
        token: 'ht_' + event.id,
        currentLocation: { lat: startLat, lng: startLng },
        startLocation: { lat: startLat, lng: startLng },
        status: 'En Route',
        eta: '14 mins',
        distanceKm: calculateDistanceKm(startLat, startLng, venueCoords.lat, venueCoords.lng),
        speedKmh: 30,
        updatedAt: new Date()
      };
    }

    if (req.body.arrived) {
      event.liveTracking.currentLocation = { lat: venueCoords.lat, lng: venueCoords.lng };
      event.liveTracking.distanceKm = 0;
      event.liveTracking.status = 'Arrived at Venue';
      event.liveTracking.speedKmh = 0;
      event.liveTracking.eta = 'Arrived';
      event.liveTracking.updatedAt = new Date();
      await event.save();
      return res.json({ success: true, message: 'Host marked as arrived', liveTracking: event.liveTracking });
    }

    const current = event.liveTracking.currentLocation;
    const stepRatio = Number(req.body.stepRatio) || 0.25;
    const newLat = current.lat + (venueCoords.lat - current.lat) * stepRatio;
    const newLng = current.lng + (venueCoords.lng - current.lng) * stepRatio;

    const dist = calculateDistanceKm(newLat, newLng, venueCoords.lat, venueCoords.lng);
    let status = 'En Route';
    if (dist <= 0.08) {
      status = 'Arrived at Venue';
    } else if (dist <= 0.5) {
      status = 'Approaching Venue';
    }

    event.liveTracking.currentLocation = { lat: Number(newLat.toFixed(6)), lng: Number(newLng.toFixed(6)) };
    event.liveTracking.distanceKm = dist;
    event.liveTracking.status = status;
    event.liveTracking.speedKmh = status === 'Arrived at Venue' ? 0 : (24 + Math.floor(Math.random() * 8));
    event.liveTracking.eta = calculateETA(dist, event.liveTracking.speedKmh);
    event.liveTracking.updatedAt = new Date();

    await event.save();

    res.json({
      success: true,
      message: 'Simulation step executed',
      liveTracking: event.liveTracking
    });
  } catch (err) {
    console.error('Error simulating step:', err);
    res.status(500).json({ success: false, message: 'Server error simulating step' });
  }
});

module.exports = router;
