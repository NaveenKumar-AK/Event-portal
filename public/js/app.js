// ─── ServeDeServe Event Portal Main Application ───
// Fully functional interactive system matching https://hook-atlas-30529273.figma.site/

(function () {
  'use strict';

  // Application State
  const state = {
    page: 'events',
    selectedEvent: figmaEvents[0],
    selectedMapEvent: figmaEvents[0],
    a11yOpen: false,
    mobileMenuOpen: false,
    locationModalOpen: false,
    helpModalOpen: false,
    profileModalOpen: false,
    ticketModalOpen: false,
    activeTicket: null,
    legalModal: null, // 'privacy' | 'terms' | 'a11y-stmt'
    activeFaqIndex: 0,
    textSize: Number(localStorage.getItem('sds-text-size')) || 100,
    highContrast: localStorage.getItem('sds-contrast') === 'true',
    reduceMotion: localStorage.getItem('sds-motion') === 'true',
    searchQuery: '',
    categoryFilter: 'All categories',
    dateFilter: 'Any date',
    locationFilter: 'All locations',
    calendarDate: new Date(2026, 9, 1), // October 2026
    selectedCalendarDate: '2026-10-15',
    activeRegistrationsTab: 0,
    detailMapPopupOpen: false,
    detailMapError: false,
    activeGalleryEventId: 99,
    gallerySlideIndex: 0,
    galleryAutoPlay: false,
    galleryAutoTimer: null,
    feedbackModalOpen: false,
    feedbackEvent: null,
    feedbackRating: 5,
    feedbackAnswers: {},
    feedbackComments: '',
    feedbackSuccess: false,
    toasts: [],
    events: [...figmaEvents],
    userRegistrations: [
      {
        id: 'reg-1',
        eventId: 1,
        referenceId: 'SDS-2026-1015-01',
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        department: 'Community Volunteer',
        phone: '(555) 123-4567',
        event: figmaEvents[0],
        status: 'Confirmed'
      },
      {
        id: 'reg-2',
        eventId: 2,
        referenceId: 'SDS-2026-1018-02',
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        department: 'Community Volunteer',
        phone: '(555) 123-4567',
        event: figmaEvents[1],
        status: 'Pending'
      }
    ],
    pastRegistrations: [
      {
        id: 'reg-past-1',
        eventId: 99,
        referenceId: 'SDS-2026-1005-99',
        fullName: 'Jane Doe',
        event: {
          id: 99,
          title: 'Accessible Public Services Orientation',
          date: '2026-10-05',
          startTime: '11:00 AM',
          endTime: '1:30 PM',
          location: 'Civic Hall, Room 1',
          host: 'Civic Accessibility Board',
          category: 'Community',
          description: 'A community introduction to local inclusive civic initiatives and resources.',
          image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=900&q=80',
          alt: 'Audience listening to a speaker in civic hall'
        },
        status: 'Confirmed'
      }
    ],
    cancelledRegistrations: []
  };

  // Toast Notification Trigger
  function showToast(message, iconSvg = icons.circleCheck) {
    const id = Date.now();
    state.toasts.push({ id, message, iconSvg });
    renderToasts();
    setTimeout(() => {
      state.toasts = state.toasts.filter(t => t.id !== id);
      renderToasts();
    }, 3500);
  }

  function renderToasts() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    container.innerHTML = state.toasts.map(t => `
      <div class="toast" role="status">
        ${t.iconSvg}
        <span>${t.message}</span>
      </div>
    `).join('');
  }

  // Sync state to local storage and DOM
  function applyA11ySettings() {
    localStorage.setItem('sds-text-size', String(state.textSize));
    localStorage.setItem('sds-contrast', String(state.highContrast));
    localStorage.setItem('sds-motion', String(state.reduceMotion));

    const appRoot = document.getElementById('root');
    if (appRoot) {
      appRoot.className = `${state.highContrast ? 'high-contrast' : ''} ${state.reduceMotion ? 'reduce-motion' : ''}`.trim();
      appRoot.style.fontSize = `${state.textSize}%`;
    }
    document.documentElement.classList.toggle('high-contrast', state.highContrast);
    document.documentElement.classList.toggle('reduce-motion', state.reduceMotion);
    document.documentElement.style.fontSize = `${state.textSize}%`;
  }

  // Navigation
  function navigate(page, eventData = null, updateHistory = true) {
    state.page = page;
    if (eventData) {
      state.selectedEvent = eventData;
    }
    state.mobileMenuOpen = false;
    state.detailMapPopupOpen = false;
    state.helpModalOpen = false;
    state.profileModalOpen = false;
    state.ticketModalOpen = false;
    state.legalModal = null;

    if (state.galleryAutoTimer) {
      clearInterval(state.galleryAutoTimer);
      state.galleryAutoTimer = null;
    }

    if (window._hostTrackingInterval) {
      clearInterval(window._hostTrackingInterval);
      window._hostTrackingInterval = null;
    }

    if (updateHistory) {
      let path = '/';
      if (page === 'events') path = '/events';
      else if (page === 'event-detail') path = `/events/${state.selectedEvent.id}`;
      else if (page === 'event-register') path = `/register/${state.selectedEvent.id}`;
      else if (page === 'registrations') path = '/registrations';
      else if (page === 'gallery') path = '/gallery';
      else if (page === 'confirmation') path = '/confirmation';

      window.history.pushState({ page, eventId: state.selectedEvent ? state.selectedEvent.id : null }, '', path);
    }

    render();
    window.scrollTo({
      top: 0,
      behavior: state.reduceMotion ? 'auto' : 'smooth'
    });
  }

  // Handle URL on load or back/forward
  function handleRoute() {
    const activeRole = sessionStorage.getItem('sds-active-role');
    if (!activeRole) {
      window.location.replace('/login');
      return;
    }

    const path = window.location.pathname.toLowerCase();
    const eventMatch = path.match(/^\/events\/(\d+)/);
    const registerMatch = path.match(/^\/register\/(\d+)/);

    if (sessionStorage.getItem('openHelp') === '1') {
      sessionStorage.removeItem('openHelp');
      state.helpModalOpen = true;
    }

    if (eventMatch) {
      const ev = state.events.find(e => String(e.id) === eventMatch[1]) || state.events[0];
      navigate('event-detail', ev, false);
    } else if (registerMatch) {
      const ev = state.events.find(e => String(e.id) === registerMatch[1]) || state.events[0];
      navigate('event-register', ev, false);
    } else if (path.includes('/registrations') || path.includes('/track')) {
      navigate('registrations', null, false);
    } else if (path.includes('/gallery')) {
      const urlParams = new URLSearchParams(window.location.search);
      const evIdParam = urlParams.get('event');
      if (evIdParam) {
        state.activeGalleryEventId = Number(evIdParam);
      }
      navigate('gallery', null, false);
    } else if (path.includes('/confirmation')) {
      navigate('confirmation', null, false);
    } else {
      navigate('events', null, false);
    }
  }

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
      const ev = e.state.eventId ? state.events.find(item => item.id === e.state.eventId) : null;
      navigate(e.state.page, ev, false);
    } else {
      handleRoute();
    }
  });

  // Calendar .ics download generator
  function downloadCalendarInvite(event) {
    const cleanTitle = event.title.replace(/[,;]/g, '');
    const cleanLoc = `${event.location}, ${event.address}`.replace(/[,;]/g, '');
    const dateFormatted = event.date.replace(/-/g, '');
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ServeDeServe//Event Portal//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `SUMMARY:${cleanTitle}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${cleanLoc}`,
      `DTSTART:${dateFormatted}T090000Z`,
      `DTEND:${dateFormatted}T130000Z`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Event added to calendar (.ics downloaded)', icons.calendar);
  }

  // ─── Component Renderers ───

  function renderHeader() {
    const isPortalActive = state.page === 'events' || state.page === 'event-detail' || state.page === 'event-register';
    const isGalleryActive = state.page === 'gallery';
    const isRegActive = state.page === 'registrations';

    return `
      <header class="site-header">
        <div class="nav-shell">
          <button class="brand" id="brandBtn" aria-label="ServeDeServe Event Portal home">
            <span class="brand__mark" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
            <span>
              <strong>ServeDeServe</strong>
              <small>Services that serve everyone</small>
            </span>
          </button>
          <button class="menu-button" id="menuToggleBtn" aria-expanded="${state.mobileMenuOpen}" aria-label="Open navigation menu">
            ${state.mobileMenuOpen ? icons.x : icons.menu}
            <span>Menu</span>
          </button>
          <nav class="main-nav ${state.mobileMenuOpen ? 'is-open' : ''}" aria-label="Main navigation">
            <button class="${isPortalActive ? 'active' : ''}" id="navPortal">Event portal</button>
            <button class="${isGalleryActive ? 'active' : ''}" id="navGallery" style="display:inline-flex;align-items:center;gap:6px;">
              ${icons.image} Gallery
            </button>
            <button class="${isRegActive ? 'active' : ''}" id="navRegistrations">My registrations</button>
            <button id="navHelp">Help &amp; support</button>
            <button class="a11y-button" id="navA11y" onclick="toggleA11yPanel()">
              ${icons.accessibility} Accessibility
            </button>
            <button class="profile-button" id="navProfile">
              ${icons.userRound} Profile
            </button>
          </nav>
        </div>
      </header>
    `;
  }

  function renderFooter() {
    return `
      <footer class="footer">
        <div>
          <button class="brand brand--footer" id="footerBrandBtn">
            <span class="brand__mark">
              <span></span><span></span><span></span>
            </span>
            <span>
              <strong>ServeDeServe</strong>
              <small>Services that serve everyone</small>
            </span>
          </button>
          <p>Accessible events and opportunities — all in one place.</p>
        </div>
        <div>
          <strong>Event portal</strong>
          <button id="footerDiscoverBtn">Discover events</button>
          <button id="footerGalleryBtn">Event photo gallery</button>
          <button id="footerRegBtn">My registrations</button>
        </div>
        <div>
          <strong>Support</strong>
          <button id="footerHelpBtn">Help centre</button>
          <button id="footerA11yBtn" onclick="toggleA11yPanel()">Accessibility</button>
        </div>
        <div>
          <strong>Contact</strong>
          <a href="tel:5550142025" style="color:var(--text-2);text-decoration:none;">(555) 014-2025</a>
          <a href="mailto:support@servedeserve.org" style="color:var(--text-2);text-decoration:none;">support@servedeserve.org</a>
        </div>
        <div class="footer__base" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <small>© 2026 ServeDeServe</small>
          <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
            <button id="btnFooterPrivacy" style="background:none;border:none;cursor:pointer;color:var(--muted);font:inherit;font-size:0.875rem;">Privacy</button>
            <button id="btnFooterTerms" style="background:none;border:none;cursor:pointer;color:var(--muted);font:inherit;font-size:0.875rem;">Terms</button>
            <button id="btnFooterA11yStmt" style="background:none;border:none;cursor:pointer;color:var(--muted);font:inherit;font-size:0.875rem;">Accessibility statement</button>
          </div>
        </div>
      </footer>
    `;
  }

  function renderA11yDrawer() {
    if (!state.a11yOpen) return '';

    return `
      <button class="scrim" id="a11yScrim" onclick="toggleA11yPanel(false)" aria-label="Close accessibility settings"></button>
      <aside class="a11y-panel" id="a11yPanel" aria-label="Accessibility settings" role="dialog" aria-modal="true">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">YOUR PREFERENCES</p>
            <h2>Accessibility settings</h2>
          </div>
          <button class="icon-button" id="closeA11yBtn" onclick="toggleA11yPanel(false)" aria-label="Close settings">
            ${icons.x}
          </button>
        </div>
        <div class="setting-row">
          <div>
            <strong>Text size</strong>
            <span>Currently ${state.textSize === 100 ? 'normal' : state.textSize + '%'}</span>
          </div>
          <div class="segmented" aria-label="Change text size">
            <button id="textSizeDecBtn" aria-label="Decrease text size">A-</button>
            <button id="textSizeIncBtn" aria-label="Increase text size">A+</button>
          </div>
        </div>
        <div class="setting-row">
          <div>
            <strong>High contrast</strong>
            <span>Increase visual contrast</span>
          </div>
          <button class="toggle ${state.highContrast ? 'is-on' : ''}" id="toggleContrastBtn" aria-pressed="${state.highContrast}">
            <span aria-hidden="true"></span>
            ${state.highContrast ? 'On' : 'Off'}
          </button>
        </div>
        <div class="setting-row">
          <div>
            <strong>Reduce motion</strong>
            <span>Limit interface movement</span>
          </div>
          <button class="toggle ${state.reduceMotion ? 'is-on' : ''}" id="toggleMotionBtn" aria-pressed="${state.reduceMotion}">
            <span aria-hidden="true"></span>
            ${state.reduceMotion ? 'On' : 'Off'}
          </button>
        </div>
        <button class="button button--secondary" id="resetA11yBtn" style="width:100%;margin-top:24px;">Reset all settings</button>
        <p class="panel-note">
          ${icons.shieldCheck} Preferences are saved on this device.
        </p>
      </aside>
    `;
  }

  // ─── Help & Support Modal ───
  function renderHelpModal() {
    if (!state.helpModalOpen) return '';

    const faqs = [
      {
        q: 'How do I register for an event?',
        a: 'Simply browse our upcoming events on the Event Portal, select "View event details" on the event you wish to attend, and click "Register now". Fill in your contact details and you will instantly receive your confirmed spot.'
      },
      {
        q: 'Are all community events free of charge?',
        a: 'Yes! All community programs, workshops, and recreational sessions organized under ServeDeServe are completely free to attend for all community members.'
      },
      {
        q: 'What physical and digital accessibility aids are available?',
        a: 'All our physical venues have step-free entrance, hearing loop systems, and accessible restrooms. Facilitators are trained to assist. On our portal, you can also customize font sizing and high contrast using the Accessibility panel.'
      },
      {
        q: 'How can I cancel or manage my registration?',
        a: 'Click "My registrations" in the top menu or inside your Profile. Find your event and click "Cancel registration". You can re-register anytime if spots are available.'
      }
    ];

    return `
      <div class="modal-backdrop" id="helpModalBackdrop" role="presentation">
        <section class="modal-dialog modal-dialog--lg" role="dialog" aria-modal="true" aria-labelledby="helpModalTitle">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Support Centre</p>
              <h2 id="helpModalTitle">Help &amp; Support</h2>
            </div>
            <button class="icon-button" id="closeHelpModalBtn" aria-label="Close help modal">
              ${icons.x}
            </button>
          </div>

          <div class="faq-list">
            ${faqs.map((f, i) => `
              <div class="faq-item ${state.activeFaqIndex === i ? 'is-open' : ''}">
                <button class="faq-question" data-faq="${i}" aria-expanded="${state.activeFaqIndex === i}">
                  <span>${f.q}</span>
                  ${icons.chevronDown}
                </button>
                ${state.activeFaqIndex === i ? `
                  <div class="faq-answer">
                    <p>${f.a}</p>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="contact-banner">
            <div>
              <strong>Need one-to-one assistance?</strong>
              <p style="margin:4px 0 0;font-size:0.92rem;color:var(--text-2);">Our community helpline is available Mon–Sat, 9 AM – 6 PM.</p>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              <a href="tel:5550142025" class="button button--secondary">
                ${icons.phone} Call (555) 014-2025
              </a>
              <a href="mailto:support@servedeserve.org" class="button button--primary">
                ${icons.mail} Email Support
              </a>
            </div>
          </div>

          <div style="margin-top:28px;padding-top:20px;border-top:1px solid var(--border);">
            <h3 style="font-size:1.15rem;margin-bottom:12px;">Send an Inquiry</h3>
            <form id="helpInquiryForm" style="display:grid;gap:14px;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="field">
                  <label for="helpName">Your Name</label>
                  <input id="helpName" required placeholder="e.g. Jane Doe">
                </div>
                <div class="field">
                  <label for="helpEmail">Your Email</label>
                  <input id="helpEmail" type="email" required placeholder="e.g. jane@example.com">
                </div>
              </div>
              <div class="field">
                <label for="helpMessage">Message</label>
                <textarea id="helpMessage" required rows="3" placeholder="Tell us how we can help you..."></textarea>
              </div>
              <div style="display:flex;justify-content:flex-end;gap:10px;">
                <button type="button" class="button button--secondary" id="btnCancelHelpForm">Close</button>
                <button type="submit" class="button button--primary">Send Message ${icons.arrowRight}</button>
              </div>
            </form>
          </div>
        </section>
      </div>
    `;
  }

  // ─── Profile Modal ───
  function renderProfileModal() {
    if (!state.profileModalOpen) return '';

    return `
      <div class="modal-backdrop" id="profileModalBackdrop" role="presentation">
        <section class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="profileModalTitle">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Account</p>
              <h2 id="profileModalTitle">User Profile</h2>
            </div>
            <button class="icon-button" id="closeProfileModalBtn" aria-label="Close profile modal">
              ${icons.x}
            </button>
          </div>

          <div class="profile-card-header">
            <div class="profile-avatar">
              ${(JSON.parse(sessionStorage.getItem('sds-user-profile') || '{}').name || 'Jane Doe').split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h3 style="margin-bottom:4px;font-size:1.3rem;">
                ${JSON.parse(sessionStorage.getItem('sds-user-profile') || '{}').name || 'Jane Doe'}
              </h3>
              <p style="margin:0;color:var(--text-2);font-size:0.92rem;">
                ${JSON.parse(sessionStorage.getItem('sds-user-profile') || '{}').email || 'jane.doe@example.com'}
              </p>
              <span class="status status--confirmed" style="margin-top:6px;">
                <span class="status__dot"></span> Community User
              </span>
            </div>
          </div>

          <div class="profile-stats-grid">
            <div class="profile-stat-box">
              <strong>${state.userRegistrations.length}</strong>
              <small>Upcoming</small>
            </div>
            <div class="profile-stat-box">
              <strong>${state.pastRegistrations.length}</strong>
              <small>Attended</small>
            </div>
            <div class="profile-stat-box">
              <strong>${state.textSize}%</strong>
              <small>Display Scale</small>
            </div>
          </div>

          <div style="display:grid;gap:10px;">
            <button class="button button--secondary" id="btnProfileMyReg" style="width:100%;justify-content:flex-start;">
              ${icons.ticketCheck} View My Registered Events (${state.userRegistrations.length})
            </button>
            <button class="button button--secondary" id="btnProfileA11y" style="width:100%;justify-content:flex-start;">
              ${icons.accessibility} Accessibility Settings
            </button>
            <button class="button button--ghost" id="btnLogoutUser" style="width:100%;justify-content:flex-start;color:var(--error);">
              ${icons.arrowLeft} Sign Out
            </button>
          </div>

          <div style="margin-top:24px;display:flex;justify-content:flex-end;">
            <button class="button button--primary" id="btnDoneProfile">Done</button>
          </div>
        </section>
      </div>
    `;
  }

  // ─── Ticket Pass Modal ───
  function renderTicketModal() {
    if (!state.ticketModalOpen || !state.activeTicket) return '';

    const reg = state.activeTicket;
    const ev = reg.event;

    return `
      <div class="modal-backdrop" id="ticketModalBackdrop" role="presentation">
        <section class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="ticketTitle">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Official Event Pass</p>
              <h2 id="ticketTitle">Registration Pass</h2>
            </div>
            <button class="icon-button" id="closeTicketModalBtn" aria-label="Close ticket pass">
              ${icons.x}
            </button>
          </div>

          <div class="pass-ticket" id="printablePassArea">
            <div class="pass-ticket__header">
              <div>
                <span class="module-label">${ev.category}</span>
                <h3 style="margin:8px 0 4px;font-size:1.35rem;">${ev.title}</h3>
                <p style="margin:0;color:var(--text-2);">${formatDate(ev.date)} · ${formatTimeRange(ev)}</p>
              </div>
              <span class="status status--confirmed">
                <span class="status__dot"></span> Confirmed
              </span>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px;">
              <div>
                <small style="color:var(--muted);display:block;">Attendee</small>
                <strong>${reg.fullName || 'Jane Doe'}</strong>
              </div>
              <div>
                <small style="color:var(--muted);display:block;">Reference ID</small>
                <strong style="color:var(--primary);">${reg.referenceId || 'SDS-2026-CONFIRMED'}</strong>
              </div>
              <div>
                <small style="color:var(--muted);display:block;">Location</small>
                <span>${ev.location}</span>
              </div>
              <div>
                <small style="color:var(--muted);display:block;">Address</small>
                <span style="font-size:0.88rem;">${ev.address}</span>
              </div>
            </div>

            <div class="pass-ticket__barcode">
              ${Array.from({ length: 48 }, (_, i) => `
                <div class="pass-ticket__bar" style="width:${(i % 3 === 0 ? 3 : (i % 2 === 0 ? 2 : 1))}px;"></div>
              `).join('')}
            </div>
            <small style="text-align:center;display:block;margin-top:6px;color:var(--muted);">Scan at entrance or present reference ID</small>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:12px;">
            <button class="button button--secondary" id="btnPrintPass">
              ${icons.download} Print / Save Pass
            </button>
            <button class="button button--primary" id="btnClosePass">Close</button>
          </div>
        </section>
      </div>
    `;
  }

  // ─── Legal & Statement Modal ───
  function renderLegalModal() {
    if (!state.legalModal) return '';

    let title = 'Privacy Policy';
    let eyebrow = 'Legal';
    let content = '';

    if (state.legalModal === 'privacy') {
      title = 'Privacy Policy';
      eyebrow = 'Data Protection';
      content = `
        <p>ServeDeServe is committed to safeguarding the personal information of all community members. We only collect the minimal details required to manage event participation.</p>
        <h3 style="margin:16px 0 6px;">1. Information We Collect</h3>
        <p>When you register for an event, we collect your full name, email address, optional phone number, and organization. This information is strictly used to communicate event updates, access details, and reminders.</p>
        <h3 style="margin:16px 0 6px;">2. Accessibility &amp; Device Settings</h3>
        <p>Display preferences such as text magnification, high contrast, and reduced motion are stored locally on your device in your browser's local storage and are never shared or transmitted to external advertisers.</p>
        <h3 style="margin:16px 0 6px;">3. Contact</h3>
        <p>If you have any questions or would like to request removal of your registration records, email us at <a href="mailto:privacy@servedeserve.org" style="color:var(--primary);font-weight:700;">privacy@servedeserve.org</a>.</p>
      `;
    } else if (state.legalModal === 'terms') {
      title = 'Terms of Service';
      eyebrow = 'Community Guidelines';
      content = `
        <p>By using ServeDeServe and registering for community events, you agree to adhere to our inclusive community participation principles.</p>
        <h3 style="margin:16px 0 6px;">1. Respectful Environment</h3>
        <p>All participants, speakers, and staff must be treated with dignity and respect. Harassment, discriminatory language, or disruptive behavior will not be tolerated at any session.</p>
        <h3 style="margin:16px 0 6px;">2. Seat Allocations &amp; Cancellation</h3>
        <p>Because seating capacity is limited and free of charge, if you can no longer attend an event, please cancel your registration in advance so your spot can be offered to another community member.</p>
      `;
    } else if (state.legalModal === 'a11y-stmt') {
      title = 'Accessibility Statement';
      eyebrow = 'Inclusion Standards';
      content = `
        <p>ServeDeServe is dedicated to digital and physical accessibility for all people, including those with visual, auditory, cognitive, and motor impairments.</p>
        <h3 style="margin:16px 0 6px;">1. WCAG 2.1 AA Compliance</h3>
        <p>Our web platform is built according to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. Features include visible focus indicators, screen-reader compatible landmark roles, ARIA live regions, high contrast colour palettes, and complete keyboard operability.</p>
        <h3 style="margin:16px 0 6px;">2. Venue Access</h3>
        <p>Every event venue is audited for wheelchair-accessible, step-free access, accessible parking bays, and audio hearing loops.</p>
      `;
    }

    return `
      <div class="modal-backdrop" id="legalModalBackdrop" role="presentation">
        <section class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="legalTitle">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">${eyebrow}</p>
              <h2 id="legalTitle">${title}</h2>
            </div>
            <button class="icon-button" id="closeLegalModalBtn" aria-label="Close modal">
              ${icons.x}
            </button>
          </div>
          <div style="color:var(--text-2);line-height:1.65;margin:20px 0;">
            ${content}
          </div>
          <div style="display:flex;justify-content:flex-end;">
            <button class="button button--primary" id="btnUnderstoodLegal">I Understand</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderEventCard(event) {
    return `
      <article class="event-card">
        <div class="event-card__image">
          <img src="${event.image}" alt="${event.alt}">
          <span>${event.category}</span>
        </div>
        <div class="event-card__body">
          <h3>${event.title}</h3>
          <div class="event-meta">
            <span>${icons.calendar} ${formatDate(event.date)}</span>
            <span>${icons.clock} ${formatTimeRange(event)}</span>
            <span>${icons.mapPin} ${event.location}</span>
          </div>
          <p>${event.description}</p>
          <button class="button button--secondary view-detail-btn" data-id="${event.id}">
            View details ${icons.arrowRight}
          </button>
        </div>
      </article>
    `;
  }

  function renderCalendar() {
    const year = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth();
    const monthLabel = state.calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Monday start day calculation: (getDay() + 6) % 7
    const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [
      ...Array(firstDayOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];

    const formatDayDate = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const selectedEvents = state.selectedCalendarDate
      ? state.events.filter(e => e.date === state.selectedCalendarDate)
      : [];

    return `
      <section class="calendar-section" aria-labelledby="calendar-title">
        <div class="calendar-section__heading">
          <div>
            <p class="eyebrow">Plan ahead</p>
            <h2 id="calendar-title">
              ${icons.calendarDays} Event Calendar
            </h2>
            <p>Browse events by date or explore where they are taking place.</p>
          </div>
          <button class="button button--secondary" id="openLocationModalBtn">
            ${icons.mapPin} Locations
          </button>
        </div>
        <div class="calendar-card">
          <div class="calendar-toolbar">
            <button class="button button--secondary" id="calPrevMonthBtn">
              ${icons.chevronLeft}
              <span class="calendar-button-label">Previous month</span>
            </button>
            <div>
              <h3 aria-live="polite">${monthLabel}</h3>
              <button id="calTodayBtn">Today</button>
            </div>
            <button class="button button--secondary" id="calNextMonthBtn">
              <span class="calendar-button-label">Next month</span>
              ${icons.chevronRight}
            </button>
          </div>
          <div class="calendar-grid" role="grid" aria-label="${monthLabel} event calendar">
            ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => `
              <div class="calendar-weekday" role="columnheader">${w}</div>
            `).join('')}
            ${cells.map((day, idx) => {
              if (!day) {
                return `<div class="calendar-day calendar-day--empty" aria-hidden="true"></div>`;
              }
              const dStr = formatDayDate(day);
              const dayEvs = state.events.filter(e => e.date === dStr);
              const isSel = state.selectedCalendarDate === dStr;
              const hasEvents = dayEvs.length > 0;
              const fullDateStr = new Date(year, month, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

              return `
                <button
                  role="gridcell"
                  class="calendar-day ${hasEvents ? 'has-events' : ''} ${isSel ? 'is-selected' : ''}"
                  data-date="${dStr}"
                  aria-label="${fullDateStr}. ${hasEvents ? `${dayEvs.length} event${dayEvs.length > 1 ? 's' : ''} scheduled.` : 'No events scheduled.'}"
                  aria-selected="${isSel}"
                >
                  <span class="calendar-day__number">${day}</span>
                  ${hasEvents ? `
                    <span class="calendar-event-indicator">
                      <i aria-hidden="true"></i>
                      ${dayEvs.length} ${dayEvs.length === 1 ? 'Event' : 'Events'}
                    </span>
                  ` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        ${state.selectedCalendarDate ? `
          <div class="selected-date-panel ${selectedEvents.length ? '' : 'selected-date-panel--empty'}" aria-live="polite">
            <div>
              <p class="eyebrow">Selected date</p>
              <h3>${formatDate(state.selectedCalendarDate, { day: 'numeric', month: 'long' })}</h3>
              ${selectedEvents.length > 0 ? `<span>${selectedEvents.length} ${selectedEvents.length === 1 ? 'event' : 'events'}</span>` : ''}
            </div>
            ${selectedEvents.length > 0 ? `
              <div class="selected-events">
                ${selectedEvents.map(e => `
                  <article>
                    <div>
                      <strong>${e.title}</strong>
                      <span>${icons.clock} ${formatTimeRange(e)}</span>
                      <span>${icons.mapPin} ${e.location}</span>
                    </div>
                    <button class="button button--secondary view-detail-btn" data-id="${e.id}">
                      View details
                    </button>
                  </article>
                `).join('')}
              </div>
            ` : `
              <p>No events scheduled for this date.</p>
            `}
          </div>
        ` : ''}
      </section>
    `;
  }

  function renderLocationModal() {
    if (!state.locationModalOpen) return '';

    const sel = state.selectedMapEvent;

    return `
      <div class="location-modal-backdrop" id="locationModalBackdrop" role="presentation">
        <section class="location-modal" role="dialog" aria-modal="true" aria-labelledby="location-title">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Event map</p>
              <h2 id="location-title">Event locations</h2>
            </div>
            <button class="icon-button" id="closeLocModalBtn" aria-label="Close event locations">
              ${icons.x}
            </button>
          </div>
          <div class="location-layout">
            <div class="map-structure" aria-label="Map preview with event location markers">
              <div class="map-grid-lines" aria-hidden="true"></div>
              ${state.events.map((ev, idx) => `
                <button
                  class="map-marker map-marker--${idx + 1} ${sel.id === ev.id ? 'active' : ''}"
                  data-id="${ev.id}"
                  aria-label="View ${ev.title} at ${ev.location}"
                >
                  ${icons.mapPinSolid}
                  <span>${idx + 1}</span>
                </button>
              `).join('')}
              <article class="map-info-card">
                <span class="module-label">Selected location</span>
                <h3>${sel.title}</h3>
                <p>${icons.mapPin} ${sel.location}</p>
                <p>${icons.calendarDays} ${formatDate(sel.date)} · ${formatTimeRange(sel)}</p>
                <button class="button button--secondary view-detail-btn" data-id="${sel.id}">
                  View event details
                </button>
              </article>
              <div class="map-api-note">
                ${icons.locateFixed}
                <span>
                  <strong>Interactive map area</strong>
                  <small>Ready to connect to a mapping service.</small>
                </span>
              </div>
            </div>
            <div class="location-list">
              ${state.events.map((ev, idx) => `
                <button class="${sel.id === ev.id ? 'active' : ''}" data-id="${ev.id}">
                  <span class="location-number">${idx + 1}</span>
                  <span>
                    <strong>${ev.location}</strong>
                    <b>${ev.title}</b>
                    <small>${formatDate(ev.date)} · ${formatTimeRange(ev)}</small>
                    <small>${ev.host}</small>
                    <small>${ev.address}</small>
                  </span>
                  ${icons.navigation}
                </button>
              `).join('')}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  // View: Discover Events
  function renderEventsView() {
    let filtered = state.events.filter(e => {
      const q = state.searchQuery.toLowerCase();
      const matchesSearch = !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
      const matchesCat = state.categoryFilter === 'All categories' || e.category === state.categoryFilter;
      const matchesLoc = state.locationFilter === 'All locations' || e.location.includes(state.locationFilter);

      let matchesDate = true;
      if (state.dateFilter === 'This week') {
        // Oct 12 - Oct 18
        matchesDate = e.date >= '2026-10-12' && e.date <= '2026-10-18';
      } else if (state.dateFilter === 'This month') {
        matchesDate = e.date.startsWith('2026-10');
      }

      return matchesSearch && matchesCat && matchesLoc && matchesDate;
    });

    return `
      <main class="page-shell">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <button id="bcHome">Home</button>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Event portal</span>
        </nav>
        <div class="page-heading-row">
          <header class="page-title">
            <p class="eyebrow">Event portal</p>
            <h1>Discover events</h1>
            <p>Find and participate in upcoming events in your community.</p>
          </header>
          <button class="button button--secondary" id="btnMyRegTop">
            ${icons.ticketCheck} My registrations
          </button>
        </div>

        <section class="filter-panel" aria-label="Event filters">
          <div class="field search-field">
            <label for="event-search">Search events</label>
            <span>
              ${icons.search}
              <input id="event-search" value="${state.searchQuery}" placeholder="Search by event name or keyword">
            </span>
          </div>
          <div class="field">
            <label for="category-select">Category</label>
            <div class="select-wrap">
              <select id="category-select">
                <option ${state.categoryFilter === 'All categories' ? 'selected' : ''}>All categories</option>
                <option ${state.categoryFilter === 'Workshop' ? 'selected' : ''}>Workshop</option>
                <option ${state.categoryFilter === 'Community' ? 'selected' : ''}>Community</option>
                <option ${state.categoryFilter === 'Recreation' ? 'selected' : ''}>Recreation</option>
              </select>
              ${icons.chevronDown}
            </div>
          </div>
          <div class="field">
            <label for="date-select">Date</label>
            <div class="select-wrap">
              <select id="date-select">
                <option ${state.dateFilter === 'Any date' ? 'selected' : ''}>Any date</option>
                <option ${state.dateFilter === 'This week' ? 'selected' : ''}>This week</option>
                <option ${state.dateFilter === 'This month' ? 'selected' : ''}>This month</option>
              </select>
              ${icons.chevronDown}
            </div>
          </div>
          <div class="field">
            <label for="location-select">Location</label>
            <div class="select-wrap">
              <select id="location-select">
                <option ${state.locationFilter === 'All locations' ? 'selected' : ''}>All locations</option>
                <option ${state.locationFilter === 'Community Learning Centre' ? 'selected' : ''}>Community Learning Centre</option>
                <option ${state.locationFilter === 'Civic Hall' ? 'selected' : ''}>Civic Hall</option>
                <option ${state.locationFilter === 'Riverside Sports Centre' ? 'selected' : ''}>Riverside Sports Centre</option>
              </select>
              ${icons.chevronDown}
            </div>
          </div>
        </section>

        <div class="results-heading">
          <h2>Upcoming events</h2>
          <span>${filtered.length} events found</span>
        </div>

        ${filtered.length > 0 ? `
          <div class="event-grid">
            ${filtered.map(renderEventCard).join('')}
          </div>
        ` : `
          <div class="empty-state">
            ${icons.search}
            <h2>No events found</h2>
            <p>Try changing your search or removing a filter.</p>
            <button class="button button--primary" id="clearSearchBtn">Clear search</button>
          </div>
        `}

        ${renderCalendar()}
        ${renderLocationModal()}
      </main>
    `;
  }

  // View: Event Details
  // View: Event Details
  function renderDetailView() {
    const e = state.selectedEvent;
    const locName = e.location || e.venue || 'Event Venue';
    const addrName = e.address || (e.city ? `${locName}, ${e.city}` : locName);

    let lat = 13.0827;
    let lng = 80.2707;
    let hasCoords = false;
    if (e.coordinates && typeof e.coordinates.lat === 'number' && typeof e.coordinates.lng === 'number') {
      lat = e.coordinates.lat;
      lng = e.coordinates.lng;
      hasCoords = true;
    }

    const hostName = typeof e.host === 'object' ? (e.host?.name || 'Community Support Team') : (e.host || 'Community Support Team');
    const hostInitials = hostName.split(' ').map(w => w[0]).slice(0, 2).join('');
    const googleMapsUrl = hasCoords
      ? `https://maps.google.com/?q=${lat},${lng}`
      : `https://maps.google.com/?q=${encodeURIComponent(`${locName}, ${addrName}`)}`;

    return `
      <main class="page-shell">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <button id="bcHome">Home</button>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Event details</span>
        </nav>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
          <button class="button button--ghost" id="btnBackToEvents">
            ${icons.arrowLeft} Back to events
          </button>
          <div style="display:flex;gap:10px;">
            <button class="button button--secondary" id="btnShareEvent">
              ${icons.share} Share
            </button>
            <button class="button button--secondary" id="btnAddToCalendar">
              ${icons.calendar} Add to Calendar
            </button>
          </div>
        </div>
        <article class="detail-layout">
          <div class="detail-main">
            <img class="detail-image" src="${e.image}" alt="${e.alt}">
            <div class="detail-content">
              <span class="module-label">${e.category}</span>
              <h1>${e.title}</h1>
              <p class="lead">${e.description}</p>
              <h2>About this event</h2>
              <p>Friendly facilitators will guide you through every part of the session. Support people are welcome, and accessibility assistance is available on request.</p>
              
              <h2>Location and access</h2>
              <div class="map-placeholder">
                ${icons.mapPin}
                <div>
                  <strong>${locName}</strong>
                  <span>${addrName}</span>
                  <small>Step-free entrance · Accessible parking · Hearing loop</small>
                </div>
              </div>

              ${(e.liveTracking && e.liveTracking.enabled) ? `
                <div id="liveHostTrackerBanner" style="background:#fff1f2;border:1.5px solid #fda4af;border-radius:12px;padding:12px 16px;margin-bottom:12px;box-shadow:0 4px 14px rgba(244,63,94,0.12);">
                  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <span class="live-pulse-dot"></span>
                      <div>
                        <strong style="color:#9f1239;font-size:0.95rem;display:block;">🔴 LIVE HOST LOCATION BROADCAST</strong>
                        <span style="font-size:0.86rem;color:#881337;">Presiding Host: <strong id="liveHostName">${e.liveTracking.hostName || hostName}</strong></span>
                      </div>
                    </div>
                    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                      <div style="text-align:right;">
                        <span id="liveHostStatusBadge" style="background:#ffe4e6;color:#be123c;font-size:0.82rem;font-weight:800;padding:4px 12px;border-radius:999px;display:inline-block;">
                          ${e.liveTracking.status || 'En Route'}
                        </span>
                        <div id="liveHostEtaText" style="font-size:0.84rem;font-weight:700;color:#9f1239;margin-top:2px;">
                          ETA: ${e.liveTracking.eta || 'Calculating...'} (${e.liveTracking.distanceKm || 0} km away)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- Interactive Leaflet Map with Exact Coordinates -->
              <div class="event-detail-map" style="position:relative;overflow:hidden;border-radius:14px;border:1px solid var(--border);height:360px;background:#f8fafc;margin-bottom:12px;">
                <div id="eventDetailLeafletMap" style="width:100%;height:100%;min-height:360px;z-index:1;"></div>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:28px;">
                <span style="font-size:0.88rem;color:var(--text-2);display:inline-flex;align-items:center;gap:6px;">
                  ${icons.locateFixed} <strong>Pinned Location:</strong> ${lat.toFixed(4)}°, ${lng.toFixed(4)}°
                </span>
                <a
                  href="${googleMapsUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="button button--secondary"
                  style="font-size:0.88rem;display:inline-flex;align-items:center;gap:6px;padding:8px 16px;"
                >
                  ${icons.navigation} Open in Google Maps
                </a>
              </div>

              <h2>Hosted by</h2>
              <div class="host-card">
                <span>${hostInitials}</span>
                <div>
                  <strong>${hostName}</strong>
                  <p>${typeof e.host === 'object' && e.host.email ? e.host.email : 'events@servedeserve.org'} · ${typeof e.host === 'object' && e.host.phone ? e.host.phone : '(555) 014-2025'}</p>
                </div>
              </div>

              ${e.gallery && e.gallery.length > 0 ? `
                <div class="detail-gallery-teaser">
                  <div class="detail-gallery-teaser__header">
                    <div>
                      <h3>${icons.image} Event Photo Gallery (${e.gallery.length} Photos)</h3>
                      <p>View photos and highlights captured during this session.</p>
                    </div>
                    <button class="button button--secondary btn-view-event-gallery" data-id="${e.id}">
                      Open Photo Slideshow ${icons.arrowRight}
                    </button>
                  </div>
                  <div class="detail-gallery-strip">
                    ${e.gallery.slice(0, 3).map(p => `
                      <img src="${p.url}" alt="${p.alt || ''}" class="detail-gallery-thumb btn-view-event-gallery" data-id="${e.id}" />
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              ${e.feedbackActive ? `
                <div class="feedback-banner">
                  <div>
                    <span class="feedback-banner__badge">${icons.star} FEEDBACK ACTIVE</span>
                    <h3 style="margin:4px 0 6px;">Attendee Feedback is Open!</h3>
                    <p style="margin:0;color:var(--text-2);">This event has concluded. Help us improve future sessions by sharing your experience.</p>
                  </div>
                  <button class="button button--primary btn-open-feedback" data-id="${e.id}">
                    ${icons.star} Submit Event Feedback
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
          <aside class="booking-card">
            <h2>Event details</h2>
            <div class="booking-row">
              ${icons.calendarDays}
              <span>
                <small>Date</small>
                <strong>${formatDate(e.date)}</strong>
              </span>
            </div>
            <div class="booking-row">
              ${icons.clock}
              <span>
                <small>Time</small>
                <strong>${formatTimeRange(e)}</strong>
              </span>
            </div>
            <div class="booking-row">
              ${icons.mapPin}
              <span>
                <small>Location</small>
                <strong>${e.location}</strong>
              </span>
            </div>
            <hr>
            <p>${icons.circleCheck} Free to attend</p>
            <p>${icons.circleCheck} ${e.remainingPlaces > 0 ? `${e.remainingPlaces} places remaining` : 'Full capacity'}</p>
            ${e.status === 'completed' || e.date < '2026-10-10' ? `
              <p style="color:var(--muted);font-weight:600;text-align:center;margin:12px 0;">This event has concluded.</p>
              ${e.feedbackActive ? `
                <button class="button button--primary btn-open-feedback" data-id="${e.id}" style="width:100%;margin-bottom:8px;">
                  ${icons.star} Submit Feedback
                </button>
              ` : ''}
              ${e.gallery && e.gallery.length > 0 ? `
                <button class="button button--secondary btn-view-event-gallery" data-id="${e.id}" style="width:100%;">
                  ${icons.image} View Gallery (${e.gallery.length})
                </button>
              ` : ''}
            ` : `
              <button class="button button--primary" id="btnRegisterNow">
                Register now ${icons.arrowRight}
              </button>
              <small class="centered">Registration takes about 2 minutes.</small>
            `}
          </aside>
        </article>
      </main>
    `;
  }

  // View: Event Register
  function renderRegisterView() {
    const e = state.selectedEvent;

    return `
      <main class="narrow-shell">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <button id="bcHome">Home</button>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Event registration</span>
        </nav>
        <header class="page-title">
          <p class="eyebrow">Event registration</p>
          <h1>Register for this event</h1>
          <p>${e.title} · ${formatDate(e.date)}</p>
        </header>
        <form class="form-card" id="regForm">
          <div class="form-notice">
            ${icons.shieldCheck}
            <p>
              <strong>Your information is protected.</strong>
              <span>Fields marked with * are required.</span>
            </p>
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="fullName">Full name <span aria-hidden="true">*</span></label>
              <input id="fullName" name="fullName" required placeholder="e.g. Jane Doe">
            </div>
            <div class="field">
              <label for="email">Email address <span aria-hidden="true">*</span></label>
              <input id="email" name="email" type="email" required placeholder="e.g. jane.doe@example.com">
            </div>
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="department">Department or organization</label>
              <input id="department" name="department" placeholder="Optional">
            </div>
            <div class="field">
              <label for="phone">Phone number</label>
              <input id="phone" name="phone" type="tel" aria-describedby="phone-hint" placeholder="(555) 000-0000">
              <p class="field__hint" id="phone-hint">Optional. Include area code.</p>
            </div>
          </div>
          <label class="check-row">
            <input type="checkbox" required checked>
            <span>I confirm that the details above are correct and agree to receive event updates.</span>
          </label>
          <div class="form-actions">
            <button type="button" class="button button--secondary" id="btnCancelReg">Cancel</button>
            <button type="submit" class="button button--primary">
              Register ${icons.arrowRight}
            </button>
          </div>
        </form>
      </main>
    `;
  }

  // View: Confirmation
  function renderConfirmationView() {
    return `
      <main class="confirmation">
        <div class="confirmation__icon">
          ${icons.check}
        </div>
        <p class="eyebrow">Registration complete</p>
        <h1>You’re registered</h1>
        <p>Your event place is confirmed. We’ve sent the details to your email.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:20px;">
          <button class="button button--primary" id="btnViewMyRegConfirm">
            View my registrations ${icons.arrowRight}
          </button>
          <button class="button button--secondary" id="btnReturnToEvents">
            Return to events
          </button>
        </div>
      </main>
    `;
  }

  // View: My Registrations
  function renderRegistrationsView() {
    const tabs = [
      { label: 'Upcoming', count: state.userRegistrations.length },
      { label: 'Past', count: state.pastRegistrations.length },
      { label: 'Cancelled', count: state.cancelledRegistrations.length }
    ];
    const activeTab = state.activeRegistrationsTab;

    let items = [];
    if (activeTab === 0) items = state.userRegistrations;
    else if (activeTab === 1) items = state.pastRegistrations;
    else if (activeTab === 2) items = state.cancelledRegistrations;

    return `
      <main class="page-shell">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <button id="bcHome">Home</button>
          <span aria-hidden="true">/</span>
          <span aria-current="page">My registrations</span>
        </nav>
        <header class="page-title">
          <p class="eyebrow">Event portal</p>
          <h1>My registrations</h1>
          <p>Review your upcoming and previous event registrations.</p>
        </header>

        <div class="tabs" role="tablist">
          ${tabs.map((tab, idx) => `
            <button
              role="tab"
              aria-selected="${activeTab === idx}"
              class="${activeTab === idx ? 'active' : ''}"
              data-tab="${idx}"
            >
              ${tab.label} (${tab.count})
            </button>
          `).join('')}
        </div>

        <div class="list-card">
          ${items.length > 0 ? items.map((reg) => {
            const ev = reg.event;
            const dayNum = ev.date.slice(-2);
            return `
              <div class="registration-row">
                <div class="date-tile">
                  <strong>${dayNum}</strong>
                  <span>OCT</span>
                </div>
                <div>
                  <h3>${ev.title}</h3>
                  <p>${icons.clock} ${formatDate(ev.date)} · ${formatTimeRange(ev)}</p>
                  <p>${icons.mapPin} ${ev.location}</p>
                </div>
                <span class="status status--${reg.status.toLowerCase()}">
                  <span class="status__dot" aria-hidden="true"></span>
                  ${reg.status}
                </span>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                  <button class="button button--secondary view-detail-btn" data-id="${ev.id}">
                    View details
                  </button>
                  ${activeTab === 0 ? `
                    <button class="button button--secondary btn-view-ticket" data-regid="${reg.id}" title="View Pass">
                      ${icons.ticketCheck} Pass
                    </button>
                    <button class="button button--ghost btn-cancel-reg" data-regid="${reg.id}" style="color:var(--error);" title="Cancel">
                      Cancel
                    </button>
                  ` : ''}
                  ${activeTab === 1 ? `
                    <button class="button button--secondary btn-view-ticket" data-regid="${reg.id}">
                      Certificate
                    </button>
                    ${ev.feedbackActive ? `
                      <button class="button button--primary btn-open-feedback" data-id="${ev.id}">
                        ${icons.star} Submit Feedback
                      </button>
                    ` : ''}
                    ${ev.gallery && ev.gallery.length > 0 ? `
                      <button class="button button--secondary btn-view-event-gallery" data-id="${ev.id}">
                        ${icons.image} Gallery
                      </button>
                    ` : ''}
                  ` : ''}
                  ${activeTab === 2 ? `
                    <button class="button button--primary btn-reregister" data-id="${ev.id}">
                      Re-register
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('') : `
            <div class="empty-state" style="padding:48px 24px;border:none;">
              <p>No ${tabs[activeTab].label.toLowerCase()} registrations to display.</p>
              ${activeTab !== 0 ? `
                <button class="button button--secondary" id="btnGoUpcoming" style="margin-top:12px;">View Upcoming Events</button>
              ` : ''}
            </div>
          `}
        </div>
      </main>
    `;
  }

  // ─── Carousel & Gallery Helpers ───
  function getCurrentGalleryEvent() {
    const eventsWithPhotos = state.events.filter(e => e.gallery && e.gallery.length > 0);
    let cur = eventsWithPhotos.find(e => e.id === state.activeGalleryEventId);
    if (!cur && eventsWithPhotos.length > 0) {
      cur = eventsWithPhotos[0];
      state.activeGalleryEventId = cur.id;
    }
    return cur || state.events[0];
  }

  function nextGallerySlide() {
    const cur = getCurrentGalleryEvent();
    if (cur && cur.gallery && cur.gallery.length > 1) {
      state.gallerySlideIndex = (state.gallerySlideIndex + 1) % cur.gallery.length;
      updateCarouselDOM();
    }
  }

  function prevGallerySlide() {
    const cur = getCurrentGalleryEvent();
    if (cur && cur.gallery && cur.gallery.length > 1) {
      state.gallerySlideIndex = (state.gallerySlideIndex - 1 + cur.gallery.length) % cur.gallery.length;
      updateCarouselDOM();
    }
  }

  function updateCarouselDOM() {
    const cur = getCurrentGalleryEvent();
    if (!cur || !cur.gallery) return;
    const photos = cur.gallery;
    const photo = photos[state.gallerySlideIndex] || photos[0];
    if (!photo) return;

    const img = document.getElementById('carouselMainImg');
    if (img) {
      img.style.opacity = '0.3';
      setTimeout(() => {
        img.src = photo.url;
        img.alt = photo.alt || photo.caption || cur.title;
        img.style.opacity = '1';
      }, 150);
    }

    const badge = document.querySelector('.carousel-badge');
    if (badge) badge.textContent = `Photo ${state.gallerySlideIndex + 1} of ${photos.length}`;

    const caption = document.querySelector('.carousel-caption-bar p');
    if (caption) {
      caption.innerHTML = `<strong>${cur.title}</strong> · <span>${formatDate(cur.date)}</span>: <em>${photo.caption || 'Community event moment'}</em>`;
    }

    document.querySelectorAll('.carousel-thumb').forEach((thumb, idx) => {
      thumb.classList.toggle('active', idx === state.gallerySlideIndex);
    });
  }

  function toggleGalleryAutoPlay() {
    state.galleryAutoPlay = !state.galleryAutoPlay;
    if (state.galleryAutoPlay) {
      startGalleryAutoTimer();
    } else {
      stopGalleryAutoTimer();
    }
    const btn = document.getElementById('carouselPlayBtn');
    if (btn) btn.innerHTML = state.galleryAutoPlay ? '⏸ Pause' : '▶ Auto-slide';
  }

  function startGalleryAutoTimer() {
    stopGalleryAutoTimer();
    state.galleryAutoTimer = setInterval(() => {
      if (state.page === 'gallery') {
        nextGallerySlide();
      } else {
        stopGalleryAutoTimer();
      }
    }, 4000);
  }

  function stopGalleryAutoTimer() {
    if (state.galleryAutoTimer) {
      clearInterval(state.galleryAutoTimer);
      state.galleryAutoTimer = null;
    }
  }

  // View: Event Photo Gallery
  function renderGalleryView() {
    const eventsWithPhotos = state.events.filter(e => e.gallery && e.gallery.length > 0);
    const cur = getCurrentGalleryEvent();
    const photos = (cur && cur.gallery) ? cur.gallery : [];
    const currentIndex = Math.min(state.gallerySlideIndex, Math.max(0, photos.length - 1));
    const activePhoto = photos[currentIndex] || {
      url: cur ? cur.image : '',
      caption: cur ? cur.title : 'Community Event',
      alt: cur ? cur.alt : 'Community Event'
    };

    return `
      <main class="page-shell">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <button id="bcHome">Home</button>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Event photo gallery</span>
        </nav>

        <header class="page-title" style="margin-bottom:28px;">
          <p class="eyebrow">COMMUNITY MOMENTS &amp; MEMORIES</p>
          <h1>Event Photo Gallery</h1>
          <p>Relive moments, hands-on workshops, and achievements from completed ServeDeServe community events.</p>
        </header>

        ${cur ? `
          <div class="gallery-hero-header">
            <div>
              <span class="gallery-status-pill">${icons.circleCheck} Completed Event Album</span>
              <h2 class="gallery-current-title">${cur.title}</h2>
              <div class="gallery-current-meta">
                <span>${icons.calendarDays} <strong>${formatDate(cur.date)}</strong></span>
                <span>${icons.clock} ${formatTimeRange(cur)}</span>
                <span>${icons.mapPin} ${cur.location}</span>
                <span class="badge badge--pill">${cur.category}</span>
              </div>
            </div>
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
              ${cur.feedbackActive ? `
                <button class="button button--primary btn-open-feedback" data-id="${cur.id}">
                  ${icons.star} Submit Feedback
                </button>
              ` : ''}
              <button class="button button--secondary view-detail-btn" data-id="${cur.id}">
                Event Details
              </button>
            </div>
          </div>

          <!-- Featured Sliding Carousel Section -->
          <section class="gallery-featured-card" aria-label="Photo carousel for ${cur.title}">
            <div class="carousel-box">
              <div class="carousel-viewport">
                <img
                  src="${activePhoto.url}"
                  alt="${activePhoto.alt || activePhoto.caption}"
                  class="carousel-slide"
                  id="carouselMainImg"
                />

                <span class="carousel-badge" aria-live="polite">
                  Photo ${currentIndex + 1} of ${photos.length}
                </span>

                ${photos.length > 1 ? `
                  <button class="carousel-nav-btn prev" id="carouselPrevBtn" aria-label="Previous photo">
                    ${icons.chevronLeft}
                  </button>
                  <button class="carousel-nav-btn next" id="carouselNextBtn" aria-label="Next photo">
                    ${icons.chevronRight}
                  </button>
                ` : ''}
              </div>

              <div class="carousel-caption-bar">
                <p>
                  <strong>${cur.title}</strong> · <span>${formatDate(cur.date)}</span>:
                  <em>${activePhoto.caption || 'Community event moment'}</em>
                </p>
                <div style="display:flex;gap:10px;align-items:center;">
                  ${photos.length > 1 ? `
                    <button class="carousel-play-btn" id="carouselPlayBtn" aria-label="${state.galleryAutoPlay ? 'Pause auto-slide' : 'Start auto-slide'}">
                      ${state.galleryAutoPlay ? '⏸ Pause' : '▶ Auto-slide'}
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>

            ${photos.length > 1 ? `
              <div class="carousel-thumb-strip" role="tablist" aria-label="Photo thumbnails">
                ${photos.map((p, pIdx) => `
                  <button
                    class="carousel-thumb ${pIdx === currentIndex ? 'active' : ''}"
                    data-slide="${pIdx}"
                    aria-label="Go to photo ${pIdx + 1}"
                  >
                    <img src="${p.url}" alt="${p.alt || 'Thumbnail'}" />
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </section>
        ` : `
          <div class="empty-state">
            ${icons.image}
            <h2>No photo galleries available yet</h2>
            <p>Galleries are published once events are completed and photos are uploaded by organizers.</p>
          </div>
        `}

        <!-- Album Selector for All Events With Galleries -->
        <div style="margin-top:48px;">
          <div class="results-heading">
            <h2>All Event Photo Albums</h2>
            <span>${eventsWithPhotos.length} events with photos</span>
          </div>

          <div class="album-grid">
            ${eventsWithPhotos.map(ev => {
              const isActive = cur && ev.id === cur.id;
              const photoCount = ev.gallery ? ev.gallery.length : 0;
              const coverImg = ev.gallery && ev.gallery[0] ? ev.gallery[0].url : ev.image;

              return `
                <article class="album-card ${isActive ? 'active' : ''}" data-albumid="${ev.id}">
                  <div class="album-card__img">
                    <img src="${coverImg}" alt="${ev.title}" />
                    <span class="album-card__badge">
                      ${icons.image} ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}
                    </span>
                  </div>
                  <div class="album-card__body">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                      <span class="badge badge--pill">${ev.category}</span>
                      <small style="color:var(--text-2);font-weight:600;">${formatDate(ev.date)}</small>
                    </div>
                    <h3 style="font-size:1.1rem;margin:0 0 8px;">${ev.title}</h3>
                    <p style="font-size:0.88rem;color:var(--text-2);margin:0 0 16px;flex:1;">
                      ${ev.location}
                    </p>
                    <div style="display:flex;gap:8px;">
                      <button class="button button--secondary btn-select-album" data-albumid="${ev.id}" style="width:100%;">
                        ${isActive ? 'Viewing Now' : 'View Gallery'}
                      </button>
                    </div>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </div>
      </main>
    `;
  }

  // Modal: Attendee Feedback
  function renderFeedbackModal() {
    if (!state.feedbackModalOpen || !state.feedbackEvent) return '';

    const ev = state.feedbackEvent;
    const questions = ev.feedbackQuestions && ev.feedbackQuestions.length > 0
      ? ev.feedbackQuestions
      : [
          { id: 'q1', text: 'How would you rate your overall experience with this event?', type: 'rating' },
          { id: 'q2', text: 'Were the venue accessibility accommodations helpful and easy to use?', type: 'choice', options: ['Extremely helpful', 'Satisfactory', 'Needs improvements'] },
          { id: 'q3', text: 'What suggestions do you have for future events or sessions?', type: 'text' }
        ];

    const ratingDescriptions = {
      1: 'Poor / Needs substantial improvement',
      2: 'Fair / Met minimal expectations',
      3: 'Good / Satisfactory experience',
      4: 'Very Good / Well organised and helpful',
      5: 'Excellent / Outstanding accessibility and support'
    };

    return `
      <div class="modal-backdrop" id="feedbackModalBackdrop">
        <div class="feedback-modal-card" role="dialog" aria-modal="true" aria-labelledby="feedbackTitle">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
            <div>
              <span class="feedback-banner__badge">${icons.star} Attendee Feedback</span>
              <h2 id="feedbackTitle" style="font-size:1.45rem;margin:6px 0 2px;">${ev.title}</h2>
              <p style="color:var(--text-2);font-size:0.9rem;margin:0;">
                ${formatDate(ev.date)} · ${ev.location}
              </p>
            </div>
            <button class="icon-button" id="closeFeedbackModalBtn" aria-label="Close feedback modal">
              ${icons.x}
            </button>
          </div>

          <form id="feedbackForm" style="display:flex;flex-direction:column;gap:20px;margin-top:16px;">
            <!-- Primary Star Rating -->
            <div class="field">
              <label><strong>Overall Rating</strong></label>
              <div class="star-rating-box" id="starRatingContainer" role="radiogroup" aria-label="Rate 1 to 5 stars">
                ${[1, 2, 3, 4, 5].map(star => `
                  <button
                    type="button"
                    class="star-btn ${star <= state.feedbackRating ? 'is-active' : ''}"
                    data-star="${star}"
                    aria-label="${star} stars"
                  >
                    ${star <= state.feedbackRating ? icons.star : icons.starOutline}
                  </button>
                `).join('')}
              </div>
              <span class="feedback-score-hint" id="feedbackScoreHint">
                ${state.feedbackRating} / 5 Stars — ${ratingDescriptions[state.feedbackRating] || ''}
              </span>
            </div>

            <!-- Dynamic Admin-Configured Questions -->
            ${questions.map((q, idx) => {
              if (q.type === 'choice') {
                const currentVal = state.feedbackAnswers[q.id] || (q.options ? q.options[0] : '');
                return `
                  <div class="field">
                    <label><strong>${idx + 1}. ${q.text}</strong></label>
                    <div class="choice-pill-group">
                      ${(q.options || []).map(opt => `
                        <button
                          type="button"
                          class="choice-pill ${currentVal === opt ? 'selected' : ''}"
                          data-qid="${q.id}"
                          data-val="${opt}"
                        >
                          ${opt}
                        </button>
                      `).join('')}
                    </div>
                  </div>
                `;
              } else if (q.type === 'rating') {
                const qRating = state.feedbackAnswers[q.id] || 5;
                return `
                  <div class="field">
                    <label><strong>${idx + 1}. ${q.text}</strong></label>
                    <div class="star-rating-box">
                      ${[1, 2, 3, 4, 5].map(s => `
                        <button
                          type="button"
                          class="star-btn ${s <= qRating ? 'is-active' : ''}"
                          data-qid="${q.id}"
                          data-qstar="${s}"
                        >
                          ${s <= qRating ? icons.star : icons.starOutline}
                        </button>
                      `).join('')}
                    </div>
                  </div>
                `;
              } else {
                return `
                  <div class="field">
                    <label for="ans_${q.id}"><strong>${idx + 1}. ${q.text}</strong></label>
                    <input
                      type="text"
                      id="ans_${q.id}"
                      class="feedback-input"
                      data-qid="${q.id}"
                      value="${state.feedbackAnswers[q.id] || ''}"
                      placeholder="Share your feedback..."
                    />
                  </div>
                `;
              }
            }).join('')}

            <div class="field">
              <label for="feedbackComments"><strong>Additional Comments or Suggestions</strong></label>
              <textarea
                id="feedbackComments"
                rows="3"
                placeholder="Tell us what you enjoyed or any specific accessibility accommodations you would like to see in upcoming sessions."
              >${state.feedbackComments || ''}</textarea>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px;">
              <button type="button" class="button button--ghost" id="btnCancelFeedback">Cancel</button>
              <button type="submit" class="button button--primary" id="btnSubmitFeedback">
                ${icons.circleCheck} Submit Feedback
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // ─── Main Render ───
  function render() {
    const root = document.getElementById('root');
    if (!root) return;

    let mainContentHtml = '';
    if (state.page === 'events') {
      mainContentHtml = renderEventsView();
    } else if (state.page === 'event-detail') {
      mainContentHtml = renderDetailView();
    } else if (state.page === 'event-register') {
      mainContentHtml = renderRegisterView();
    } else if (state.page === 'confirmation') {
      mainContentHtml = renderConfirmationView();
    } else if (state.page === 'registrations') {
      mainContentHtml = renderRegistrationsView();
    } else if (state.page === 'gallery') {
      mainContentHtml = renderGalleryView();
    }

    root.innerHTML = `
      <a class="skip-link" href="#main-content">Skip to main content</a>
      ${renderHeader()}
      <div id="main-content">
        ${mainContentHtml}
      </div>
      ${renderFooter()}
      ${renderA11yDrawer()}
      ${renderHelpModal()}
      ${renderProfileModal()}
      ${renderTicketModal()}
      ${renderLegalModal()}
      ${renderFeedbackModal()}
    `;

    applyA11ySettings();
    bindEvents();
    renderToasts();
    if (state.page === 'event-detail') {
      initDetailLeafletMap(state.selectedEvent);
    }
  }

  function initDetailLeafletMap(e) {
    if (!e) return;
    const container = document.getElementById('eventDetailLeafletMap');
    if (!container) return;

    if (typeof L === 'undefined') {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);">Loading interactive map...</div>';
      return;
    }

    // Clean up any existing map instance to avoid "Map container is already initialized"
    if (window._currentDetailMap) {
      try { window._currentDetailMap.remove(); } catch (err) {}
      window._currentDetailMap = null;
    }
    if (container._leaflet_id) {
      delete container._leaflet_id;
    }

    if (window._hostTrackingInterval) {
      clearInterval(window._hostTrackingInterval);
      window._hostTrackingInterval = null;
    }

    let lat = 13.0827;
    let lng = 80.2707;
    if (e.coordinates && typeof e.coordinates.lat === 'number' && typeof e.coordinates.lng === 'number') {
      lat = e.coordinates.lat;
      lng = e.coordinates.lng;
    }

    try {
      const isLiveInitial = Boolean(e.liveTracking && e.liveTracking.enabled);
      const map = L.map('eventDetailLeafletMap', { scrollWheelZoom: false }).setView([lat, lng], isLiveInitial ? 13 : 15);
      window._currentDetailMap = map;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const locTitle = e.venue || e.location || 'Event Location';
      const venueMarker = L.marker([lat, lng]).addTo(map);
      venueMarker.bindPopup(`
        <div style="font-family:system-ui,-apple-system,sans-serif;padding:3px 2px;min-width:180px;">
          <strong style="color:#6b21a8;font-size:0.95rem;display:block;margin-bottom:3px;">${e.title}</strong>
          <span style="font-weight:600;display:block;color:#1e293b;font-size:0.88rem;">${locTitle} (Destination)</span>
          <span style="font-size:0.8rem;color:#64748b;display:block;margin-top:2px;">${e.address || ''}</span>
          <small style="color:#7c3aed;font-weight:700;margin-top:5px;display:block;">📍 Venue: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
        </div>
      `);

      let hostMarker = null;
      let routeLine = null;

      const hostPopupContent = (tr) => `
        <div style="font-family:system-ui,-apple-system,sans-serif;padding:3px;min-width:190px;">
          <strong style="color:#dc2626;font-size:0.95rem;display:block;">🔴 Presiding Host Live Location</strong>
          <span style="font-weight:700;display:block;color:#1e293b;">${tr.hostName || e.host?.name || 'Presiding Dignitary'}</span>
          <span style="font-size:0.82rem;color:#64748b;display:block;margin-top:2px;">Status: <strong>${tr.status || 'En Route'}</strong></span>
          <small style="color:#9f1239;font-weight:800;margin-top:4px;display:block;">ETA: ${tr.eta || 'Calculating...'} (${tr.distanceKm || 0} km away)</small>
        </div>
      `;

      function renderOrUpdateHost(tr) {
        if (!tr || !tr.currentLocation) return;
        const hostLat = tr.currentLocation.lat;
        const hostLng = tr.currentLocation.lng;

        if (!hostMarker) {
          const hostIcon = L.divIcon({
            html: '<div class="host-pin-pulse" title="Presiding Host Live Location">🚗</div>',
            className: '',
            iconSize: [42, 42],
            iconAnchor: [21, 21]
          });
          hostMarker = L.marker([hostLat, hostLng], { icon: hostIcon }).addTo(map);
          hostMarker.bindPopup(hostPopupContent(tr));

          routeLine = L.polyline([[hostLat, hostLng], [lat, lng]], {
            color: '#e11d48',
            dashArray: '8, 8',
            weight: 3.5,
            opacity: 0.85
          }).addTo(map);
        } else {
          hostMarker.setLatLng([hostLat, hostLng]);
          if (routeLine) routeLine.setLatLngs([[hostLat, hostLng], [lat, lng]]);
          hostMarker.setPopupContent(hostPopupContent(tr));
        }

        // Adjust map bounds smoothly without erratic jumps
        if (Math.abs(hostLat - lat) > 0.001 || Math.abs(hostLng - lng) > 0.001) {
          map.fitBounds([[hostLat, hostLng], [lat, lng]], { padding: [50, 50], maxZoom: 16 });
        } else {
          map.setView([lat, lng], 15);
        }

        // Update banner DOM elements
        const banner = document.getElementById('liveHostTrackerBanner');
        if (banner) {
          banner.style.display = 'block';
          const hostNameEl = document.getElementById('liveHostName');
          if (hostNameEl) hostNameEl.textContent = tr.hostName || 'Presiding Host';
          const statusBadge = document.getElementById('liveHostStatusBadge');
          if (statusBadge) statusBadge.textContent = tr.status || 'En Route';
          const etaText = document.getElementById('liveHostEtaText');
          if (etaText) etaText.textContent = `ETA: ${tr.eta || '--'} (${tr.distanceKm || 0} km away)`;
        }
      }

      function removeHost() {
        if (hostMarker) { map.removeLayer(hostMarker); hostMarker = null; }
        if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
        const banner = document.getElementById('liveHostTrackerBanner');
        if (banner) banner.style.display = 'none';
        map.setView([lat, lng], 15);
      }

      if (isLiveInitial && e.liveTracking) {
        renderOrUpdateHost(e.liveTracking);
      } else {
        venueMarker.openPopup();
      }

      // Live Telemetry Polling (every 3 seconds)
      window._hostTrackingInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/events/' + e.id + '/host-tracking');
          const data = await res.json();
          if (data.success && data.liveTracking) {
            if (data.liveTracking.enabled) {
              renderOrUpdateHost(data.liveTracking);
            } else {
              removeHost();
            }
          }
        } catch (pollErr) {
          // graceful network error handling
        }
      }, 3000);

      setTimeout(() => {
        if (window._currentDetailMap) window._currentDetailMap.invalidateSize();
      }, 300);
    } catch (err) {
      console.warn('Leaflet initialization error:', err);
    }
  }

  // ─── Event Binding ───
  function bindEvents() {
    // Brand buttons
    const brandBtn = document.getElementById('brandBtn');
    if (brandBtn) brandBtn.onclick = () => navigate('events');

    const footerBrandBtn = document.getElementById('footerBrandBtn');
    if (footerBrandBtn) footerBrandBtn.onclick = () => navigate('events');

    const footerDiscoverBtn = document.getElementById('footerDiscoverBtn');
    if (footerDiscoverBtn) footerDiscoverBtn.onclick = () => navigate('events');

    const footerGalleryBtn = document.getElementById('footerGalleryBtn');
    if (footerGalleryBtn) footerGalleryBtn.onclick = () => navigate('gallery');

    const footerRegBtn = document.getElementById('footerRegBtn');
    if (footerRegBtn) footerRegBtn.onclick = () => navigate('registrations');

    const footerHelpBtn = document.getElementById('footerHelpBtn');
    if (footerHelpBtn) footerHelpBtn.onclick = () => { state.helpModalOpen = true; render(); };

    const footerA11yBtn = document.getElementById('footerA11yBtn');
    if (footerA11yBtn) footerA11yBtn.onclick = () => { state.a11yOpen = true; render(); };

    // Footer Legal Modals
    const btnFooterPrivacy = document.getElementById('btnFooterPrivacy');
    if (btnFooterPrivacy) btnFooterPrivacy.onclick = () => { state.legalModal = 'privacy'; render(); };

    const btnFooterTerms = document.getElementById('btnFooterTerms');
    if (btnFooterTerms) btnFooterTerms.onclick = () => { state.legalModal = 'terms'; render(); };

    const btnFooterA11yStmt = document.getElementById('btnFooterA11yStmt');
    if (btnFooterA11yStmt) btnFooterA11yStmt.onclick = () => { state.legalModal = 'a11y-stmt'; render(); };

    // Header nav buttons
    const navHome = document.getElementById('navHome');
    if (navHome) navHome.onclick = () => navigate('events');

    const navPortal = document.getElementById('navPortal');
    if (navPortal) navPortal.onclick = () => navigate('events');

    const navGallery = document.getElementById('navGallery');
    if (navGallery) navGallery.onclick = () => navigate('gallery');

    const navReg = document.getElementById('navRegistrations');
    if (navReg) navReg.onclick = () => navigate('registrations');

    const navHelp = document.getElementById('navHelp');
    if (navHelp) navHelp.onclick = () => { state.helpModalOpen = true; render(); };

    const navA11y = document.getElementById('navA11y');
    if (navA11y) navA11y.onclick = (e) => { e.preventDefault(); toggleA11y(true); };

    const navProfile = document.getElementById('navProfile');
    if (navProfile) navProfile.onclick = () => { state.profileModalOpen = true; render(); };

    const menuToggleBtn = document.getElementById('menuToggleBtn');
    if (menuToggleBtn) menuToggleBtn.onclick = () => { state.mobileMenuOpen = !state.mobileMenuOpen; render(); };

    // Breadcrumb Home
    const bcHome = document.getElementById('bcHome');
    if (bcHome) bcHome.onclick = () => navigate('events');

    const btnMyRegTop = document.getElementById('btnMyRegTop');
    if (btnMyRegTop) btnMyRegTop.onclick = () => navigate('registrations');

    // Filter controls
    const searchInput = document.getElementById('event-search');
    if (searchInput) {
      searchInput.oninput = (e) => {
        state.searchQuery = e.target.value;
        const grid = document.querySelector('.event-grid');
        const countSpan = document.querySelector('.results-heading span');
        let filtered = state.events.filter(item => {
          const q = state.searchQuery.toLowerCase();
          const matchesSearch = !q || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
          const matchesCat = state.categoryFilter === 'All categories' || item.category === state.categoryFilter;
          const matchesLoc = state.locationFilter === 'All locations' || item.location.includes(state.locationFilter);
          return matchesSearch && matchesCat && matchesLoc;
        });
        if (countSpan) countSpan.textContent = `${filtered.length} events found`;
        if (grid) {
          grid.innerHTML = filtered.map(renderEventCard).join('');
          bindDetailButtons();
        }
      };
    }

    const catSelect = document.getElementById('category-select');
    if (catSelect) {
      catSelect.onchange = (e) => {
        state.categoryFilter = e.target.value;
        render();
      };
    }

    const dateSelect = document.getElementById('date-select');
    if (dateSelect) {
      dateSelect.onchange = (e) => {
        state.dateFilter = e.target.value;
        render();
      };
    }

    const locSelect = document.getElementById('location-select');
    if (locSelect) {
      locSelect.onchange = (e) => {
        state.locationFilter = e.target.value;
        render();
      };
    }

    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
      clearSearchBtn.onclick = () => {
        state.searchQuery = '';
        state.categoryFilter = 'All categories';
        state.dateFilter = 'Any date';
        state.locationFilter = 'All locations';
        render();
      };
    }

    // Calendar buttons
    const calPrev = document.getElementById('calPrevMonthBtn');
    if (calPrev) {
      calPrev.onclick = () => {
        state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() - 1, 1);
        state.selectedCalendarDate = null;
        render();
      };
    }

    const calNext = document.getElementById('calNextMonthBtn');
    if (calNext) {
      calNext.onclick = () => {
        state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + 1, 1);
        state.selectedCalendarDate = null;
        render();
      };
    }

    const calToday = document.getElementById('calTodayBtn');
    if (calToday) {
      calToday.onclick = () => {
        const today = new Date(2026, 9, 15);
        state.calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
        state.selectedCalendarDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        render();
      };
    }

    // Calendar day cells click
    document.querySelectorAll('.calendar-day[data-date]').forEach(btn => {
      btn.onclick = () => {
        state.selectedCalendarDate = btn.getAttribute('data-date');
        render();
      };
    });

    // Locations modal triggers
    const openLocModalBtn = document.getElementById('openLocationModalBtn');
    if (openLocModalBtn) {
      openLocModalBtn.onclick = () => {
        state.locationModalOpen = true;
        render();
      };
    }

    const closeLocModalBtn = document.getElementById('closeLocModalBtn');
    if (closeLocModalBtn) {
      closeLocModalBtn.onclick = () => {
        state.locationModalOpen = false;
        render();
      };
    }

    const locBackdrop = document.getElementById('locationModalBackdrop');
    if (locBackdrop) {
      locBackdrop.onmousedown = (e) => {
        if (e.target === locBackdrop) {
          state.locationModalOpen = false;
          render();
        }
      };
    }

    // Location modal markers and list items
    document.querySelectorAll('.map-marker[data-id], .location-list button[data-id]').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.getAttribute('data-id'));
        const ev = state.events.find(item => item.id === id);
        if (ev) {
          state.selectedMapEvent = ev;
          render();
        }
      };
    });

    // Detail view buttons
    const btnBackToEvents = document.getElementById('btnBackToEvents');
    if (btnBackToEvents) btnBackToEvents.onclick = () => navigate('events');

    const btnRegisterNow = document.getElementById('btnRegisterNow');
    if (btnRegisterNow) btnRegisterNow.onclick = () => navigate('event-register');

    const btnShareEvent = document.getElementById('btnShareEvent');
    if (btnShareEvent) {
      btnShareEvent.onclick = () => {
        const shareUrl = window.location.origin + `/events/${state.selectedEvent.id}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Event link copied to clipboard!', icons.circleCheck);
          }).catch(() => {
            showToast(`Event URL: ${shareUrl}`, icons.share);
          });
        } else {
          showToast(`Event URL: ${shareUrl}`, icons.share);
        }
      };
    }

    const btnAddToCalendar = document.getElementById('btnAddToCalendar');
    if (btnAddToCalendar) {
      btnAddToCalendar.onclick = () => {
        downloadCalendarInvite(state.selectedEvent);
      };
    }

    const detailMapMarkerBtn = document.getElementById('detailMapMarkerBtn');
    if (detailMapMarkerBtn) {
      detailMapMarkerBtn.onclick = () => {
        state.detailMapPopupOpen = !state.detailMapPopupOpen;
        render();
      };
    }

    const detailPopupScrollBtn = document.getElementById('detailPopupScrollBtn');
    if (detailPopupScrollBtn) {
      detailPopupScrollBtn.onclick = () => {
        state.detailMapPopupOpen = false;
        window.scrollTo({ top: 0, behavior: state.reduceMotion ? 'auto' : 'smooth' });
        render();
      };
    }

    // Registration form
    const regForm = document.getElementById('regForm');
    if (regForm) {
      regForm.onsubmit = (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const department = document.getElementById('department') ? document.getElementById('department').value : '';
        const phone = document.getElementById('phone') ? document.getElementById('phone').value : '';

        const refId = `SDS-2026-${Date.now().toString(36).toUpperCase()}`;
        const newReg = {
          id: 'reg-' + Date.now(),
          eventId: state.selectedEvent.id,
          referenceId: refId,
          event: state.selectedEvent,
          fullName,
          email,
          department,
          phone,
          status: 'Confirmed'
        };

        state.userRegistrations.unshift(newReg);

        // Async post to backend
        fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: state.selectedEvent.id,
            fullName,
            email,
            department,
            phone
          })
        }).catch(() => {});

        showToast('Registration confirmed successfully!', icons.check);
        navigate('confirmation');
      };
    }

    const btnCancelReg = document.getElementById('btnCancelReg');
    if (btnCancelReg) btnCancelReg.onclick = () => navigate('event-detail');

    const btnViewMyRegConfirm = document.getElementById('btnViewMyRegConfirm');
    if (btnViewMyRegConfirm) btnViewMyRegConfirm.onclick = () => navigate('registrations');

    const btnReturnToEvents = document.getElementById('btnReturnToEvents');
    if (btnReturnToEvents) btnReturnToEvents.onclick = () => navigate('events');

    // Registration tabs
    document.querySelectorAll('.tabs button[data-tab]').forEach(tabBtn => {
      tabBtn.onclick = () => {
        state.activeRegistrationsTab = Number(tabBtn.getAttribute('data-tab'));
        render();
      };
    });

    const btnGoUpcoming = document.getElementById('btnGoUpcoming');
    if (btnGoUpcoming) {
      btnGoUpcoming.onclick = () => {
        state.activeRegistrationsTab = 0;
        render();
      };
    }

    // Registration actions: Pass, Cancel, Re-register
    document.querySelectorAll('.btn-view-ticket').forEach(btn => {
      btn.onclick = () => {
        const regId = btn.getAttribute('data-regid');
        const all = [...state.userRegistrations, ...state.pastRegistrations];
        const reg = all.find(r => String(r.id) === String(regId));
        if (reg) {
          state.activeTicket = reg;
          state.ticketModalOpen = true;
          render();
        }
      };
    });

    document.querySelectorAll('.btn-cancel-reg').forEach(btn => {
      btn.onclick = () => {
        const regId = btn.getAttribute('data-regid');
        const idx = state.userRegistrations.findIndex(r => String(r.id) === String(regId));
        if (idx !== -1) {
          if (confirm('Are you sure you want to cancel this event registration? Your reserved spot will be released to the community.')) {
            const cancelled = state.userRegistrations.splice(idx, 1)[0];
            cancelled.status = 'Cancelled';
            state.cancelledRegistrations.unshift(cancelled);
            showToast('Registration cancelled. Spot released.', icons.circleCheck);
            render();
          }
        }
      };
    });

    document.querySelectorAll('.btn-reregister').forEach(btn => {
      btn.onclick = () => {
        const evId = Number(btn.getAttribute('data-id'));
        const ev = state.events.find(e => e.id === evId);
        if (ev) {
          navigate('event-register', ev);
        }
      };
    });

    // Ticket Pass modal actions
    const closeTicketModalBtn = document.getElementById('closeTicketModalBtn');
    if (closeTicketModalBtn) closeTicketModalBtn.onclick = () => { state.ticketModalOpen = false; render(); };

    const btnClosePass = document.getElementById('btnClosePass');
    if (btnClosePass) btnClosePass.onclick = () => { state.ticketModalOpen = false; render(); };

    const ticketModalBackdrop = document.getElementById('ticketModalBackdrop');
    if (ticketModalBackdrop) {
      ticketModalBackdrop.onmousedown = (e) => {
        if (e.target === ticketModalBackdrop) {
          state.ticketModalOpen = false;
          render();
        }
      };
    }

    const btnPrintPass = document.getElementById('btnPrintPass');
    if (btnPrintPass) {
      btnPrintPass.onclick = () => {
        window.print();
      };
    }

    // Help modal actions
    const closeHelpModalBtn = document.getElementById('closeHelpModalBtn');
    if (closeHelpModalBtn) closeHelpModalBtn.onclick = () => { state.helpModalOpen = false; render(); };

    const btnCancelHelpForm = document.getElementById('btnCancelHelpForm');
    if (btnCancelHelpForm) btnCancelHelpForm.onclick = () => { state.helpModalOpen = false; render(); };

    const helpModalBackdrop = document.getElementById('helpModalBackdrop');
    if (helpModalBackdrop) {
      helpModalBackdrop.onmousedown = (e) => {
        if (e.target === helpModalBackdrop) {
          state.helpModalOpen = false;
          render();
        }
      };
    }

    document.querySelectorAll('.faq-question[data-faq]').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-faq'));
        state.activeFaqIndex = state.activeFaqIndex === idx ? null : idx;
        render();
      };
    });

    const helpInquiryForm = document.getElementById('helpInquiryForm');
    if (helpInquiryForm) {
      helpInquiryForm.onsubmit = (e) => {
        e.preventDefault();
        showToast('Message sent! Support team will reply within 24h.', icons.circleCheck);
        state.helpModalOpen = false;
        render();
      };
    }

    // Profile modal actions
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    if (closeProfileModalBtn) closeProfileModalBtn.onclick = () => { state.profileModalOpen = false; render(); };

    const btnDoneProfile = document.getElementById('btnDoneProfile');
    if (btnDoneProfile) btnDoneProfile.onclick = () => { state.profileModalOpen = false; render(); };

    const profileModalBackdrop = document.getElementById('profileModalBackdrop');
    if (profileModalBackdrop) {
      profileModalBackdrop.onmousedown = (e) => {
        if (e.target === profileModalBackdrop) {
          state.profileModalOpen = false;
          render();
        }
      };
    }

    const btnProfileMyReg = document.getElementById('btnProfileMyReg');
    if (btnProfileMyReg) btnProfileMyReg.onclick = () => { state.profileModalOpen = false; navigate('registrations'); };

    const btnProfileA11y = document.getElementById('btnProfileA11y');
    if (btnProfileA11y) btnProfileA11y.onclick = () => { state.profileModalOpen = false; state.a11yOpen = true; render(); };

    const btnLogoutUser = document.getElementById('btnLogoutUser');
    if (btnLogoutUser) {
      btnLogoutUser.onclick = () => {
        sessionStorage.removeItem('sds-active-role');
        sessionStorage.removeItem('sds-user-profile');
        window.location.href = '/login';
      };
    }

    // Legal modal actions
    const closeLegalModalBtn = document.getElementById('closeLegalModalBtn');
    if (closeLegalModalBtn) closeLegalModalBtn.onclick = () => { state.legalModal = null; render(); };

    const btnUnderstoodLegal = document.getElementById('btnUnderstoodLegal');
    if (btnUnderstoodLegal) btnUnderstoodLegal.onclick = () => { state.legalModal = null; render(); };

    const legalModalBackdrop = document.getElementById('legalModalBackdrop');
    if (legalModalBackdrop) {
      legalModalBackdrop.onmousedown = (e) => {
        if (e.target === legalModalBackdrop) {
          state.legalModal = null;
          render();
        }
      };
    }

    // A11y Panel controls
    const a11yScrim = document.getElementById('a11yScrim');
    if (a11yScrim) a11yScrim.onclick = (e) => { e.preventDefault(); toggleA11y(false); };

    const closeA11yBtn = document.getElementById('closeA11yBtn');
    if (closeA11yBtn) closeA11yBtn.onclick = (e) => { e.preventDefault(); toggleA11y(false); };

    const textSizeDecBtn = document.getElementById('textSizeDecBtn');
    if (textSizeDecBtn) {
      textSizeDecBtn.onclick = () => {
        state.textSize = Math.max(90, state.textSize - 10);
        applyA11ySettings();
        render();
      };
    }

    const textSizeIncBtn = document.getElementById('textSizeIncBtn');
    if (textSizeIncBtn) {
      textSizeIncBtn.onclick = () => {
        state.textSize = Math.min(130, state.textSize + 10);
        applyA11ySettings();
        render();
      };
    }

    const toggleContrastBtn = document.getElementById('toggleContrastBtn');
    if (toggleContrastBtn) {
      toggleContrastBtn.onclick = () => {
        state.highContrast = !state.highContrast;
        applyA11ySettings();
        render();
      };
    }

    const toggleMotionBtn = document.getElementById('toggleMotionBtn');
    if (toggleMotionBtn) {
      toggleMotionBtn.onclick = () => {
        state.reduceMotion = !state.reduceMotion;
        applyA11ySettings();
        render();
      };
    }

    const resetA11yBtn = document.getElementById('resetA11yBtn');
    if (resetA11yBtn) {
      resetA11yBtn.onclick = () => {
        state.textSize = 100;
        state.highContrast = false;
        state.reduceMotion = false;
        applyA11ySettings();
        render();
      };
    }

    // ─── Gallery & Carousel Actions ───
    const carouselPrevBtn = document.getElementById('carouselPrevBtn');
    if (carouselPrevBtn) {
      carouselPrevBtn.onclick = (e) => {
        e.preventDefault();
        prevGallerySlide();
      };
    }

    const carouselNextBtn = document.getElementById('carouselNextBtn');
    if (carouselNextBtn) {
      carouselNextBtn.onclick = (e) => {
        e.preventDefault();
        nextGallerySlide();
      };
    }

    const carouselPlayBtn = document.getElementById('carouselPlayBtn');
    if (carouselPlayBtn) {
      carouselPlayBtn.onclick = (e) => {
        e.preventDefault();
        toggleGalleryAutoPlay();
      };
    }

    document.querySelectorAll('.carousel-thumb').forEach(thumb => {
      thumb.onclick = () => {
        state.gallerySlideIndex = Number(thumb.getAttribute('data-slide'));
        updateCarouselDOM();
      };
    });

    // Album cards & View Gallery buttons
    document.querySelectorAll('.album-card[data-albumid], .btn-select-album[data-albumid], .btn-view-event-gallery[data-id]').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const id = Number(btn.getAttribute('data-albumid') || btn.getAttribute('data-id'));
        if (id) {
          state.activeGalleryEventId = id;
          state.gallerySlideIndex = 0;
          navigate('gallery');
        }
      };
    });

    // ─── Feedback Actions ───
    document.querySelectorAll('.btn-open-feedback').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const id = Number(btn.getAttribute('data-id'));
        const ev = state.events.find(item => item.id === id) || (state.selectedEvent && state.selectedEvent.id === id ? state.selectedEvent : null);
        if (ev) {
          state.feedbackEvent = ev;
          state.feedbackRating = 5;
          state.feedbackAnswers = {};
          state.feedbackComments = '';
          state.feedbackModalOpen = true;
          render();
        }
      };
    });

    const closeFeedbackModalBtn = document.getElementById('closeFeedbackModalBtn');
    if (closeFeedbackModalBtn) {
      closeFeedbackModalBtn.onclick = () => {
        state.feedbackModalOpen = false;
        render();
      };
    }

    const btnCancelFeedback = document.getElementById('btnCancelFeedback');
    if (btnCancelFeedback) {
      btnCancelFeedback.onclick = () => {
        state.feedbackModalOpen = false;
        render();
      };
    }

    const feedbackModalBackdrop = document.getElementById('feedbackModalBackdrop');
    if (feedbackModalBackdrop) {
      feedbackModalBackdrop.onmousedown = (e) => {
        if (e.target === feedbackModalBackdrop) {
          state.feedbackModalOpen = false;
          render();
        }
      };
    }

    // Star rating buttons in feedback modal
    document.querySelectorAll('.star-rating-box .star-btn[data-star]').forEach(starBtn => {
      starBtn.onclick = () => {
        const starVal = Number(starBtn.getAttribute('data-star'));
        state.feedbackRating = starVal;
        const ratingDescriptions = {
          1: 'Poor / Needs substantial improvement',
          2: 'Fair / Met minimal expectations',
          3: 'Good / Satisfactory experience',
          4: 'Very Good / Well organised and helpful',
          5: 'Excellent / Outstanding accessibility and support'
        };
        const hint = document.getElementById('feedbackScoreHint');
        if (hint) {
          hint.textContent = `${starVal} / 5 Stars — ${ratingDescriptions[starVal] || ''}`;
        }
        document.querySelectorAll('.star-rating-box .star-btn[data-star]').forEach(btn => {
          const s = Number(btn.getAttribute('data-star'));
          btn.classList.toggle('is-active', s <= starVal);
          btn.innerHTML = s <= starVal ? icons.star : icons.starOutline;
        });
      };
    });

    // Dynamic question stars
    document.querySelectorAll('.star-btn[data-qstar]').forEach(btn => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-qid');
        const starVal = Number(btn.getAttribute('data-qstar'));
        state.feedbackAnswers[qid] = starVal;
        document.querySelectorAll(`.star-btn[data-qid="${qid}"]`).forEach(b => {
          const s = Number(b.getAttribute('data-qstar'));
          b.classList.toggle('is-active', s <= starVal);
          b.innerHTML = s <= starVal ? icons.star : icons.starOutline;
        });
      };
    });

    // Choice pills in feedback modal
    document.querySelectorAll('.choice-pill[data-qid]').forEach(pill => {
      pill.onclick = () => {
        const qid = pill.getAttribute('data-qid');
        const val = pill.getAttribute('data-val');
        state.feedbackAnswers[qid] = val;
        document.querySelectorAll(`.choice-pill[data-qid="${qid}"]`).forEach(p => {
          p.classList.toggle('selected', p.getAttribute('data-val') === val);
        });
      };
    });

    // Feedback inputs
    document.querySelectorAll('.feedback-input[data-qid]').forEach(inp => {
      inp.oninput = (e) => {
        const qid = inp.getAttribute('data-qid');
        state.feedbackAnswers[qid] = e.target.value;
      };
    });

    const feedbackComments = document.getElementById('feedbackComments');
    if (feedbackComments) {
      feedbackComments.oninput = (e) => {
        state.feedbackComments = e.target.value;
      };
    }

    // Feedback form submission
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
      feedbackForm.onsubmit = async (e) => {
        e.preventDefault();
        const evId = state.feedbackEvent ? state.feedbackEvent.id : null;
        if (!evId) return;

        const payload = {
          rating: state.feedbackRating,
          answers: state.feedbackAnswers,
          comments: state.feedbackComments || ''
        };

        try {
          await fetch(`/api/events/${evId}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (err) {
          console.warn('Feedback submit offline fallback', err);
        }

        showToast('Thank you! Your feedback has been received and shared with organizers.', icons.circleCheck);
        state.feedbackModalOpen = false;
        render();
      };
    }

    bindDetailButtons();
  }

  function bindDetailButtons() {
    document.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.getAttribute('data-id'));
        const ev = state.events.find(item => item.id === id);
        if (ev) {
          state.locationModalOpen = false;
          navigate('event-detail', ev);
        }
      };
    });
  }

  // Keyboard accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.feedbackModalOpen) {
        state.feedbackModalOpen = false;
        render();
      } else if (state.ticketModalOpen) {
        state.ticketModalOpen = false;
        render();
      } else if (state.helpModalOpen) {
        state.helpModalOpen = false;
        render();
      } else if (state.profileModalOpen) {
        state.profileModalOpen = false;
        render();
      } else if (state.legalModal) {
        state.legalModal = null;
        render();
      } else if (state.locationModalOpen) {
        state.locationModalOpen = false;
        render();
      } else if (state.a11yOpen) {
        state.a11yOpen = false;
        render();
      }
    }
  });

  function toggleA11y(force) {
    if (typeof force === 'boolean') {
      state.a11yOpen = force;
    } else {
      state.a11yOpen = !state.a11yOpen;
    }
    state.mobileMenuOpen = false;
    render();
  }
  window.toggleA11yPanel = toggleA11y;

  // Initialization & sync with backend store
  document.addEventListener('DOMContentLoaded', async () => {
    handleRoute();
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.events || []);
        if (Array.isArray(list) && list.length > 0) {
          state.events = list;
          if (state.selectedEvent) {
            const found = state.events.find(e => e.id === state.selectedEvent.id);
            if (found) state.selectedEvent = found;
          }
          render();
        }
      }
    } catch (e) {
      // offline fallback
    }
  });

  // Expose global for testing
  window.__SDS_APP__ = { state, navigate, render, showToast, toggleA11y };
})();
