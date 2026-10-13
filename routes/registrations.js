const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// POST /api/registrations — create a new registration in MongoDB
router.post('/', async (req, res) => {
  try {
    const { eventId, fullName, firstName, lastName, email, phone, department, organization } = req.body;

    const resolvedName = fullName || (firstName ? `${firstName} ${lastName || ''}`.trim() : '');
    if (!eventId || !resolvedName || !email) {
      return res.status(400).json({ success: false, message: 'Required fields: eventId, fullName, email' });
    }

    const event = await Event.findOne({ id: Number(eventId) });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Check duplicate
    const exists = await Registration.findOne({
      eventId: Number(eventId),
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
    });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Already registered for this event' });
    }

    const count = await Registration.countDocuments();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceId = `SDS-2026-${timestamp}-${random}`;

    const newReg = new Registration({
      id: 'reg-' + (count + 1),
      eventId: event.id,
      referenceId,
      fullName: resolvedName,
      email: email.trim(),
      phone: phone || '',
      department: department || organization || '',
      status: 'Confirmed',
      registeredAt: new Date()
    });

    await newReg.save();

    // Decrement remaining places and increment registeredCount on Event
    if (event.remainingPlaces && event.remainingPlaces > 0) {
      event.remainingPlaces -= 1;
    }
    event.registeredCount = (event.registeredCount || 0) + 1;
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful and saved to MongoDB',
      registration: {
        referenceId: newReg.referenceId,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.startTime || event.time,
        eventVenue: event.location || event.venue,
        name: resolvedName,
        email: newReg.email,
        status: newReg.status
      }
    });
  } catch (err) {
    console.error('Error creating registration:', err);
    res.status(500).json({ success: false, message: 'Server error creating registration' });
  }
});

// GET /api/registrations/track/:refId — track a registration by Reference ID
router.get('/track/:refId', async (req, res) => {
  try {
    const reg = await Registration.findOne({
      referenceId: { $regex: new RegExp(`^${req.params.refId.trim()}$`, 'i') }
    }).lean();

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found. Please check your reference ID.' });
    }

    const event = await Event.findOne({ id: Number(reg.eventId) }).lean();
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
  } catch (err) {
    console.error('Error tracking registration:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving registration' });
  }
});

// GET /api/registrations — list all registrations
router.get('/', async (req, res) => {
  try {
    const regs = await Registration.find().sort({ createdAt: -1 }).lean();
    const eventIds = [...new Set(regs.map(r => r.eventId))];
    const events = await Event.find({ id: { $in: eventIds } }).lean();
    const eventMap = new Map(events.map(e => [String(e.id), e]));

    const enriched = regs.map(r => {
      const event = eventMap.get(String(r.eventId));
      return {
        ...r,
        eventTitle: event ? event.title : 'Unknown',
        eventDate: event ? event.date : '',
        eventLocation: event ? (event.location || event.venue) : ''
      };
    });

    res.json({ success: true, count: enriched.length, registrations: enriched });
  } catch (err) {
    console.error('Error listing registrations:', err);
    res.status(500).json({ success: false, message: 'Server error listing registrations' });
  }
});

module.exports = router;
