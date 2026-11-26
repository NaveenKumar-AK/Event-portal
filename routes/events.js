const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isDbConnected } = require('../config/db');
const { Event, EventFeedback } = require('../models');
const {
  events: storeEvents,
  findStoreEvent,
  calculateDistanceKm,
  calculateETA
} = require('../data/store');

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

function filterStoreEvents(events, { search, category, date, city, status, state, district }) {
  return events.filter(e => {
    if (status && status !== 'all' && String(e.status).toLowerCase() !== String(status).toLowerCase()) return false;
    if (category && category !== 'all' && String(e.category).toLowerCase() !== String(category).toLowerCase()) return false;
    if (date && e.date !== date) return false;
    if (city && city !== 'all' && String(e.city || '').toLowerCase() !== String(city).toLowerCase()) return false;

    if (state && state !== 'all' && state !== 'All States') {
      const sRe = new RegExp(state, 'i');
      if (!sRe.test(e.state || '') && !sRe.test(e.address || '') && !sRe.test(e.location || '')) return false;
    }

    if (district && district !== 'all' && !district.startsWith('All Districts')) {
      const dRe = new RegExp(district, 'i');
      if (!dRe.test(e.district || '') && !dRe.test(e.city || '') && !dRe.test(e.address || '') && !dRe.test(e.location || '')) return false;
    }

    if (search) {
      const qRe = new RegExp(search, 'i');
      if (!qRe.test(e.title || '') && !qRe.test(e.description || '') && !qRe.test(e.venue || '') && !qRe.test(e.location || '')) return false;
    }

    return true;
  }).sort((a, b) => (a.id || 0) - (b.id || 0));
}

function groupCalendar(events, month, year) {
  let list = events;
  if (month && year) {
    list = events.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === parseInt(month, 10) && d.getFullYear() === parseInt(year, 10);
    });
  }
  const grouped = {};
  list.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push({ id: e.id, title: e.title, time: e.time, venue: e.venue || e.location, category: e.category });
  });
  return grouped;
}

function formatTrackingPayload(event) {
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

  return {
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
  };
}

// GET /api/events — list all events, with optional filters
router.get('/', async (req, res) => {
  try {
    if (!isDbConnected()) {
      const events = filterStoreEvents(storeEvents, req.query);
      return res.json({ success: true, count: events.length, events });
    }

    const { search, category, date, city, status, state, district } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (date) query.date = date;
    if (city && city !== 'all') query.city = { $regex: new RegExp(`^${city}$`, 'i') };

    if (state && state !== 'all' && state !== 'All States') {
      query.$or = [
        { state: { $regex: new RegExp(state, 'i') } },
        { address: { $regex: new RegExp(state, 'i') } },
        { location: { $regex: new RegExp(state, 'i') } }
      ];
    }
    if (district && district !== 'all' && !district.startsWith('All Districts')) {
      const districtFilter = [
        { district: { $regex: new RegExp(district, 'i') } },
        { city: { $regex: new RegExp(district, 'i') } },
        { address: { $regex: new RegExp(district, 'i') } },
        { location: { $regex: new RegExp(district, 'i') } }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: districtFilter }];
        delete query.$or;
      } else {
        query.$or = districtFilter;
      }
    }
    if (search) {
      const sRegex = { $regex: new RegExp(search, 'i') };
      const searchFilter = [
        { title: sRegex },
        { description: sRegex },
        { venue: sRegex },
        { location: sRegex }
      ];
      if (query.$and) {
        query.$and.push({ $or: searchFilter });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchFilter }];
        delete query.$or;
      } else {
        query.$or = searchFilter;
      }
    }

    const events = await Event.find(query).sort({ id: 1 }).lean();
    res.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ success: false, message: 'Server error fetching events' });
  }
});

// GET /api/events/featured — featured events
router.get('/featured', async (req, res) => {
  try {
    const featured = isDbConnected()
      ? await Event.find({ isFeatured: true }).lean()
      : storeEvents.filter(e => e.isFeatured);
    res.json({ success: true, events: featured });
  } catch (err) {
    console.error('Error fetching featured events:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/events/categories — distinct categories
router.get('/categories', async (req, res) => {
  try {
    const cats = isDbConnected()
      ? await Event.distinct('category')
      : [...new Set(storeEvents.map(e => e.category))];
    res.json({ success: true, categories: cats.filter(Boolean) });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/events/calendar — events grouped by date
router.get('/calendar', async (req, res) => {
  try {
    const { month, year } = req.query;
    const events = isDbConnected() ? await Event.find().lean() : storeEvents;
    res.json({ success: true, calendar: groupCalendar(events, month, year) });
  } catch (err) {
    console.error('Error fetching calendar:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/events/:id — single event detail
router.get('/:id', async (req, res) => {
  try {
    const event = isDbConnected()
      ? await Event.findOne(getEventQuery(req.params.id)).lean()
      : findStoreEvent(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/events/:id/gallery — get photos for an event
router.get('/:id/gallery', async (req, res) => {
  try {
    const event = isDbConnected()
      ? await Event.findOne(getEventQuery(req.params.id)).lean()
      : findStoreEvent(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({
      success: true,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      photos: event.gallery || []
    });
  } catch (err) {
    console.error('Error fetching gallery:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/events/:id/feedback — get feedback questions if active
router.get('/:id/feedback', async (req, res) => {
  try {
    const event = isDbConnected()
      ? await Event.findOne(getEventQuery(req.params.id)).lean()
      : findStoreEvent(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({
      success: true,
      feedbackActive: Boolean(event.feedbackActive),
      questions: event.feedbackQuestions || []
    });
  } catch (err) {
    console.error('Error fetching feedback questions:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/events/:id/feedback — submit user feedback
router.post('/:id/feedback', async (req, res) => {
  try {
    const event = isDbConnected()
      ? await Event.findOne(getEventQuery(req.params.id))
      : findStoreEvent(req.params.id);
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
      submittedAt: new Date()
    };
    event.feedbackResponses.push(submission);

    if (isDbConnected()) {
      await event.save();
      try {
        await EventFeedback.create({
          feedback_id: Date.now(),
          registration_id: null,
          event_id: event.id || event.event_id,
          user_name: submission.userName,
          user_email: submission.userEmail,
          rating: submission.rating,
          comments: submission.comments,
          answers: submission.answers,
          is_visible: true,
          submitted_at: submission.submittedAt
        });
      } catch (fbErr) {
        console.warn('Note: EventFeedback record creation:', fbErr.message);
      }
    }

    res.status(201).json({ success: true, message: 'Feedback submitted successfully! Thank you.', submission });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ success: false, message: 'Server error submitting feedback' });
  }
});

// GET /api/events/:id/host-tracking — get real-time GPS tracking status of event host
router.get('/:id/host-tracking', async (req, res) => {
  try {
    const event = isDbConnected()
      ? await Event.findOne(getEventQuery(req.params.id)).lean()
      : findStoreEvent(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json(formatTrackingPayload(event));
  } catch (err) {
    console.error('Error fetching host tracking:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/events/:id/host-tracking/update — update host coordinates
router.post('/:id/host-tracking/update', async (req, res) => {
  try {
    const event = isDbConnected()
      ? await Event.findOne(getEventQuery(req.params.id))
      : findStoreEvent(req.params.id);
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

    if (token && event.liveTracking.token && event.liveTracking.token !== token) {
      return res.status(403).json({ success: false, message: 'Invalid host tracking token' });
    }

    const venueCoords = event.coordinates || { lat: 13.0827, lng: 80.2707 };
    const distanceKm = calculateDistanceKm(lat, lng, venueCoords.lat, venueCoords.lng);
    const eta = calculateETA(distanceKm, speed && speed > 5 ? speed : 28);

    let computedStatus = status || event.liveTracking.status || 'En Route';
    if (distanceKm <= 0.08) computedStatus = 'Arrived at Venue';
    else if (distanceKm <= 0.5) computedStatus = 'Approaching Venue';
    else if (computedStatus === 'Not Started' || !computedStatus) computedStatus = 'En Route';

    event.liveTracking.currentLocation = { lat, lng };
    event.liveTracking.distanceKm = distanceKm;
    event.liveTracking.eta = eta;
    event.liveTracking.status = computedStatus;
    event.liveTracking.speedKmh = Number(speed) || (computedStatus === 'Arrived at Venue' ? 0 : 25);
    event.liveTracking.updatedAt = new Date();

    if (isDbConnected()) await event.save();

    res.json({
      success: true,
      message: 'Host location updated successfully',
      liveTracking: event.liveTracking
    });
  } catch (err) {
    console.error('Error updating host tracking:', err);
    res.status(500).json({ success: false, message: 'Server error updating host tracking' });
  }
});

module.exports = router;
