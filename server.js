require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── In-Memory Data Store ───
const data = require('./data/store');

// ─── API Routes ───
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const adminRoutes = require('./routes/admin');

app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);

// ─── Frontend Page Routes ───
const sendPage = (page) => (req, res) => res.sendFile(page, { root: path.join(__dirname, 'public') });

// Root Entry: First login should come (User or Admin)
app.get('/', (req, res) => {
  res.redirect('/login');
});

// User Event Portal Routes (Unified Figma SPA)
app.get([
  '/events',
  '/events/:id',
  '/register/:id',
  '/confirmation',
  '/registrations',
  '/gallery',
  '/track'
], sendPage('index.html'));

// Admin & Auth Routes
app.get('/login',                 sendPage('login.html'));
app.get('/admin/login',           sendPage('admin/login.html'));
app.get(['/admin', '/admin/'],    sendPage('admin/dashboard.html'));
app.get('/admin/events',          sendPage('admin/events.html'));
app.get('/admin/events/create',   sendPage('admin/create-event.html'));
app.get('/admin/registrations',   sendPage('admin/registrations.html'));

// ─── Static Asset Serving ───
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`\n🚀 ServeDeServe Event Portal running at http://localhost:${PORT}`);
  console.log(`   Admin panel: http://localhost:${PORT}/admin\n`);
});
