const express = require('express');
const router = express.Router();
const { events } = require('../data/store');

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
  const cats = [...new Set(events.map(e => e.category))];
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
    grouped[e.date].push({ id: e.id, title: e.title, time: e.time, venue: e.venue, category: e.category });
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

module.exports = router;
