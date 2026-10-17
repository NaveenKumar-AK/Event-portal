const express = require('express');
const router = express.Router();
const { registrations, events } = require('../data/store');

// POST /api/registrations — create a new registration
router.post('/', (req, res) => {
  const { eventId, fullName, firstName, lastName, email, phone, department, organization } = req.body;

  const resolvedName = fullName || (firstName ? `${firstName} ${lastName || ''}`.trim() : '');
  if (!eventId || !resolvedName || !email) {
    return res.status(400).json({ success: false, message: 'Required fields: eventId, fullName, email' });
  }

  const event = events.find(e => String(e.id) === String(eventId));
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  // Check duplicate
  const exists = registrations.find(r => String(r.eventId) === String(eventId) && r.email.toLowerCase() === email.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: 'Already registered for this event' });
  }

  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const referenceId = `SDS-2026-${timestamp}-${random}`;

  const registration = {
    id: 'reg-' + (registrations.length + 1),
    eventId: event.id,
    referenceId,
    fullName: resolvedName,
    firstName: firstName || resolvedName.split(' ')[0],
    lastName: lastName || resolvedName.split(' ').slice(1).join(' '),
    email: email.trim(),
    phone: phone || '',
    department: department || organization || '',
    organization: department || organization || '',
    status: 'Confirmed',
    registeredAt: new Date().toISOString()
  };

  registrations.unshift(registration);
  if (event.remainingPlaces && event.remainingPlaces > 0) {
    event.remainingPlaces--;
  }
  event.registeredCount = (event.registeredCount || 0) + 1;

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    registration: {
      referenceId: registration.referenceId,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.startTime || event.time,
      eventVenue: event.location || event.venue,
      name: resolvedName,
      email: registration.email,
      status: registration.status
    }
  });
});

// GET /api/registrations/track/:refId — track a registration
router.get('/track/:refId', (req, res) => {
  const reg = registrations.find(r => r.referenceId.toLowerCase() === req.params.refId.trim().toLowerCase());
  if (!reg) return res.status(404).json({ success: false, message: 'Registration not found. Please check your reference ID.' });

  const event = events.find(e => String(e.id) === String(reg.eventId));
  res.json({
    success: true,
    registration: {
      ...reg,
      eventTitle: event ? event.title : 'Unknown Event',
      eventDate: event ? event.date : '',
      eventTime: event ? (event.startTime || event.time) : '',
      eventVenue: event ? (event.location || event.venue) : ''
    }
  });
});

// GET /api/registrations — list all
router.get('/', (req, res) => {
  const enriched = registrations.map(r => {
    const event = events.find(e => String(e.id) === String(r.eventId));
    return {
      ...r,
      eventTitle: event ? event.title : 'Unknown',
      eventDate: event ? event.date : '',
      eventLocation: event ? (event.location || event.venue) : ''
    };
  });
  res.json({ success: true, count: enriched.length, registrations: enriched });
});

module.exports = router;
