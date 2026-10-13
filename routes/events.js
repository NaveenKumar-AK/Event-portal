const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { calculateDistanceKm, calculateETA } = require('../data/store');

// GET /api/events — list all events, with optional filters
router.get('/', async (req, res) => {
  try {
    const { search, category, date, city, status } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    if (category && category !== 'all') {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    if (date) {
      filter.date = date;
    }
    if (city && city !== 'all') {
      filter.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const events = await Event.find(filter).lean();
    res.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ success: false, message: 'Server error fetching events' });
  }
});

// GET /api/events/featured — featured events
router.get('/featured', async (req, res) => {
  try {
    const featured = await Event.find({ isFeatured: true }).lean();
    res.json({ success: true, events: featured });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching featured events' });
  }
});

// GET /api/events/categories — distinct categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Event.distinct('category');
    res.json({ success: true, categories: categories.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
});

// GET /api/events/calendar — events grouped by date
router.get('/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;
    const allEvents = await Event.find({}, 'id title time startTime date venue category').lean();
    
    let filtered = allEvents;
    if (month && year) {
      filtered = allEvents.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
      });
    }

    const grouped = {};
    filtered.forEach(e => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push({ id: e.id, title: e.title, time: e.time || e.startTime, venue: e.venue, category: e.category });
    });
    res.json({ success: true, calendar: grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching calendar' });
  }
});

// GET /api/events/:id — single event detail
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) }).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching event' });
  }
});

// GET /api/events/:id/gallery — get photos for an event
router.get('/:id/gallery', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) }, 'id title date gallery').lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({
      success: true,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      photos: event.gallery || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching gallery' });
  }
});

// GET /api/events/:id/feedback — get feedback questions if active
router.get('/:id/feedback', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) }, 'feedbackActive feedbackQuestions').lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({
      success: true,
      feedbackActive: Boolean(event.feedbackActive),
      questions: event.feedbackQuestions || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching feedback questions' });
  }
});

// POST /api/events/:id/feedback — submit user feedback
router.post('/:id/feedback', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.feedbackActive) {
      return res.status(403).json({ success: false, message: 'Feedback is currently not active for this event' });
    }

    const submission = {
      id: 'resp-' + Date.now(),
      userName: req.body.userName || 'Community Attendee',
      userEmail: req.body.userEmail || 'attendee@servedeserve.org',
      rating: Number(req.body.rating) || 5,
      answers: req.body.answers || {},
      submittedAt: new Date()
    };

    if (!event.feedbackResponses) event.feedbackResponses = [];
    event.feedbackResponses.push(submission);
    await event.save();

    res.status(201).json({ success: true, message: 'Feedback submitted successfully! Thank you.', submission });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error submitting feedback' });
  }
});

// GET /api/events/:id/host-tracking — get live location and status of the presiding host
router.get('/:id/host-tracking', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) }).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const hostName = typeof event.host === 'object' ? (event.host.name || 'Presiding Host') : (event.host || 'Presiding Host');
    const tracking = event.liveTracking || {
      enabled: false,
      hostName,
      token: 'ht_' + event.id,
      currentLocation: event.coordinates || { lat: 13.0827, lng: 80.2707 },
      status: 'Not Started',
      eta: '--',
      distanceKm: 0,
      speedKmh: 0,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      eventId: event.id,
      eventTitle: event.title,
      venue: {
        name: event.venue || event.location || 'Event Venue',
        address: event.address || '',
        coordinates: event.coordinates || { lat: 13.0827, lng: 80.2707 }
      },
      host: {
        name: hostName,
        details: event.hostDetails || null
      },
      liveTracking: tracking
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching host tracking' });
  }
});

// POST /api/events/:id/host-tracking/update — update host coordinates from host device GPS or simulator
router.post('/:id/host-tracking/update', async (req, res) => {
  try {
    const event = await Event.findOne({ id: Number(req.params.id) });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const { status, token, speed } = req.body;
    const lat = typeof req.body.lat === 'number' ? req.body.lat : req.body.latitude;
    const lng = typeof req.body.lng === 'number' ? req.body.lng : req.body.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required' });
    }

    if (!event.liveTracking) {
      const hostName = typeof event.host === 'object' ? (event.host.name || 'Presiding Host') : (event.host || 'Presiding Host');
      event.liveTracking = {
        enabled: true,
        hostName,
        token: token || 'ht_' + event.id,
        currentLocation: { lat, lng },
        status: 'En Route',
        eta: 'Calculating...',
        distanceKm: 0,
        speedKmh: 0,
        updatedAt: new Date()
      };
    }

    // Token validation if provided
    if (token && event.liveTracking.token && event.liveTracking.token !== token) {
      return res.status(403).json({ success: false, message: 'Invalid host tracking token' });
    }

    const venueCoords = event.coordinates || { lat: 13.0827, lng: 80.2707 };
    const distanceKm = calculateDistanceKm(lat, lng, venueCoords.lat, venueCoords.lng);
    const eta = calculateETA(distanceKm, speed && speed > 5 ? speed : 28);

    let computedStatus = status || event.liveTracking.status || 'En Route';
    if (distanceKm <= 0.08) {
      computedStatus = 'Arrived at Venue';
    } else if (distanceKm <= 0.5) {
      computedStatus = 'Approaching Venue';
    } else if (computedStatus === 'Not Started' || !computedStatus) {
      computedStatus = 'En Route';
    }

    event.liveTracking.currentLocation = { lat, lng };
    event.liveTracking.distanceKm = distanceKm;
    event.liveTracking.eta = eta;
    event.liveTracking.status = computedStatus;
    event.liveTracking.speedKmh = Number(speed) || (computedStatus === 'Arrived at Venue' ? 0 : 25);
    event.liveTracking.updatedAt = new Date();

    event.markModified('liveTracking');
    await event.save();

    res.json({
      success: true,
      message: 'Host location updated successfully in MongoDB',
      liveTracking: event.liveTracking
    });
  } catch (err) {
    console.error('Error updating host tracking:', err);
    res.status(500).json({ success: false, message: 'Server error updating host tracking' });
  }
});

module.exports = router;
