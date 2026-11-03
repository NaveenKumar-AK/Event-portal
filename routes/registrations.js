const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Event } = require('../models');

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

// POST /api/registrations — create a new registration
router.post('/', async (req, res) => {
  try {
    const { eventId, fullName, firstName, lastName, email, phone, department, organization } = req.body;

    const resolvedName = fullName || (firstName ? `${firstName} ${lastName || ''}`.trim() : '');
    if (!eventId || !resolvedName || !email) {
      return res.status(400).json({ success: false, message: 'Required fields: eventId, fullName, email' });
    }

    const event = await Event.findOne(getEventQuery(eventId));
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Check duplicate
    const cleanEmail = email.trim().toLowerCase();
    const exists = (event.registrations || []).find(r => (r.email || '').toLowerCase() === cleanEmail);
    if (exists) {
      return res.status(400).json({ success: false, message: 'Already registered for this event' });
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceId = `SDS-2026-${timestamp}-${random}`;

    const registration = {
      registration_id: Date.now(),
      id: 'reg-' + Date.now(),
      event_id: event.id || event.event_id,
      eventId: event.id || event.event_id,
      registration_no: referenceId,
      referenceId,
      full_name: resolvedName,
      fullName: resolvedName,
      firstName: firstName || resolvedName.split(' ')[0],
      lastName: lastName || resolvedName.split(' ').slice(1).join(' '),
      email: cleanEmail,
      phone: phone || '',
      department: department || organization || '',
      organization: department || organization || '',
      status: 'confirmed',
      registeredAt: new Date().toISOString(),
      registered_at: new Date()
    };

    if (!event.registrations) event.registrations = [];
    event.registrations.unshift(registration);
    if (event.remainingPlaces && event.remainingPlaces > 0) {
      event.remainingPlaces--;
    }
    event.registeredCount = (event.registeredCount || 0) + 1;

    await event.save();

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
  } catch (err) {
    console.error('Error creating registration:', err);
    res.status(500).json({ success: false, message: 'Server error processing registration' });
  }
});

// GET /api/registrations/track/:refId — track a registration
router.get('/track/:refId', async (req, res) => {
  try {
    const cleanRef = (req.params.refId || '').trim();
    if (!cleanRef) {
      return res.status(400).json({ success: false, message: 'Reference ID is required' });
    }

    const event = await Event.findOne({
      "registrations.referenceId": { $regex: new RegExp(`^${cleanRef}$`, 'i') }
    }).lean();

    if (!event) {
      return res.status(404).json({ success: false, message: 'Registration not found. Please check your reference ID.' });
    }

    const reg = (event.registrations || []).find(r => (r.referenceId || '').toLowerCase() === cleanRef.toLowerCase());
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found. Please check your reference ID.' });
    }

    res.json({
      success: true,
      registration: {
        ...reg,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.startTime || event.time,
        eventVenue: event.location || event.venue
      }
    });
  } catch (err) {
    console.error('Error tracking registration:', err);
    res.status(500).json({ success: false, message: 'Server error tracking registration' });
  }
});

// GET /api/registrations — list all
router.get('/', async (req, res) => {
  try {
    const allEvents = await Event.find().lean();
    const enriched = [];
    allEvents.forEach(e => {
      (e.registrations || []).forEach(r => {
        enriched.push({
          ...r,
          eventTitle: e.title,
          eventDate: e.date,
          eventLocation: e.location || e.venue
        });
      });
    });

    enriched.sort((a, b) => new Date(b.registeredAt || b.registered_at || 0) - new Date(a.registeredAt || a.registered_at || 0));

    res.json({ success: true, count: enriched.length, registrations: enriched });
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ success: false, message: 'Server error fetching registrations' });
  }
});

module.exports = router;
