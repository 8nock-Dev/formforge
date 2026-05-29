const express  = require('express');
const { pool } = require('../config/db');
const { submitRateLimit } = require('../middleware/rateLimit');
const { detectSpam, sanitizeData, extractControls } = require('../services/spam');
const { notifySubmission } = require('../services/notifier');

const router = express.Router();

/**
 * POST /f/:token
 *
 * The PUBLIC form submission endpoint.
 * Accepts:
 *   - application/json          (fetch/axios from JS)
 *   - application/x-www-form-urlencoded  (plain HTML <form>)
 *   - multipart/form-data       (HTML <form enctype="multipart/form-data">)
 *
 * Response:
 *   - JSON clients  → { ok: true, id: submissionId }
 *   - Browser forms → 302 redirect to redirect_url or /thanks
 */
router.post('/:token', submitRateLimit, async (req, res) => {
  const { token } = req.params;

  // ─── 1. Load the form ─────────────────────────────────
  let form;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM forms WHERE endpoint_token=$1 AND is_active=true',
      [token]
    );
    if (!rows.length) {
      return respond(req, res, 404, 'Form not found or disabled.', null, null);
    }
    form = rows[0];
  } catch (err) {
    console.error('[Submit/lookup]', err.message);
    return respond(req, res, 500, 'Server error. Please try again.', null, null);
  }

  // ─── 2. CORS check ────────────────────────────────────
  const origin = req.headers.origin;
  if (form.allowed_origins?.length && origin) {
    const allowed = form.allowed_origins.some(o =>
      o === '*' || o === origin || origin.endsWith(o.replace(/^\*/, ''))
    );
    if (!allowed) {
      res.setHeader('Access-Control-Allow-Origin', 'null');
      return respond(req, res, 403, 'This origin is not allowed to submit to this form.', null, null);
    }
  }

  // Set CORS headers for the allowed origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  // ─── 3. Extract body ──────────────────────────────────
  const rawBody = req.body || {};
  const controls = extractControls(rawBody);
  const data     = sanitizeData(rawBody);

  // ─── 4. Spam detection ────────────────────────────────
  const { isSpam, reason } = form.spam_protection
    ? detectSpam(rawBody)
    : { isSpam: false, reason: null };

  if (isSpam) {
    console.log(`[Submit] Spam blocked for form ${form.id}: ${reason}`);
    // For spam: silently succeed for bots (don't reveal they were caught)
    // but still return a valid response so legit honeypot testers can debug
    const redirectTo = controls.redirect || form.redirect_url
      || `${process.env.APP_URL || ''}/thanks?form=${encodeURIComponent(form.name)}&status=ok`;
    return respond(req, res, 200, null, { ok: true, id: null }, redirectTo);
  }

  // ─── 5. Validate — at least one field must have a value ───
  const hasData = Object.keys(data).some(k => String(data[k] || '').trim() !== '');
  if (!hasData) {
    return respond(req, res, 422, 'Submission must include at least one non-empty field.', null, null);
  }

  // ─── 6. Store submission ──────────────────────────────
  let submission;
  try {
    const ip       = req.ip || req.socket.remoteAddress;
    const referrer = req.headers.referer || req.headers.referrer || null;

    const { rows } = await pool.query(
      `INSERT INTO submissions (form_id, data, submitter_ip, referrer, origin, is_spam)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *`,
      [form.id, JSON.stringify(data), ip, referrer, origin || null, false]
    );
    submission = rows[0];

    // Update running counter
    await pool.query(
      'UPDATE forms SET submission_count = submission_count + 1 WHERE id=$1',
      [form.id]
    );
  } catch (err) {
    console.error('[Submit/store]', err.message);
    return respond(req, res, 500, 'Failed to save submission.', null, null);
  }

  // ─── 7. Notify (async — don't block the response) ────
  notifySubmission(form, submission).catch(err =>
    console.error('[Submit/notify]', err.message)
  );

  // ─── 8. Respond ──────────────────────────────────────
  const redirectTo = controls.redirect
    || form.redirect_url
    || `${process.env.APP_URL || ''}/thanks?form=${encodeURIComponent(form.name)}`;

  return respond(req, res, 200, null, { ok: true, id: submission.id }, redirectTo);
});

/**
 * OPTIONS /f/:token
 * Handles CORS preflight from JavaScript fetch/axios.
 */
router.options('/:token', async (req, res) => {
  const { token } = req.params;
  const origin = req.headers.origin;

  try {
    const { rows } = await pool.query(
      'SELECT allowed_origins FROM forms WHERE endpoint_token=$1',
      [token]
    );
    if (!rows.length) return res.status(404).end();

    const form = rows[0];
    const allowedOrigin = resolveOrigin(form.allowed_origins, origin);

    res.setHeader('Access-Control-Allow-Origin',  allowedOrigin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Max-Age',       '86400');
    res.status(204).end();
  } catch {
    res.status(500).end();
  }
});

// ─── Helpers ──────────────────────────────────────────────

function resolveOrigin(allowedOrigins, requestOrigin) {
  if (!allowedOrigins?.length) return requestOrigin || '*';
  if (allowedOrigins.includes('*')) return '*';
  if (allowedOrigins.includes(requestOrigin)) return requestOrigin;
  return null;
}

/**
 * Unified response handler — detects whether the client wants JSON or is a browser form.
 */
function respond(req, res, status, errorMessage, jsonPayload, redirectUrl) {
  const ct     = req.headers['content-type'] || '';
  const accept = req.headers['accept'] || '';

  // JSON client = fetch/axios (sends Content-Type: application/json OR Accept: application/json)
  const isJsonClient = ct.includes('application/json') || accept.includes('application/json');

  if (isJsonClient) {
    if (errorMessage) {
      return res.status(status).json({ ok: false, error: errorMessage });
    }
    return res.status(status).json(jsonPayload);
  }

  // Browser form client
  if (errorMessage) {
    return res.status(status).send(`
      <html><head><title>Error</title></head>
      <body style="font-family:sans-serif;padding:40px;max-width:400px;margin:0 auto;">
        <h2>Submission Error</h2>
        <p>${errorMessage}</p>
        <p><a href="javascript:history.back()">← Go back</a></p>
      </body></html>
    `);
  }

  if (redirectUrl) {
    return res.redirect(302, redirectUrl);
  }

  return res.status(status).json(jsonPayload);
}

module.exports = router;
