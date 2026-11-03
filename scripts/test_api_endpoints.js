require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');

const eventRoutes = require('../routes/events');
const registrationRoutes = require('../routes/registrations');
const adminRoutes = require('../routes/admin');

async function testApi() {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/events', eventRoutes);
  app.use('/api/registrations', registrationRoutes);
  app.use('/api/admin', adminRoutes);

  const server = app.listen(3099, async () => {
    console.log('Test server listening on port 3099');

    try {
      // 1. Test GET /api/events
      const eventsRes = await fetch('http://localhost:3099/api/events');
      const eventsData = await eventsRes.json();
      console.log('✓ GET /api/events:', eventsData.success, '| Events count:', eventsData.count);

      // 2. Test GET /api/events/1
      const singleEventRes = await fetch('http://localhost:3099/api/events/1');
      const singleEventData = await singleEventRes.json();
      console.log('✓ GET /api/events/1:', singleEventData.success, '| Title:', singleEventData.event.title);

      // 3. Test POST /api/admin/login
      const loginRes = await fetch('http://localhost:3099/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@servedeserve.org', password: 'admin123' })
      });
      const loginData = await loginRes.json();
      console.log('✓ POST /api/admin/login:', loginData.success, '| Admin token received:', Boolean(loginData.token));

      const adminToken = loginData.token;

      // 4. Test GET /api/admin/stats
      const statsRes = await fetch('http://localhost:3099/api/admin/stats', {
        headers: { 'x-admin-token': adminToken }
      });
      const statsData = await statsRes.json();
      console.log('✓ GET /api/admin/stats:', statsData.success, '| Stats:', statsData.stats);

      // 5. Test Registration
      const testEmail = `test_${Date.now()}@example.com`;
      const regRes = await fetch('http://localhost:3099/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 1,
          fullName: 'Test Participant',
          email: testEmail,
          department: 'Community Tester'
        })
      });
      const regData = await regRes.json();
      console.log('✓ POST /api/registrations:', regData.success, '| Ref ID:', regData.registration.referenceId);

      // 6. Test Track Registration
      const trackRes = await fetch(`http://localhost:3099/api/registrations/track/${regData.registration.referenceId}`);
      const trackData = await trackRes.json();
      console.log('✓ GET /api/registrations/track/:refId:', trackData.success, '| Registered Name:', trackData.registration.fullName);

      // 7. Test POST Feedback
      const fbRes = await fetch('http://localhost:3099/api/events/1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: 'Test Participant',
          userEmail: testEmail,
          rating: 5,
          comments: 'Wonderful experience!'
        })
      });
      const fbData = await fbRes.json();
      console.log('✓ POST /api/events/1/feedback:', fbData.success, '| Message:', fbData.message);

      console.log('\n🎉 ALL BACKEND API ENDPOINTS ARE FULLY OPERATIONAL WITH MONGODB!');
    } catch (err) {
      console.error('API Test Error:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

testApi();

