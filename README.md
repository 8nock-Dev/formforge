# 🔧 FormForge

**A self-hosted headless form backend. Point any HTML form or fetch() call at your endpoint — FormForge handles everything else.**

FormForge is an open-source alternative to Formspree, Basin, and Netlify Forms. Create a form endpoint in seconds, then collect submissions from any website, app, or tool — no backend code required on your end.

---

## Features

- **Zero-JS HTML forms** — works with plain `<form action="..." method="POST">`, no JavaScript required
- **JSON API** — `fetch()` and `axios` support with `Content-Type: application/json`
- **Spam protection** — honeypot field detection, automatic empty submission rejection
- **Per-IP rate limiting** — 10 submissions per 15 minutes per form
- **Email notifications** — HTML email alert on every new submission (SMTP/Gmail/SendGrid)
- **Webhook delivery** — POST to any URL including Slack, Discord, or custom endpoints
- **Per-form CORS** — restrict submissions to specific origins
- **Custom redirects** — control where users land after a HTML form submit
- **CSV export** — one-click download of all submissions
- **Submission inbox** — paginated table with unread indicators and click-to-expand
- **Code snippets** — copy-paste HTML, JavaScript, React, and cURL examples per form
- **Self-hostable** — runs on any VPS, Railway, Render, or Fly.io

---

## Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Backend   | Node.js 20, Express 4         |
| Database  | PostgreSQL 16 (JSONB storage) |
| Frontend  | React 18, Vite, Tailwind CSS  |
| Auth      | JWT                           |
| Email     | Nodemailer (SMTP)             |
| Spam      | Honeypot + express-rate-limit |
| Deploy    | Docker + Docker Compose       |

---

## Project Structure

```
formforge/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           # PostgreSQL pool + auto-migration
│   │   │   └── mailer.js       # Nodemailer SMTP transport
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification
│   │   │   └── rateLimit.js    # Per-IP rate limiter for submit endpoint
│   │   ├── routes/
│   │   │   ├── auth.js         # Register, login, /me
│   │   │   ├── forms.js        # CRUD + submissions + CSV export
│   │   │   └── submit.js       # PUBLIC: POST /f/:token
│   │   └── services/
│   │       ├── notifier.js     # Email + webhook dispatch
│   │       └── spam.js         # Honeypot detection + data sanitization
│   ├── migrations/001_initial.sql
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
└── frontend/
    └── src/
        ├── components/
        │   ├── FormCard.jsx        # Dashboard list item
        │   ├── FormModal.jsx       # Create/edit form
        │   ├── SubmissionTable.jsx # Paginated inbox with expand-on-click
        │   └── CodeSnippet.jsx     # HTML / JS / React / cURL snippets
        └── pages/
            ├── Login.jsx           # Login + register
            ├── Dashboard.jsx       # Form list + stats
            ├── FormDetail.jsx      # Submissions, integration, settings tabs
            └── ThankYou.jsx        # Default success redirect page
```

---

## Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/yourusername/formforge.git
cd formforge

# Start DB + backend
docker compose up -d db backend

# Start frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:5174**, create an account, and create your first form.

---

### Option B — Manual

**1. Backend**
```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

npm install
npm run dev
# → http://localhost:3002
```

**2. Frontend**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5174
```

---

## How to Integrate

### HTML Form (no JavaScript)
```html
<form action="https://your-formforge.com/f/YOUR_TOKEN" method="POST">
  <input type="hidden" name="_redirect" value="https://yoursite.com/thanks" />
  <input type="text"   name="_honeypot" style="display:none" tabindex="-1" />
  <input type="text"   name="name"    required placeholder="Name" />
  <input type="email"  name="email"   required placeholder="Email" />
  <textarea            name="message" placeholder="Message"></textarea>
  <button type="submit">Send</button>
</form>
```

### JavaScript / fetch
```js
const res = await fetch('https://your-formforge.com/f/YOUR_TOKEN', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, message }),
});
const { ok, id } = await res.json();
```

### Control fields
| Field        | Description                                           |
|--------------|-------------------------------------------------------|
| `_redirect`  | Override redirect URL for this submission             |
| `_honeypot`  | Leave empty — if filled, submission is marked as spam |
| `_subject`   | Custom email subject (used in notification)           |

---

## API Reference

### Public
| Method  | Endpoint       | Description                            |
|---------|----------------|----------------------------------------|
| POST    | `/f/:token`    | Submit a form (JSON or form-encoded)   |
| OPTIONS | `/f/:token`    | CORS preflight                         |

### Authenticated (Bearer JWT)
| Method | Endpoint                                  | Description              |
|--------|-------------------------------------------|--------------------------|
| POST   | `/api/auth/register`                      | Create account           |
| POST   | `/api/auth/login`                         | Get JWT token            |
| GET    | `/api/auth/me`                            | Current user             |
| GET    | `/api/forms`                              | List forms (with counts) |
| POST   | `/api/forms`                              | Create form              |
| GET    | `/api/forms/:id`                          | Get form                 |
| PUT    | `/api/forms/:id`                          | Update form              |
| DELETE | `/api/forms/:id`                          | Delete form + data       |
| GET    | `/api/forms/:id/submissions`              | List submissions (paged) |
| GET    | `/api/forms/:id/submissions/export`       | Download CSV             |
| PATCH  | `/api/forms/:id/submissions/:sid/read`    | Mark as read             |
| DELETE | `/api/forms/:id/submissions/:sid`         | Delete submission        |

---

## Deployment

### Railway
```bash
railway new
railway add postgresql
# Set environment variables in the dashboard
railway up
```

### Render
1. Create **Web Service** → `backend/` → build: `npm install`, start: `npm start`
2. Create **PostgreSQL** database → link via `DATABASE_URL`
3. Create **Static Site** → `frontend/` → build: `npm run build`, publish: `dist/`

### Fly.io
```bash
cd backend
fly launch
fly secrets set JWT_SECRET=... DATABASE_URL=...
fly deploy
```

---

## Why FormForge beats the alternatives

| Feature              | FormForge  | Formspree Free | Netlify Forms |
|----------------------|------------|----------------|---------------|
| Self-hosted          | ✅         | ❌             | ❌            |
| Unlimited forms      | ✅         | ❌ (1 form)    | ✅            |
| Unlimited submissions| ✅         | ❌ (50/month)  | ❌ (100/month)|
| Custom redirect      | ✅         | ❌ (paid)      | ✅            |
| Webhook support      | ✅         | ❌ (paid)      | ❌            |
| CSV export           | ✅         | ❌ (paid)      | ❌            |
| JSON API             | ✅         | ✅             | ❌            |
| Monthly cost         | $0 (self)  | $0–$19         | $0–$19        |

---

## License

MIT — use it, host it, build on it.

---

*Built with Node.js, React, and PostgreSQL.*
