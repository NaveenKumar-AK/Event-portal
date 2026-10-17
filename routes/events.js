const express = require('express');
const router = express.Router();
const { events, calculateDistanceKm, calculateETA } = require('../data/store');

// GET /api/events — list all events, with optional filters
router.get('/', (req, res) => {
  let result = [...events];
  const { search, category, date, city, status } = req.query;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(e =>
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      ((e.venue || e.location) && (e.venue || e.location).toLowerCase().includes(q))
    );
  }
  if (category && category !== 'all') {
    result = result.filter(e => e.category && e.category.toLowerCase() === category.toLowerCase());
  }
  if (date) {
    result = result.filter(e => e.date === date);
  }
  if (city && city !== 'all') {
    result = result.filter(e => e.city && e.city.toLowerCase() === city.toLowerCase());
  }
  if (status && status !== 'all') {
    result = result.filter(e => e.status === status);
  }

  res.json({ success: true, count: result.length, events: result });
});

// GET /api/events/featured — featured events
router.get('/featured', (req, res) => {
  const featured = events.filter(e => e.isFeatured);
  res.json({ success: true, events: featured });
});

// GET /api/events/categories — distinct categories
router.get('/categories', (req, res) => {
  const cats = [...new Set(events.map(e => e.category))].filter(Boolean);
  res.json({ success: true, categories: cats });
});

// GET /api/events/calendar — events grouped by date
router.get('/calendar', (req, res) => {
  const { month, year } = req.query;
  let filtered = [...events];
  if (month && year) {
    filtered = filtered.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year);
    });
  }
  const grouped = {};
  filtered.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push({ id: e.id, title: e.title, time: e.time, venue: e.venue || e.location, category: e.category });
  });
  res.json({ success: true, calendar: grouped });
});

// GET /api/events/:id — single event detail
router.get('/:id', (req, res) => {
  const event = events.find(e => String(e.id) === String(req.params.id));
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, event });
});

// GET /api/events/:id/gallery — get photos for an event
router.get('/:id/gallery', (req, res) => {
  const event = events.find(e => String(e.id) === String(req.params.id));
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({
    success: true,
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.date,
    photos: event.gallery || []
  });
});

// GET /api/events/:id/feedback — get feedback questions if active
router.get('/:id/feedback', (req, res) => {
  const event = events.find(e => String(e.id) === String(req.params.id));
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({
    success: true,
    feedbackActive: Boolean(event.feedbackActive),
    questions: event.feedbackQuestions || []
  });
});

// POST /api/events/:id/feedback — submit user feedback
router.post('/:id/feedback', (req, res) => {
  const event = events.find(e => String(e.id) === String(req.params.id));
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  if (!event.feedbackActive) {
    return res.status(403).json({ success: false, message: 'Feedback is currently not active for this event' });
  }

  if (!event.feedbackResponses) event.feedbackResponses = [];
  const submission = {
    id: 'resp-' + Date.now(),
    userName: req.body.userName || 'Community Attendee',
    userEmail: req.body.userEmail || 'attendee@servedeserve.org',
    rating: Number(req.body.rating) || 5,
    answers: req.body.answers || {},
    comments: req.body.comments || '',
    submittedAt: new Date().toISOString()
  };
  event.feedbackResponses.push(submission);
  res.status(201).json({ success: true, message: 'Feedback submitted successfully! Thank you.', submission });
});

// GET /api/events/:id/host-tracking — get real-time GPS tracking status of event host
router.get('/:id/host-tracking', (req, res) => {
  const event = events.find(e => String(e.id) === String(req.params.id));
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const hostName = typeof event.host === 'object' ? (event.host.name || 'Presiding Host') : (event.host || 'Presiding Host');
  const tracking = event.liveTracking || {
    enabled: false,
    hostName,
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
});

// POST /api/events/:id/host-tracking/update — update host coordinates from host device GPS or simulator
router.post('/:id/host-tracking/update', (req, res) => {
  const event = events.find(e => String(e.id) === String(req.params.id));
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

  res.json({
    success: true,
    message: 'Host location updated successfully',
    liveTracking: event.liveTracking
  });
});

module.exports = router;
