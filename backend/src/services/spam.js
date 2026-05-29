// Known honeypot field names — if any are present and non-empty, it's a bot
const HONEYPOT_FIELDS = ['_honeypot', '_gotcha', 'bot-field', 'website', 'hp', 'b_field'];

// Fields we strip from the stored data (internal FormForge control fields)
const INTERNAL_FIELDS = [
  '_honeypot', '_gotcha', 'bot-field', 'hp', 'b_field',
  '_redirect', '_subject', '_next',
];

/**
 * Checks whether a submission looks like spam.
 * Returns { isSpam: boolean, reason: string | null }
 */
function detectSpam(body) {
  if (!body || typeof body !== 'object') {
    return { isSpam: false, reason: null };
  }

  // 1. Honeypot check — bot filled a hidden field
  for (const field of HONEYPOT_FIELDS) {
    const val = body[field];
    if (val !== undefined && String(val).trim() !== '') {
      return { isSpam: true, reason: `Honeypot field "${field}" was filled` };
    }
  }

  // 2. Completely empty submission
  const dataKeys = Object.keys(body).filter(k => !k.startsWith('_') && !INTERNAL_FIELDS.includes(k));
  const hasContent = dataKeys.some(k => String(body[k] || '').trim() !== '');
  if (!hasContent) {
    return { isSpam: true, reason: 'Empty submission' };
  }

  return { isSpam: false, reason: null };
}

/**
 * Removes internal/honeypot fields from the data before storing.
 * Also removes _redirect, _subject, _next (FormForge control fields).
 */
function sanitizeData(body) {
  const cleaned = {};
  for (const [key, val] of Object.entries(body)) {
    if (!INTERNAL_FIELDS.includes(key)) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

/**
 * Extracts FormForge control fields from the body.
 * e.g. _redirect=https://mysite.com/thanks overrides the form's redirect_url
 */
function extractControls(body) {
  return {
    redirect: body._redirect || body._next || null,
    subject:  body._subject  || null,
  };
}

module.exports = { detectSpam, sanitizeData, extractControls };
