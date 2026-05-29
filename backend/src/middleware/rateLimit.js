const rateLimit = require('express-rate-limit');

/**
 * Applied to POST /f/:token
 * Limits each IP to 10 submissions per 15 minutes across all forms.
 * For per-form rate limiting we combine IP + token in the key.
 */
const submitRateLimit = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              10,              // max 10 submissions per IP per window
  standardHeaders:  true,
  legacyHeaders:    false,
  keyGenerator: (req) => `${req.ip}:${req.params.token}`,
  handler: (req, res) => {
    // Respect content negotiation — HTML forms get a plain error, JSON clients get JSON
    if (wantsJson(req)) {
      return res.status(429).json({
        error: 'Too many submissions. Please wait before trying again.',
      });
    }
    return res.status(429).send(
      '<h1>Too many submissions</h1><p>Please wait a moment before trying again.</p>'
    );
  },
});

function wantsJson(req) {
  const accept = req.headers.accept || '';
  const ct     = req.headers['content-type'] || '';
  return accept.includes('application/json') || ct.includes('application/json');
}

module.exports = { submitRateLimit };
