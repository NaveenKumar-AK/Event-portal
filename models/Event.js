const mongoose = require('mongoose');

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
  submittedAt: { type: Date, default: Date.now }
}, { _id: false });

const EventSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  endDate: String,
  startTime: String,
  endTime: String,
  time: String,
  location: String,
  venue: String,
  address: String,
  city: String,
  coordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  host: mongoose.Schema.Types.Mixed,
  hostDetails: {
    name: String,
    email: String,
    phone: String
  },
  category: String,
  description: String,
  longDescription: String,
  accessibilityFeatures: [String],
  image: String,
  alt: String,
  capacity: { type: Number, default: 50 },
  remainingPlaces: { type: Number, default: 50 },
  registeredCount: { type: Number, default: 0 },
  isFree: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  status: { type: String, default: 'upcoming' },
  gallery: [GalleryItemSchema],
  feedbackActive: { type: Boolean, default: true },
  feedbackQuestions: [FeedbackQuestionSchema],
  feedbackResponses: [FeedbackResponseSchema],
  liveTracking: { type: LiveTrackingSchema, default: () => ({}) }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', EventSchema);
