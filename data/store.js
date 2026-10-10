// ─── In-Memory Data Store ───
// Perfectly aligned with ServeDeServe Figma Design System & Enhanced Admin, Gallery, and Feedback

const events = [
  {
    id: 1,
    title: 'Inclusive Digital Skills Workshop',
    date: '2026-10-15',
    endDate: '2026-10-15',
    startTime: '10:00 AM',
    endTime: '1:00 PM',
    time: '10:00 AM',
    location: 'Community Learning Centre',
    venue: 'Community Learning Centre',
    address: '14 Civic Way, Central District',
    city: 'Central District',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    host: 'Community Support Team',
    hostDetails: {
      name: 'Community Support Team',
      email: 'events@servedeserve.org',
      phone: '(555) 014-2025'
    },
    category: 'Workshop',
    description: 'Build confidence using everyday digital tools with guided, accessible support.',
    longDescription: 'Friendly facilitators will guide you through every part of the session. Support people are welcome, and accessibility assistance is available on request.',
    accessibilityFeatures: ['Step-free entrance', 'Accessible parking', 'Hearing loop'],
    image: 'https://images.unsplash.com/photo-1657161102089-1b13806de5f1?auto=format&fit=crop&w=900&q=80',
    alt: 'A speaker leading a seated community workshop',
    capacity: 25,
    remainingPlaces: 12,
    isFree: true,
    isFeatured: true,
    status: 'upcoming',
    gallery: [
      {
        id: 'g1-1',
        url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
        caption: 'Facilitators walking participants through screen reader setup and keyboard navigation.',
        alt: 'Workshop participants gathered around laptops'
      },
      {
        id: 'g1-2',
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Collaborative digital problem solving in small supported groups.',
        alt: 'Group collaborating with tablet and notebook'
      },
      {
        id: 'g1-3',
        url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        caption: 'One-on-one technology consultation with digital inclusion specialists.',
        alt: 'Person receiving guided instruction'
      }
    ],
    feedbackActive: true,
    feedbackQuestions: [
      { id: 'q1', text: 'How would you rate the overall accessibility of this session?', type: 'rating' },
      { id: 'q2', text: 'How helpful and supportive were the facilitators?', type: 'rating' },
      { id: 'q3', text: 'Did you feel the digital tools presented were easy to practice?', type: 'choice', options: ['Very easy', 'Comfortable with guidance', 'Needs slower pace'] },
      { id: 'q4', text: 'What digital accessibility topic would you like us to cover next?', type: 'text' }
    ],
    feedbackResponses: [
      {
        id: 'resp-1',
        userName: 'Jane Doe',
        userEmail: 'jane.doe@example.com',
        rating: 5,
        answers: {
          q1: 5,
          q2: 5,
          q3: 'Very easy',
          q4: 'Would love a follow-up session on mobile screen magnifiers.'
        },
        submittedAt: '2026-10-06T11:45:00Z'
      }
    ]
  },
  {
    id: 2,
    title: 'Community Wellbeing Forum',
    date: '2026-10-18',
    endDate: '2026-10-18',
    startTime: '9:00 AM',
    endTime: '1:00 PM',
    time: '9:00 AM',
    location: 'Civic Hall, Room 2',
    venue: 'Civic Hall, Room 2',
    address: '80 Community Avenue, Central District',
    city: 'Central District',
    coordinates: { lat: 51.5150, lng: -0.1150 },
    host: 'Public Health and Wellbeing Office',
    hostDetails: {
      name: 'Public Health and Wellbeing Office',
      email: 'events@servedeserve.org',
      phone: '(555) 014-2025'
    },
    category: 'Community',
    description: 'Meet local support teams and help shape more inclusive community services.',
    longDescription: 'Friendly facilitators will guide you through every part of the session. Support people are welcome, and accessibility assistance is available on request.',
    accessibilityFeatures: ['Step-free entrance', 'Accessible parking', 'Hearing loop'],
    image: 'https://images.unsplash.com/photo-1569937747221-568961bdb039?auto=format&fit=crop&w=900&q=80',
    alt: 'People meeting at a community event',
    capacity: 50,
    remainingPlaces: 18,
    isFree: true,
    isFeatured: true,
    status: 'upcoming',
    gallery: [
      {
        id: 'g2-1',
        url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
        caption: 'Opening plenary in Civic Hall with live captioning on screen.',
        alt: 'Civic hall conference audience'
      },
      {
        id: 'g2-2',
        url: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&w=1200&q=80',
        caption: 'Breakout discussion circle with community health ambassadors.',
        alt: 'Community discussion group'
      }
    ],
    feedbackActive: false,
    feedbackQuestions: [
      { id: 'q1', text: 'How valuable was the forum in addressing your community concerns?', type: 'rating' },
      { id: 'q2', text: 'How clear was the presentation on local support services?', type: 'rating' },
      { id: 'q3', text: 'What public service needs the most improvement in your district?', type: 'text' }
    ],
    feedbackResponses: []
  },
  {
    id: 3,
    title: 'Accessible Sports Open Day',
    date: '2026-10-22',
    endDate: '2026-10-22',
    startTime: '9:30 AM',
    endTime: '3:00 PM',
    time: '9:30 AM',
    location: 'Riverside Sports Centre',
    venue: 'Riverside Sports Centre',
    address: '22 Riverside Drive, West Quarter',
    city: 'West Quarter',
    coordinates: { lat: 51.4980, lng: -0.1350 },
    host: 'Inclusive Recreation Network',
    hostDetails: {
      name: 'Inclusive Recreation Network',
      email: 'events@servedeserve.org',
      phone: '(555) 014-2025'
    },
    category: 'Recreation',
    description: 'Try adaptive activities in a welcoming environment with experienced coaches.',
    longDescription: 'Friendly facilitators will guide you through every part of the session. Support people are welcome, and accessibility assistance is available on request.',
    accessibilityFeatures: ['Step-free entrance', 'Accessible parking', 'Hearing loop'],
    image: 'https://images.unsplash.com/photo-1774050021359-e10fbd80581a?auto=format&fit=crop&w=900&q=80',
    alt: 'Wheelchair athlete participating in an outdoor race',
    capacity: 60,
    remainingPlaces: 24,
    isFree: true,
    isFeatured: true,
    status: 'upcoming',
    gallery: [
      {
        id: 'g3-1',
        url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
        caption: 'Adaptive sports demonstrations and coaching stations.',
        alt: 'Sports field with athletes'
      },
      {
        id: 'g3-2',
        url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
        caption: 'Wheelchair race finish line celebration.',
        alt: 'Athletics track event'
      }
    ],
    feedbackActive: false,
    feedbackQuestions: [
      { id: 'q1', text: 'How satisfied were you with equipment and court accessibility?', type: 'rating' },
      { id: 'q2', text: 'Would you join regular weekly adaptive recreation sessions?', type: 'choice', options: ['Definitely yes', 'Maybe', 'Prefer other activities'] }
    ],
    feedbackResponses: []
  },
  {
    id: 4,
    title: 'Assistive Technology Drop-in',
    date: '2026-10-15',
    endDate: '2026-10-15',
    startTime: '2:00 PM',
    endTime: '4:00 PM',
    time: '2:00 PM',
    location: 'Community Learning Centre',
    venue: 'Community Learning Centre',
    address: '14 Civic Way, Central District',
    city: 'Central District',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    host: 'Digital Inclusion Team',
    hostDetails: {
      name: 'Digital Inclusion Team',
      email: 'events@servedeserve.org',
      phone: '(555) 014-2025'
    },
    category: 'Workshop',
    description: 'Explore practical accessibility tools with one-to-one guidance from the digital inclusion team.',
    longDescription: 'Friendly facilitators will guide you through every part of the session. Support people are welcome, and accessibility assistance is available on request.',
    accessibilityFeatures: ['Step-free entrance', 'Accessible parking', 'Hearing loop'],
    image: 'https://images.unsplash.com/photo-1657161102089-1b13806de5f1?auto=format&fit=crop&w=900&q=80',
    alt: 'A community technology workshop in progress',
    capacity: 30,
    remainingPlaces: 8,
    isFree: true,
    isFeatured: true,
    status: 'upcoming',
    gallery: [
      {
        id: 'g4-1',
        url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        caption: 'Showcasing braille displays and alternative input devices.',
        alt: 'Assistive technology demo'
      }
    ],
    feedbackActive: false,
    feedbackQuestions: [
      { id: 'q1', text: 'Did you find an assistive technology tool suited to your needs?', type: 'choice', options: ['Yes, found great tools', 'Still exploring options', 'Need specialized assessment'] }
    ],
    feedbackResponses: []
  },
  {
    id: 99,
    title: 'Accessible Public Services Orientation',
    date: '2026-10-05',
    endDate: '2026-10-05',
    startTime: '11:00 AM',
    endTime: '1:30 PM',
    time: '11:00 AM',
    location: 'Civic Hall, Room 1',
    venue: 'Civic Hall, Room 1',
    address: '80 Community Avenue, Central District',
    city: 'Central District',
    coordinates: { lat: 51.5150, lng: -0.1150 },
    host: 'Civic Accessibility Board',
    hostDetails: {
      name: 'Civic Accessibility Board',
      email: 'access@servedeserve.org',
      phone: '(555) 014-2025'
    },
    category: 'Community',
    description: 'A community introduction to local inclusive civic initiatives, rights, and accessible resources.',
    longDescription: 'This completed orientation introduced over 40 community members to civic participation programs, transportation assistance, and accessible ballot options.',
    accessibilityFeatures: ['Step-free entrance', 'Accessible parking', 'Hearing loop', 'Sign language interpreter'],
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=900&q=80',
    alt: 'Audience listening to a speaker in civic hall',
    capacity: 45,
    remainingPlaces: 0,
    isFree: true,
    isFeatured: false,
    status: 'completed',
    gallery: [
      {
        id: 'g99-1',
        url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
        caption: 'Civic Hall stage with Auslan and sign-language interpreters during opening address.',
        alt: 'Audience listening to speaker'
      },
      {
        id: 'g99-2',
        url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
        caption: 'Community lunch and peer networking in the courtyard.',
        alt: 'Attendees sharing refreshments'
      },
      {
        id: 'g99-3',
        url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
        caption: 'Distribution of accessible government service booklets and digital guides.',
        alt: 'Resource table with printed booklets'
      },
      {
        id: 'g99-4',
        url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=80',
        caption: 'Group photo of participants, volunteers, and municipal accessibility officers.',
        alt: 'Diverse community group portrait'
      }
    ],
    feedbackActive: true,
    feedbackQuestions: [
      { id: 'q1', text: 'How well did this orientation prepare you to access municipal services?', type: 'rating' },
      { id: 'q2', text: 'Were the interpreters and accessibility materials clear and satisfactory?', type: 'rating' },
      { id: 'q3', text: 'Would you recommend this community orientation to friends or family?', type: 'choice', options: ['Yes, absolutely', 'Likely yes', 'Neutral'] },
      { id: 'q4', text: 'What additional civic resources should we prepare for upcoming sessions?', type: 'text' }
    ],
    feedbackResponses: [
      {
        id: 'resp-99-1',
        userName: 'Alex Smith',
        userEmail: 'alex.smith@example.com',
        rating: 5,
        answers: {
          q1: 5,
          q2: 5,
          q3: 'Yes, absolutely',
          q4: 'More information on accessible public transport cards would be brilliant.'
        },
        submittedAt: '2026-10-05T15:30:00Z'
      },
      {
        id: 'resp-99-2',
        userName: 'Jane Doe',
        userEmail: 'jane.doe@example.com',
        rating: 5,
        answers: {
          q1: 5,
          q2: 5,
          q3: 'Yes, absolutely',
          q4: 'Wonderful interpreters! Very welcoming environment.'
        },
        submittedAt: '2026-10-05T16:10:00Z'
      }
    ]
  }
];

const registrations = [
  {
    id: 'reg-1',
    eventId: 1,
    referenceId: 'SDS-2026-1015-01',
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    department: 'Community Volunteer',
    phone: '(555) 123-4567',
    status: 'Confirmed',
    registeredAt: '2026-10-01T10:00:00Z'
  },
  {
    id: 'reg-2',
    eventId: 2,
    referenceId: 'SDS-2026-1018-02',
    fullName: 'Alex Smith',
    email: 'alex.smith@example.com',
    department: 'Health Advocate',
    phone: '(555) 987-6543',
    status: 'Pending',
    registeredAt: '2026-10-02T14:30:00Z'
  },
  {
    id: 'reg-past-1',
    eventId: 99,
    referenceId: 'SDS-2026-1005-99',
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    department: 'Community Volunteer',
    phone: '(555) 123-4567',
    status: 'Confirmed',
    registeredAt: '2026-09-28T09:00:00Z'
  }
];

const locations = [
  {
    id: 1,
    name: 'Community Learning Centre',
    address: '14 Civic Way, Central District',
    eventsCount: 2
  },
  {
    id: 2,
    name: 'Civic Hall, Room 2',
    address: '80 Community Avenue, Central District',
    eventsCount: 2
  },
  {
    id: 3,
    name: 'Riverside Sports Centre',
    address: '22 Riverside Drive, West Quarter',
    eventsCount: 1
  }
];

const bcrypt = require('bcryptjs');

const adminUser = {
  email: 'admin@servedeserve.org',
  passwordHash: bcrypt.hashSync('admin123', 10),
  name: 'Institutional Administrator',
  role: 'admin',
  isSetupNeeded: false
};

const adminSessions = new Set();

module.exports = { events, registrations, locations, adminUser, adminSessions };
