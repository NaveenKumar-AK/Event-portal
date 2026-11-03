const mongoose = require('mongoose');

// ─── 2.6 Event_Registrations Subdocument Schema ───
const RegistrationSubSchema = new mongoose.Schema({
  registration_id: { type: Number },
  id: { type: String }, // e.g. 'reg-1'
  event_id: { type: Number },
  user_id: { type: Number },
  registration_no: { type: String }, // e.g. 'SDS-2026-1015-01'
  referenceId: { type: String },
  full_name: { type: String },
  fullName: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String },
  phone: { type: String },
  department: { type: String },
  organization: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'attended'], default: 'confirmed' },
  registered_at: { type: Date, default: Date.now },
  registeredAt: { type: String },
  cancelled_at: { type: Date, default: null },
  attended_at: { type: Date, default: null }
}, { _id: false });

// ─── Live Tracking Subdocument Schema ───
const LiveTrackingSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  hostName: { type: String, default: '' },
  token: { type: String, default: '' },
  currentLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  startLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  status: { type: String, default: 'Not Started' },
  eta: { type: String, default: '--' },
  distanceKm: { type: Number, default: 0 },
  speedKmh: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const GalleryItemSchema = new mongoose.Schema({
  id: String,
  url: String,
  caption: String,
  alt: String
}, { _id: false });

const FeedbackQuestionSchema = new mongoose.Schema({
  id: String,
  text: String,
  type: { type: String, default: 'rating' },
  options: [String]
}, { _id: false });

const FeedbackResponseSchema = new mongoose.Schema({
  id: String,
  userName: String,
  userEmail: String,
  rating: Number,
  answers: mongoose.Schema.Types.Mixed,
  comments: String,
  submittedAt: { type: Date, default: Date.now }
}, { _id: false });

// ─── Combined Events Schema (2.2 Categories + 2.3 Hosts + 2.4 Locations + 2.5 Events + 2.6 Registrations) ───
const EventSchema = new mongoose.Schema({
  // ─── 2.5 Events ───
  event_id: { type: Number, unique: true, index: true },
  id: { type: Number, index: true },
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String, required: true },
  longDescription: { type: String },
  mode: { type: String, enum: ['offline', 'online', 'hybrid'], default: 'offline' },
  start_datetime: { type: Date },
  end_datetime: { type: Date },
  registration_deadline: { type: Date },
  capacity: { type: Number, default: 50 },
  remainingPlaces: { type: Number, default: 50 },
  registeredCount: { type: Number, default: 0 },
  banner_image_url: { type: String },
  image: { type: String },
  alt: { type: String },
  status: { type: String, default: 'published' },
  isFeatured: { type: Boolean, default: false },
  isFree: { type: Boolean, default: true },
  accessibilityFeatures: [String],
  created_by: { type: Number, default: 1 },

  // String date & time formats for app compatibility
  date: { type: String },
  endDate: { type: String },
  time: { type: String },
  startTime: { type: String },
  endTime: { type: String },

  // ─── 2.2 Event_Categories ───
  category_id: { type: Number },
  category_name: { type: String },
  category: { type: String },
  category_description: { type: String },
  is_category_active: { type: Boolean, default: true },

  // ─── 2.3 Event_Hosts ───
  host_id: { type: Number },
  host_name: { type: String },
  host: { type: mongoose.Schema.Types.Mixed },
  hostDetails: {
    name: String,
    email: String,
    phone: String
  },
  contact_person: { type: String },
  contact_email: { type: String },
  contact_phone: { type: String },
  host_description: { type: String },

  // ─── 2.4 Host_Locations ───
  location_id: { type: Number },
  location_name: { type: String },
  venue: { type: String },
  location: { type: String },
  address_line: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  district: { type: String },
  postal_code: { type: String },
  country: { type: String, default: 'India' },
  latitude: { type: Number },
  longitude: { type: Number },
  coordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },

  // ─── 2.6 Event_Registrations (Embedded Array) ───
  registrations: [RegistrationSubSchema],

  // Embedded Gallery & Feedback
  gallery: [GalleryItemSchema],
  feedbackActive: { type: Boolean, default: true },
  feedbackQuestions: [FeedbackQuestionSchema],
  feedbackResponses: [FeedbackResponseSchema],
  liveTracking: { type: LiveTrackingSchema, default: () => ({}) },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'Events',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Event', EventSchema, 'Events');
