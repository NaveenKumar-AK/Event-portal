const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AdminUser = require('../models/AdminUser');
const { adminSessions, locations, calculateDistanceKm, calculateETA } = require('../data/store');

// GET /api/admin/setup-status — checks if first-time administrator password setup is available
router.get('/setup-status', async (req, res) => {
  try {
    const admin = await AdminUser.findOne();
    res.json({
      success: true,
      isSetupNeeded: !admin || Boolean(admin.isSetupNeeded),
      email: admin ? admin.email : 'admin@servedeserve.org'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error checking setup status' });
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

    const emailNorm = email.toLowerCase().trim();
    const passwordHash = bcrypt.hashSync(password, 10);
    const adminName = name ? name.trim() : 'Institutional Administrator';

    let admin = await AdminUser.findOne({ email: emailNorm });
    if (admin) {
      admin.passwordHash = passwordHash;
      admin.name = adminName;
      admin.isSetupNeeded = false;
      await admin.save();
    } else {
      admin = await AdminUser.create({
        email: emailNorm,
        passwordHash,
        name: adminName,
        role: 'admin',
        isSetupNeeded: false
      });
    }

    const token = 'adm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    adminSessions.add(token);

    res.json({
      success: true,
      message: 'Administrator password successfully set with BCrypt in MongoDB.',
      token,
      user: { name: admin.name, email: admin.email, role: 'admin' }
    });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ success: false, message: 'Server error during admin setup' });
  }
});

// POST /api/admin/login — BCrypt password verification against MongoDB
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const emailNorm = email.toLowerCase().trim();
    const admin = await AdminUser.findOne({ email: emailNorm });

    if (admin) {
      const isMatch = bcrypt.compareSync(password, admin.passwordHash);
      if (isMatch) {
        const token = 'adm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
        adminSessions.add(token);
        return res.json({
          success: true,
          token,
          user: { name: admin.name, email: admin.email, role: 'admin' }
        });
      }
    }

    res.status(401).json({ success: false, message: 'Invalid email or password. Access denied.' });
  } catch (err) {
    console.error('Login error:', err);
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
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    const activeEvents = await Event.countDocuments({ status: 'upcoming' });

    const allEvents = await Event.find({}, 'capacity registeredCount id').lean();
    const totalCapacity = allEvents.reduce((sum, e) => sum + (e.capacity || 0), 0);
    const totalRegistered = allEvents.reduce((sum, e) => sum + (e.registeredCount || 0), 0);

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
    res.status(500).json({ success: false, message: 'Error retrieving stats' });
  }
});

// GET /api/admin/events — admin event list with registration counts
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ id: 1 }).lean();
    const regCounts = await Registration.aggregate([
      { $group: { _id: '$eventId', count: { $sum: 1 } } }
    ]);
    const regMap = new Map(regCounts.map(r => [String(r._id), r.count]));

    const enriched = events.map(e => {
      const count = regMap.get(String(e.id)) || e.registeredCount || 0;
      return {
        ...e,
        venue: e.location || e.venue || 'Civic Hall',
        time: e.startTime || e.time || '10:00 AM',
        registeredCount: count,
        registrationCount: count
      };
    });

    res.json({ success: true, events: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving events' });
  }
});

// POST /api/admin/events — create a new event with location mapping in MongoDB
router.post('/events', async (req, res) => {
  try {
    const hostObj = typeof req.body.host === 'object' ? req.body.host : { name: req.body.host || 'Community Support Team' };
    const hostName = hostObj.name || (typeof req.body.host === 'string' ? req.body.host : 'Community Support Team');

    const venueName = req.body.venue || req.body.location || 'Civic Hall';
    const cityName = req.body.city || '';
    const addressText = req.body.address || (cityName ? `${venueName}, ${cityName}` : venueName);
    const coords = (req.body.coordinates && req.body.coordinates.lat)
      ? req.body.coordinates
      : (req.body.lat && req.body.lng ? { lat: Number(req.body.lat), lng: Number(req.body.lng) } : null);

    const highestIdEvent = await Event.findOne().sort({ id: -1 }).lean();
    const nextId = highestIdEvent && highestIdEvent.id ? highestIdEvent.id + 1 : 1;

    const newEvent = new Event({
      ...req.body,
      id: nextId,
      host: hostName,
      hostDetails: hostObj,
      location: venueName,
      venue: venueName,
      city: cityName,
      address: addressText,
      coordinates: coords || { lat: 13.0827, lng: 80.2707 },
      startTime: req.body.startTime || req.body.time || '10:00 AM',
      endTime: req.body.endTime || '1:00 PM',
      time: req.body.time || req.body.startTime || '10:00 AM',
      category: req.body.category || 'Workshop',
      capacity: Number(req.body.capacity) || 30,
      registeredCount: 0,
      remainingPlaces: Number(req.body.capacity) || 30,
      status: req.body.status || 'upcoming',
      isFeatured: Boolean(req.body.isFeatured),
      image: req.body.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80',
      alt: req.body.title || 'Community event',
      gallery: [],
      feedbackActive: false,
      feedbackQuestions: [
        { id: 'q1', text: 'How would you rate your overall experience with this event?', type: 'rating' },
        { id: 'q2', text: 'Were the venue accessibility accommodations helpful and easy to use?', type: 'choice', options: ['Extremely helpful', 'Satisfactory', 'Needs improvements'] },
        { id: 'q3', text: 'What suggestions do you have for future events or sessions?', type: 'text' }
      ],
      feedbackResponses: [],
      liveTracking: {
        enabled: false,
        hostName,
        token: 'ht_' + nextId + '_' + Math.random().toString(36).substring(2, 8),
        currentLocation: coords || { lat: 13.0827, lng: 80.2707 },
        startLocation: coords || { lat: 13.0827, lng: 80.2707 },
        status: 'Not Started',
        eta: '--',
        distanceKm: 0,
        speedKmh: 0
      }
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
    const event = await Event.findOne({ id: Number(req.params.id) });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    event.status = req.body.status;
    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating event status' });
  }
});

// DELETE /api/admin/events/:id — delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const deleted = await Event.findOneAndDelete({ id: Number(req.params.id) });
    if (!deleted) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted from MongoDB', event: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting event' });
  }
});

// GET /api/admin/registrations — all registrations for admin
router.get('/registrations', async (req, res) => {
  try {
    const { eventId, status } = req.query;
    const filter = {};
    if (eventId && eventId !== 'all') filter.eventId = Number(eventId);
    if (status && status !== 'all') filter.status = { $regex: new RegExp(`^${status}$`, 'i') };

    const regs = await Registration.find(filter).sort({ createdAt: -1 }).lean();
    const eventIds = [...new Set(regs.map(r => r.eventId))];
    const events = await Event.find({ id: { $in: eventIds } }).lean();
    const eventMap = new Map(events.map(e => [String(e.id), e]));

    const result = regs.map(r => {
      const event = eventMap.get(String(r.eventId));
      const name = r.fullName || `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Attendee';
      const parts = name.split(' ');
      return {
        ...r,
        fullName: name,
        firstName: r.firstName || parts[0] || name,
        lastName: r.lastName || parts.slice(1).join(' ') || '',
        eventTitle: event ? event.title : 'Unknown Event',
        eventDate: event ? event.date : '',
        eventLocation: event ? (event.location || event.venue) : ''
      };
    });

    res.json({ success: true, count: result.length, registrations: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error listing registrations' });
  }
});

// PUT /api/admin/registrations/:id/status — update registration status
router.put('/registrations/:id/status', async (req, res) => {
  try {
    const reg = await Registration.findOne({ id: req.params.id });
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    reg.status = req.body.status;
    await reg.save();
    res.json({ success: true, registration: reg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating registration' });
  }
});

// PUT /api/admin/events/:id — update event details
router.put('/events/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    Object.assign(event, req.body);
    await event.save();
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating event' });
  }
});

// POST /api/admin/events/:id/gallery — add photo to event gallery
router.post('/events/:id/gallery', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.gallery) event.gallery = [];

    const photo = {
      id: 'g-' + Date.now(),
      url: req.body.url,
      caption: req.body.caption || event.title,
      alt: req.body.alt || event.title
    };
    event.gallery.push(photo);
    await event.save();
    res.status(201).json({ success: true, photo, gallery: event.gallery });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error adding photo' });
  }
});

// DELETE /api/admin/events/:id/gallery/:photoId — delete photo
router.delete('/events/:id/gallery/:photoId', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) });
    if (!event || !event.gallery) return res.status(404).json({ success: false, message: 'Photo or event not found' });

    const idx = event.gallery.findIndex(p => String(p.id) === String(req.params.photoId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Photo not found' });

    const deleted = event.gallery.splice(idx, 1)[0];
    await event.save();
    res.json({ success: true, message: 'Photo deleted', photo: deleted, gallery: event.gallery });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting photo' });
  }
});

// POST /api/admin/events/:id/feedback/toggle — toggle feedback active state
router.post('/events/:id/feedback/toggle', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.feedbackActive = typeof req.body.active === 'boolean' ? req.body.active : !event.feedbackActive;
    await event.save();
    res.json({ success: true, feedbackActive: event.feedbackActive });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error toggling feedback' });
  }
});

// POST /api/admin/events/:id/feedback/questions — add or update feedback questions
router.post('/events/:id/feedback/questions', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) });
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
    res.status(500).json({ success: false, message: 'Error updating feedback questions' });
  }
});

// GET /api/admin/events/:id/feedback — get questions and responses
router.get('/events/:id/feedback', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) }).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({
      success: true,
      feedbackActive: Boolean(event.feedbackActive),
      questions: event.feedbackQuestions || [],
      responses: event.feedbackResponses || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving feedback' });
  }
});

// GET /api/admin/locations — all locations
router.get('/locations', (req, res) => {
  res.json({ success: true, locations });
});

// PUT /api/admin/events/:id/host-tracking — toggle live host tracking in MongoDB
router.put('/events/:id/host-tracking', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) });
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

    event.markModified('liveTracking');
    await event.save();

    res.json({
      success: true,
      message: `Host live tracking ${event.liveTracking.enabled ? 'enabled' : 'disabled'} in MongoDB`,
      liveTracking: event.liveTracking
    });
  } catch (err) {
    console.error('Error toggling host tracking:', err);
    res.status(500).json({ success: false, message: 'Error updating host tracking' });
  }
});

// POST /api/admin/events/:id/host-tracking/simulate-step — simulate host moving towards venue
router.post('/events/:id/host-tracking/simulate-step', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) });
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

    // If marked as arrived
    if (req.body.arrived) {
      event.liveTracking.currentLocation = { lat: venueCoords.lat, lng: venueCoords.lng };
      event.liveTracking.distanceKm = 0;
      event.liveTracking.status = 'Arrived at Venue';
      event.liveTracking.speedKmh = 0;
      event.liveTracking.eta = 'Arrived';
      event.liveTracking.updatedAt = new Date();
      event.markModified('liveTracking');
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

    event.markModified('liveTracking');
    await event.save();

    res.json({
      success: true,
      message: 'Simulation step saved in MongoDB',
      liveTracking: event.liveTracking
    });
  } catch (err) {
    console.error('Error simulating host tracking:', err);
    res.status(500).json({ success: false, message: 'Error in tracking simulation' });
  }
});

module.exports = router;
