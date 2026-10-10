// ─── ServeDeServe Design System — SVG Icons, Shared Data & Helpers ───
// Faithfully matches https://hook-atlas-30529273.figma.site/

const icons = {
  accessibility: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  calendarDays: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M8 13h.01"/><path d="M12 13h.01"/><path d="M16 13h.01"/><path d="M8 17h.01"/><path d="M12 17h.01"/><path d="M16 17h.01"/></svg>`,
  check: `<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`,
  chevronLeft: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`,
  circleCheck: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6h4"/></svg>`,
  locateFixed: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
  mapPinSolid: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/></svg>`,
  navigation: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
  search: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>`,
  shieldCheck: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
  ticketCheck: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  userRound: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`,
  x: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  externalLink: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  // Admin & UI icons
  lock: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  users: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  barChart: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  download: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  home: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  share: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  image: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  star: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starOutline: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
};

// ─── Default Mock Events from Figma ───
const figmaEvents = [
  {
    id: 1,
    title: 'Inclusive Digital Skills Workshop',
    date: '2026-10-15',
    startTime: '10:00 AM',
    endTime: '1:00 PM',
    location: 'Community Learning Centre',
    address: '14 Civic Way, Central District',
    host: 'Community Support Team',
    category: 'Workshop',
    description: 'Build confidence using everyday digital tools with guided, accessible support.',
    image: 'https://images.unsplash.com/photo-1657161102089-1b13806de5f1?auto=format&fit=crop&w=900&q=80',
    alt: 'A speaker leading a seated community workshop',
    capacity: 25,
    remainingPlaces: 12,
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
    ]
  },
  {
    id: 2,
    title: 'Community Wellbeing Forum',
    date: '2026-10-18',
    startTime: '9:00 AM',
    endTime: '1:00 PM',
    location: 'Civic Hall, Room 2',
    address: '80 Community Avenue, Central District',
    host: 'Public Health and Wellbeing Office',
    category: 'Community',
    description: 'Meet local support teams and help shape more inclusive community services.',
    image: 'https://images.unsplash.com/photo-1569937747221-568961bdb039?auto=format&fit=crop&w=900&q=80',
    alt: 'People meeting at a community event',
    capacity: 50,
    remainingPlaces: 18,
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
    ]
  },
  {
    id: 3,
    title: 'Accessible Sports Open Day',
    date: '2026-10-22',
    startTime: '9:30 AM',
    endTime: '3:00 PM',
    location: 'Riverside Sports Centre',
    address: '22 Riverside Drive, West Quarter',
    host: 'Inclusive Recreation Network',
    category: 'Recreation',
    description: 'Try adaptive activities in a welcoming environment with experienced coaches.',
    image: 'https://images.unsplash.com/photo-1774050021359-e10fbd80581a?auto=format&fit=crop&w=900&q=80',
    alt: 'Wheelchair athlete participating in an outdoor race',
    capacity: 60,
    remainingPlaces: 24,
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
    ]
  },
  {
    id: 4,
    title: 'Assistive Technology Drop-in',
    date: '2026-10-15',
    startTime: '2:00 PM',
    endTime: '4:00 PM',
    location: 'Community Learning Centre',
    address: '14 Civic Way, Central District',
    host: 'Digital Inclusion Team',
    category: 'Workshop',
    description: 'Explore practical accessibility tools with one-to-one guidance from the digital inclusion team.',
    image: 'https://images.unsplash.com/photo-1657161102089-1b13806de5f1?auto=format&fit=crop&w=900&q=80',
    alt: 'A community technology workshop in progress',
    capacity: 30,
    remainingPlaces: 8,
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
    ]
  },
  {
    id: 99,
    title: 'Accessible Public Services Orientation',
    date: '2026-10-05',
    startTime: '11:00 AM',
    endTime: '1:30 PM',
    location: 'Civic Hall, Room 1',
    address: '80 Community Avenue, Central District',
    host: 'Civic Accessibility Board',
    category: 'Community',
    description: 'A community introduction to local inclusive civic initiatives, rights, and accessible resources.',
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=900&q=80',
    alt: 'Audience listening to a speaker in civic hall',
    capacity: 45,
    remainingPlaces: 0,
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
    ]
  }
];

// Helper: Format Date string YYYY-MM-DD
function formatDate(dateStr, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', options).format(new Date(y, m - 1, d));
}

// Helper: Format Time string
function formatTimeRange(event) {
  if (!event) return '';
  const start = event.startTime || event.time || '';
  const end = event.endTime || '';
  return end ? `${start} – ${end}` : start;
}

// Helper: Format Short Date (for admin tables and lists)
function formatDateShort(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper: Render Status Pill
function renderStatus(status = '') {
  const s = String(status).toLowerCase();
  let cls = 'status--confirmed';
  if (s.includes('pend') || s.includes('review')) cls = 'status--pending';
  else if (s.includes('canc')) cls = 'status--cancelled';
  else if (s.includes('prog')) cls = 'status--in-progress';
  return `<span class="status ${cls}"><span class="status__dot" aria-hidden="true"></span>${status}</span>`;
}

// Helper: API Fetch with Role Guard & Admin Token
async function api(url, options = {}) {
  try {
    const role = sessionStorage.getItem('sds-active-role') || 'guest';
    const adminToken = sessionStorage.getItem('adminToken') || '';
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-role': role,
        'x-admin-role': role === 'admin' ? 'admin' : '',
        'x-admin-token': adminToken,
        ...options.headers
      },
      ...options
    });
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: err.message };
  }
}

// ─── Authentication & Access Control Guard ───
function requireAdminAuth() {
  const activeRole = sessionStorage.getItem('sds-active-role');
  const adminUser = sessionStorage.getItem('adminUser');
  const adminToken = sessionStorage.getItem('adminToken');

  if (activeRole !== 'admin' || !adminUser || !adminToken) {
    const renderDenied = () => {
      const appEl = document.getElementById('app') || document.body;
      if (appEl) {
        appEl.innerHTML = `
          <div class="access-denied-shell">
            <div class="access-denied-card">
              <div class="denied-icon-wrap">
                ${icons.lock}
              </div>
              <span class="denied-badge">${icons.shieldCheck} RESTRICTED AREA</span>
              <h1 style="font-size:1.85rem;margin:0 0 10px;color:var(--text);">Access Denied</h1>
              <p style="font-size:1.05rem;font-weight:700;color:#991b1b;margin:0 0 12px;">
                Regular users cannot access the administrator portal.
              </p>
              <p style="color:var(--text-2);font-size:0.95rem;line-height:1.6;margin:0 0 28px;">
                ${activeRole === 'user'
                  ? 'You are currently signed in with a <strong>Community User</strong> account. Only verified administrative staff can access this section to manage events, photo galleries, and attendee feedback.'
                  : 'You are not signed in. Please sign in with an authorized Administrator account to continue.'
                }
              </p>
              <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                <a href="/events" class="button button--primary" style="padding:12px 22px;text-decoration:none;">
                  ${icons.arrowLeft} Return to User Event Portal
                </a>
                <a href="/admin/login" class="button button--secondary" style="padding:12px 22px;text-decoration:none;">
                  ${icons.lock} Sign In as Administrator
                </a>
              </div>
            </div>
          </div>
        `;
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderDenied);
    } else {
      renderDenied();
    }
    return false;
  }
  return true;
}

// ─── Header Helper (for standalone / login pages) ───
function renderHeader(activePage = '') {
  const isAdmin = sessionStorage.getItem('sds-active-role') === 'admin' && sessionStorage.getItem('adminToken');

  return `
    <header class="site-header">
      <div class="topline">A unified platform for accessible public services</div>
      <div class="nav-shell">
        <a href="/" class="brand" aria-label="ServeDeServe Event Portal home">
          <span class="brand__mark" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          <span>
            <strong>ServeDeServe</strong>
            <small>Services that serve everyone</small>
          </span>
        </a>
        <button class="menu-button" onclick="toggleMobileMenu()" aria-label="Toggle menu">
          ${icons.menu} <span>Menu</span>
        </button>
        <nav class="main-nav" id="mainNav">
          <a href="/events" class="${activePage === 'events' ? 'active' : ''}">Home</a>
          <a href="/events" class="${activePage === 'portal' ? 'active' : ''}">Event portal</a>
          <a href="/gallery" class="${activePage === 'gallery' ? 'active' : ''}">Gallery</a>
          <a href="/registrations" class="${activePage === 'registrations' ? 'active' : ''}">My registrations</a>
          <a href="/events" onclick="window.sessionStorage.setItem('openHelp','1')">Help &amp; support</a>
          <button class="a11y-button" onclick="toggleA11yPanel()">
            ${icons.accessibility} Accessibility
          </button>
          <a href="/admin/login" class="profile-button" id="navAdminBtn" style="text-decoration:none;cursor:pointer;font-weight:700;" title="Sign in as Admin with pre-seeded demo credentials">
            ${icons.lock} Sign in as Admin
          </a>
        </nav>
      </div>
    </header>
  `;
}

// Global Demo Admin 1-Click Login Handler
async function handleDemoAdminSignIn() {
  const btns = document.querySelectorAll('.profile-button, #navAdminBtn');
  btns.forEach(b => {
    b.disabled = true;
    b.innerHTML = `${icons.lock} Signing in...`;
  });

  try {
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@servedeserve.org', password: 'admin123' })
    });

    if (data.success && data.token) {
      sessionStorage.setItem('adminToken', data.token);
      sessionStorage.setItem('adminUser', JSON.stringify(data.user));
      sessionStorage.setItem('sds-active-role', 'admin');
      window.location.href = '/admin';
    } else {
      alert(data.message || 'Demo admin sign in failed');
      btns.forEach(b => {
        b.disabled = false;
        b.innerHTML = `${icons.lock} Sign in as Admin`;
      });
    }
  } catch (err) {
    alert('Failed to connect to server for admin login');
    btns.forEach(b => {
      b.disabled = false;
      b.innerHTML = `${icons.lock} Sign in as Admin`;
    });
  }
}

// ─── Footer Helper ───
function renderFooter() {
  return `
    <footer class="footer">
      <div>
        <a href="/" class="brand brand--footer">
          <span class="brand__mark">
            <span></span><span></span><span></span>
          </span>
          <span>
            <strong>ServeDeServe</strong>
            <small>Services that serve everyone</small>
          </span>
        </a>
        <p>Accessible events and opportunities — all in one place.</p>
      </div>
      <div>
        <strong>Event portal</strong>
        <a href="/events">Discover events</a>
        <a href="/registrations">My registrations</a>
      </div>
      <div>
        <strong>Support</strong>
        <a href="/events" onclick="window.sessionStorage.setItem('openHelp','1')">Help centre</a>
        <button onclick="toggleA11yPanel()" style="background:none;border:none;cursor:pointer;color:inherit;font:inherit;padding:0;">Accessibility</button>
      </div>
      <div>
        <strong>Contact</strong>
        <span>(555) 014-2025</span>
        <span>support@servedeserve.org</span>
      </div>
      <small class="footer__base">© 2026 ServeDeServe · Privacy · Terms · Accessibility statement</small>
    </footer>
  `;
}

// ─── Accessibility Panel Helper ───
function renderA11yPanel() {
  const textSize = Number(localStorage.getItem('sds-text-size')) || 100;
  const highContrast = localStorage.getItem('sds-contrast') === 'true';
  const reduceMotion = localStorage.getItem('sds-motion') === 'true';

  return `
    <button class="scrim" id="a11yScrim" onclick="toggleA11yPanel()" aria-label="Close panel" style="display:none;"></button>
    <aside class="a11y-panel" id="a11yPanel" role="dialog" aria-label="Accessibility settings" style="display:none;">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Your preferences</p>
          <h2>Accessibility settings</h2>
        </div>
        <button class="icon-button" onclick="toggleA11yPanel()" aria-label="Close settings">
          ${icons.x}
        </button>
      </div>
      <div class="setting-row">
        <div>
          <strong>Text size</strong>
          <span id="sharedTextSizeLabel">Currently ${textSize === 100 ? 'normal' : textSize + '%'}</span>
        </div>
        <div class="segmented" aria-label="Change text size">
          <button onclick="adjustFontSize(-10)" aria-label="Decrease text size">A−</button>
          <button onclick="adjustFontSize(10)" aria-label="Increase text size">A+</button>
        </div>
      </div>
      <div class="setting-row">
        <div>
          <strong>High contrast</strong>
          <span>Increase visual contrast</span>
        </div>
        <button class="toggle ${highContrast ? 'is-on' : ''}" id="sharedContrastToggle" onclick="toggleContrast()">
          <span aria-hidden="true"></span>
          <span id="sharedContrastLabel">${highContrast ? 'On' : 'Off'}</span>
        </button>
      </div>
      <div class="setting-row">
        <div>
          <strong>Reduce motion</strong>
          <span>Limit interface movement</span>
        </div>
        <button class="toggle ${reduceMotion ? 'is-on' : ''}" id="sharedMotionToggle" onclick="toggleMotion()">
          <span aria-hidden="true"></span>
          <span id="sharedMotionLabel">${reduceMotion ? 'On' : 'Off'}</span>
        </button>
      </div>
      <button class="button button--secondary" onclick="resetA11y()" style="width:100%;margin-top:24px;">Reset all settings</button>
      <p class="panel-note">
        ${icons.shieldCheck} Preferences are saved on this device.
      </p>
    </aside>
  `;
}

// ─── Admin Sidebar Helper ───
function renderAdminSidebar(activeItem = 'dashboard') {
  let adminName = 'Administrator';
  let adminEmail = 'admin@servedeserve.org';
  try {
    const raw = sessionStorage.getItem('adminUser');
    if (raw) {
      const u = JSON.parse(raw);
      if (u.name) adminName = u.name;
      if (u.email) adminEmail = u.email;
    }
  } catch (err) {}

  const initials = adminName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('') || 'AD';

  return `
    <aside class="sidebar" role="navigation" aria-label="Admin sidebar">
      <a href="/" class="brand" style="margin-bottom:28px;">
        <span class="brand__mark" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
        <span>
          <strong>ServeDeServe</strong>
          <small>ADMINISTRATOR</small>
        </span>
      </a>
      <p class="eyebrow" style="margin-bottom:12px;">Portal Admin</p>
      <nav>
        <a href="/admin" class="${activeItem === 'dashboard' ? 'active' : ''}">
          ${icons.barChart} Dashboard
        </a>
        <a href="/admin/events" class="${activeItem === 'events' ? 'active' : ''}">
          ${icons.calendar} Manage Events &amp; Gallery
        </a>
        <a href="/admin/events/create" class="${activeItem === 'create' ? 'active' : ''}">
          ${icons.plus} Create Event
        </a>
        <a href="/admin/registrations" class="${activeItem === 'registrations' ? 'active' : ''}">
          ${icons.ticketCheck} Registrations
        </a>
        <a href="/events" style="margin-top:16px;">
          ${icons.arrowLeft} View User Portal
        </a>
      </nav>
      <div class="sidebar-user">
        <span aria-hidden="true">${initials}</span>
        <div style="overflow:hidden;flex:1;min-width:0;">
          <strong style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;" title="${adminName}">${adminName}</strong>
          <small style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;" title="${adminEmail}">${adminEmail}</small>
        </div>
        <button onclick="handleLogout()" title="Log out" style="background:none;border:none;cursor:pointer;margin-left:auto;color:inherit;opacity:0.75;padding:4px;">
          ${icons.x}
        </button>
      </div>
    </aside>
  `;
}

function handleLogout() {
  api('/api/admin/logout', { method: 'POST' }).catch(() => {});
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('adminUser');
  sessionStorage.removeItem('sds-active-role');
  window.location.href = '/admin/login';
}

// ─── Global Accessibility Toggles ───
function toggleMobileMenu() {
  const m = document.getElementById('mainNav');
  if (m) m.classList.toggle('is-open');
}

function toggleA11yPanel(force) {
  if (window.__SDS_APP__ && typeof window.__SDS_APP__.toggleA11y === 'function') {
    window.__SDS_APP__.toggleA11y(force);
    return;
  }
  const panel = document.getElementById('a11yPanel');
  const scrim = document.getElementById('a11yScrim');
  if (panel && scrim) {
    const isShowing = panel.style.display !== 'none';
    const next = typeof force === 'boolean' ? force : !isShowing;
    panel.style.display = next ? 'flex' : 'none';
    scrim.style.display = next ? 'block' : 'none';
  }
}

function adjustFontSize(delta) {
  let size = Number(localStorage.getItem('sds-text-size')) || 100;
  size = Math.max(90, Math.min(130, size + delta));
  localStorage.setItem('sds-text-size', String(size));
  document.documentElement.style.fontSize = `${size}%`;
  const lbl = document.getElementById('sharedTextSizeLabel');
  if (lbl) lbl.textContent = `Currently ${size === 100 ? 'normal' : size + '%'}`;
}

function toggleContrast() {
  let c = localStorage.getItem('sds-contrast') === 'true';
  c = !c;
  localStorage.setItem('sds-contrast', String(c));
  document.documentElement.classList.toggle('high-contrast', c);
  const btn = document.getElementById('sharedContrastToggle');
  const lbl = document.getElementById('sharedContrastLabel');
  if (btn) btn.classList.toggle('is-on', c);
  if (lbl) lbl.textContent = c ? 'On' : 'Off';
}

function toggleMotion() {
  let m = localStorage.getItem('sds-motion') === 'true';
  m = !m;
  localStorage.setItem('sds-motion', String(m));
  document.documentElement.classList.toggle('reduce-motion', m);
  const btn = document.getElementById('sharedMotionToggle');
  const lbl = document.getElementById('sharedMotionLabel');
  if (btn) btn.classList.toggle('is-on', m);
  if (lbl) lbl.textContent = m ? 'On' : 'Off';
}

function resetA11y() {
  localStorage.setItem('sds-text-size', '100');
  localStorage.setItem('sds-contrast', 'false');
  localStorage.setItem('sds-motion', 'false');
  document.documentElement.style.fontSize = '100%';
  document.documentElement.classList.remove('high-contrast');
  document.documentElement.classList.remove('reduce-motion');
  const lbl = document.getElementById('sharedTextSizeLabel');
  if (lbl) lbl.textContent = 'Currently normal';
  const cBtn = document.getElementById('sharedContrastToggle');
  const cLbl = document.getElementById('sharedContrastLabel');
  if (cBtn) cBtn.classList.remove('is-on');
  if (cLbl) cLbl.textContent = 'Off';
  const mBtn = document.getElementById('sharedMotionToggle');
  const mLbl = document.getElementById('sharedMotionLabel');
  if (mBtn) mBtn.classList.remove('is-on');
  if (mLbl) mLbl.textContent = 'Off';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const size = Number(localStorage.getItem('sds-text-size')) || 100;
  const contrast = localStorage.getItem('sds-contrast') === 'true';
  const motion = localStorage.getItem('sds-motion') === 'true';
  if (size !== 100) document.documentElement.style.fontSize = `${size}%`;
  if (contrast) document.documentElement.classList.add('high-contrast');
  if (motion) document.documentElement.classList.add('reduce-motion');
});
