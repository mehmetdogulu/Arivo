# CLAUDE.md — Arivo Codebase Guide

This document provides AI assistants with an accurate, up-to-date understanding of the Arivo codebase, its conventions, and development workflows.

---

## Project Overview

**Arivo** is a hotel guest experience platform delivered as a collection of standalone single-page applications (SPAs). There is no build pipeline or framework — everything is vanilla HTML5, CSS3, and ES6+ JavaScript served directly via Cloudflare Pages, with Supabase as the database and Anthropic Claude as the AI concierge backend.

**Deployment URL:** `https://myarivo.pages.dev/`

---

## Repository Structure

```
/
├── functions/
│   └── api/
│       └── claude.js              # Cloudflare Worker — Claude API proxy
├── index.html                     # Marketing / landing page
├── hotel-guest-app.html           # Mobile PWA for hotel guests (primary app)
├── hotel-dashboard.html           # Hotel management dashboard
├── staff-dashboard.html           # Staff task management
├── super-admin.html               # Super admin panel
├── hotel-onboarding.html          # Hotel setup wizard
├── consent-flow.html              # Guest consent / privacy flow
├── qr-key-card.html               # QR key card functionality
├── legal-documents.html           # Legal info aggregator
├── privacy-policy.html            # Privacy policy
├── terms-and-conditions.html      # Terms of service
├── cookie-policy.html             # Cookie policy
├── product-roadmap.html           # Feature roadmap
└── pwa-engineer-guide.html        # Internal PWA engineering documentation
```

Each HTML file is fully self-contained: all CSS is in a `<style>` block and all JavaScript is in a `<script>` block at the bottom of the file.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML5 / CSS3 / ES6+ JavaScript |
| Database & Auth | Supabase (PostgreSQL, v2 SDK via CDN) |
| Serverless Functions | Cloudflare Workers (`functions/api/`) |
| AI Concierge | Anthropic Claude API (proxied via Worker) |
| Hosting | Cloudflare Pages |
| Fonts | Google Fonts (Cormorant Garamond, DM Sans, Instrument Serif, Geist) |

**There is no npm, no build step, no bundler, no transpiler.** Files are edited and served as-is.

---

## Architecture

### SPA Screen Pattern

Every application implements a screen-based router using CSS visibility:

```html
<!-- Each "page" is a full-height screen div -->
<div id="screen-welcome" class="screen active">...</div>
<div id="screen-requests" class="screen">...</div>
```

```javascript
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
```

Screens are switched by toggling the `active` class — no URL routing is used.

### Guest App Screen Flow

```
consent → registration / bypass → welcome → app (tabs)
                                              ├── home/info
                                              ├── requests
                                              ├── offers
                                              ├── messages (AI concierge)
                                              ├── dining
                                              ├── concierge
                                              └── profile
```

### Claude API Proxy

The Cloudflare Worker at `functions/api/claude.js` proxies requests to the Anthropic API:

- **Endpoint:** `POST /api/claude`
- **CORS:** `Access-Control-Allow-Origin: *`
- **Auth:** `ANTHROPIC_API_KEY` environment variable (set in Cloudflare dashboard, never in code)
- **Request/response:** Passes through Claude API format unchanged

---

## Design System

### Color Palette (CSS Custom Properties)

```css
:root {
  --forest:     #1E3A2F;   /* Primary dark green */
  --gold:       #B8933F;   /* Accent gold */
  --gold-light: #D4AF6A;   /* Light gold */
  --cream:      #F5F0E8;   /* Light background */
  --white:      #FDFCF9;   /* Pure white */
  --charcoal:   #1A1A1A;   /* Dark text */
  --red:        #DC2626;   /* Error / alert */
  --green:      #16A34A;   /* Success */
  --amber:      #D97706;   /* Warning */
}
```

Always use these variables — do not hardcode hex values.

### Typography

- **Headings:** Cormorant Garamond (serif, brand)
- **Body / UI:** DM Sans (sans-serif, readable)
- **Accent:** Instrument Serif or Geist where specified

### Component Class Conventions

| Pattern | Purpose |
|---|---|
| `.screen` | Full-height view container |
| `.btn-primary`, `.btn-secondary`, `.btn-gold`, `.btn-red` | Button variants |
| `.card` | Elevated content container |
| `.stat-*` | Statistics/metric display |
| `.modal-*` | Overlay/modal elements |
| `.tab-*` | Tab navigation |
| `.fg` | Form group wrapper |
| `.fl` | Form label |
| `.fi` | Form input |
| `.f-err` | Form error message |
| `.f-hint` | Form hint text |

### State Modifier Classes

| Class | Meaning |
|---|---|
| `.active` | Currently selected screen or tab |
| `.show` | Visible (for toggled elements) |
| `.on` | Enabled state |
| `.open` | Open state (sidebar, modal) |
| `.hide` | Explicitly hidden |

### ID Conventions

| Pattern | Example |
|---|---|
| `#screen-[name]` | `#screen-login`, `#screen-requests` |
| `#[feature]-[element]` | `#request-form`, `#staff-list` |
| `#sl` | Splash/loader overlay |
| `#sd` | Sidebar drawer |
| `#msg-badge` | Notification badge |

### Animation Timings

| Duration | Use |
|---|---|
| `0.15s` | Quick UI feedback (button press, toggle) |
| `0.2s–0.35s` | Screen transitions |
| `0.3s–0.4s` | Modal open/close |

Standard easing: `ease` or `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design).

Named keyframes in use: `fadeUp`, `popIn`, `slideDown`.

---

## Supabase Integration

The Supabase client is initialized in each HTML file that needs database access:

```javascript
const SUPABASE_URL = 'https://htisbhrvnwzvmkjhqgcr.supabase.co';
const SUPABASE_KEY = '<anon_key>'; // Public anon key — safe to expose in client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
```

The anon key is a public key governed by Supabase RLS (Row Level Security) policies — it is intentionally embedded in client code.

### Key Database Tables (inferred)

| Table | Key Columns |
|---|---|
| `hotels` | id, name, location, rooms, settings |
| `guests` | id, name, email, phone, room_number, hotel_id, check_in_date, check_out_date, consent_given |
| `requests` | id, guest_id, type, status, priority, description, created_at, completed_at |
| `staff` | id, name, email, hotel_id, role, avatar, status |
| `messages` | id, guest_id, content, role, created_at, session_id |
| `audit_logs` | id, action, user_id, resource, timestamp |

Request statuses: `new`, `pending`, `in-progress`, `completed`
Request types: `service`, `dining`, `concierge`
Staff roles: `staff`, `manager`, `admin`
Message roles: `guest`, `concierge`, `system`

---

## JavaScript Conventions

### DOM Interaction

- Use `document.getElementById()` for specific elements (preferred)
- Use `document.querySelector()` / `querySelectorAll()` for CSS selector queries
- Inline `onclick` attributes are used throughout — maintain this pattern
- No event delegation library; handlers are bound explicitly

### State Management

- **Session state:** `localStorage` and `sessionStorage` (cleared on browser close)
- **No state management library** — DOM is the source of truth
- Data flows: fetch from Supabase → update DOM directly

### Async Pattern

```javascript
// Standard async/await with try/catch
async function loadData() {
  try {
    const { data, error } = await supabase.from('table').select('*');
    if (error) throw error;
    renderData(data);
  } catch (err) {
    showError(err.message);
  }
}
```

### Debouncing

Debounce is used for search/lookup inputs:

```javascript
let debounceTimer;
function debounceLookup() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(performLookup, 300);
}
```

### Form Validation Pattern

```javascript
// Show error
document.getElementById('email-err').classList.add('show');

// Hide error
document.getElementById('email-err').classList.remove('show');
```

Validation is triggered on `blur` or `input` events; errors are shown inline below the relevant field using `.f-err.show`.

---

## CSS Conventions

### Layout

- **CSS Grid** for page layouts (2–3 column grids)
- **Flexbox** for component-level composition
- **Mobile-first** — base styles target mobile; `@media (max-width: 768px)` adjusts for larger displays as needed

### Responsive Breakpoints

| Breakpoint | Target |
|---|---|
| Default | Mobile (primary) |
| `max-width: 768px` | Tablet and smaller |
| `max-width: 480px` | Small phones |

### Backgrounds and Decoration

- Use `::before` / `::after` pseudo-elements for decorative backgrounds and overlays
- Use CSS `linear-gradient()` and `radial-gradient()` for visual hierarchy
- `box-shadow` is used heavily for elevation; prefer `var(--shadow)` if defined

---

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Cloudflare Worker env | Required for Claude API calls |
| `SUPABASE_URL` | Client HTML (embedded) | Supabase project URL |
| `SUPABASE_ANON_KEY` | Client HTML (embedded) | Public Supabase anon key |

**Never put `ANTHROPIC_API_KEY` in any HTML file.** It must only exist as a Cloudflare Worker secret.

---

## Development Workflow

### Editing Files

1. Edit HTML files directly — no compilation or build step needed
2. Open the file in a browser or use a local static server (e.g., `python3 -m http.server 8080`)
3. Refresh the browser to see changes

### Git Workflow

```bash
# Feature branches follow the pattern:
git checkout -b claude/[feature-name]-[id]

# Commit frequently with descriptive messages:
git add [specific-files]
git commit -m "Descriptive message"

# Push:
git push -u origin [branch-name]
```

### Deployment

Cloudflare Pages auto-deploys on push to `main`. The `functions/` directory is automatically detected and deployed as Cloudflare Workers.

---

## Testing

**There are currently no automated tests.** Testing is manual:

1. Open the relevant HTML file in a browser
2. Test user flows end-to-end
3. Verify Supabase queries in the Supabase dashboard
4. Test Claude API responses via browser network tab

When adding tests in the future, prefer lightweight tools that don't require a build step (e.g., plain Jest with jsdom, or Playwright for E2E).

---

## Security Guidelines

- **Never** commit `ANTHROPIC_API_KEY` to any file — it belongs in Cloudflare Worker secrets only
- Supabase anon keys in HTML are acceptable (governed by RLS policies)
- All Claude API calls must go through the `/api/claude` proxy — never call the Anthropic API directly from the browser
- Validate and sanitize all user input before inserting into Supabase
- CORS on the Worker is currently `*` — restrict to the production domain when hardening

---

## Key Files Quick Reference

| File | Purpose |
|---|---|
| `hotel-guest-app.html` | Primary app — most actively developed |
| `hotel-dashboard.html` | Hotel manager interface — largest file (~124K) |
| `staff-dashboard.html` | Staff-facing task management |
| `super-admin.html` | Super admin: manage hotels and users |
| `functions/api/claude.js` | Only backend code — Claude API proxy |
| `index.html` | Public marketing landing page |
| `consent-flow.html` | GDPR/privacy consent wizard |

---

## What NOT to Do

- Do not introduce npm packages, build tools, or framework dependencies without explicit discussion
- Do not add `<script src="...">` CDN links for heavy libraries (React, Vue, etc.)
- Do not split a single HTML app into multiple files — maintain the self-contained pattern
- Do not hardcode hex color values — use CSS variables
- Do not call the Anthropic API directly from browser JavaScript — always use the `/api/claude` proxy
- Do not store secrets in HTML files
- Do not refactor working code without being asked — scope changes to what was requested
