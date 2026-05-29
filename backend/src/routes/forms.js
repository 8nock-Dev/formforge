const express  = require('express');
const crypto   = require('crypto');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ─── GET /api/forms ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
          f.*,
          COUNT(s.id) FILTER (WHERE s.is_spam = false)               AS submission_count,
          COUNT(s.id) FILTER (WHERE s.is_spam = false AND s.is_read = false) AS unread_count
        FROM forms f
        LEFT JOIN submissions s ON s.form_id = f.id
        WHERE f.user_id = $1
        GROUP BY f.id
        ORDER BY f.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Forms/list]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/forms/:id ───────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM forms WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Form not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/forms/:id/submissions ──────────────────────
router.get('/:id/submissions', async (req, res) => {
  try {
    const form = await getOwnedForm(req.params.id, req.user.userId);
    if (!form) return res.status(404).json({ error: 'Form not found' });

    const page    = Math.max(1, parseInt(req.query.page)  || 1);
    const limit   = Math.min(100, parseInt(req.query.limit) || 25);
    const offset  = (page - 1) * limit;
    const spam    = req.query.spam === 'true';

    const { rows } = await pool.query(
      `SELECT * FROM submissions
        WHERE form_id=$1 AND is_spam=$2
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4`,
      [req.params.id, spam, limit, offset]
    );

    const total = await pool.query(
      'SELECT COUNT(*) FROM submissions WHERE form_id=$1 AND is_spam=$2',
      [req.params.id, spam]
    );

    res.json({
      submissions: rows,
      total: parseInt(total.rows[0].count),
      page,
      limit,
      pages: Math.ceil(total.rows[0].count / limit),
    });
  } catch (err) {
    console.error('[Forms/submissions]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/forms/:id/submissions/export ────────────────
// Streams a CSV of all non-spam submissions
router.get('/:id/submissions/export', async (req, res) => {
  try {
    const form = await getOwnedForm(req.params.id, req.user.userId);
    if (!form) return res.status(404).json({ error: 'Form not found' });

    const { rows } = await pool.query(
      `SELECT data, submitter_ip, referrer, origin, created_at
        FROM submissions
        WHERE form_id=$1 AND is_spam=false
        ORDER BY created_at DESC`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(200).send('No submissions to export.');
    }

    // Collect all unique keys across all submissions
    const allKeys = new Set();
    rows.forEach(r => Object.keys(r.data).forEach(k => allKeys.add(k)));
    const dataKeys = [...allKeys].filter(k => !k.startsWith('_'));

    const metaKeys  = ['submitted_at', 'ip', 'referrer', 'origin'];
    const allCols   = [...dataKeys, ...metaKeys];

    const escape = (val) => {
      if (val == null) return '';
      const s = String(val).replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${form.name.replace(/[^a-z0-9]/gi, '_')}_submissions.csv"`);

    // Header row
    res.write(allCols.map(escape).join(',') + '\n');

    // Data rows
    rows.forEach(r => {
      const row = [
        ...dataKeys.map(k => escape(r.data[k])),
        escape(r.created_at),
        escape(r.submitter_ip),
        escape(r.referrer),
        escape(r.origin),
      ];
      res.write(row.join(',') + '\n');
    });

    res.end();
  } catch (err) {
    console.error('[Forms/export]', err.message);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ─── POST /api/forms ──────────────────────────────────────
router.post('/', async (req, res) => {
  const {
    name, allowed_origins, redirect_url,
    notify_email, notify_webhook, spam_protection = true,
  } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Form name is required' });

  // Generate unique public token
  const endpoint_token = crypto.randomBytes(16).toString('hex'); // 32-char hex

  try {
    const { rows } = await pool.query(
      `INSERT INTO forms
          (user_id, name, endpoint_token, allowed_origins, redirect_url,
           notify_email, notify_webhook, spam_protection)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
      [
        req.user.userId,
        name.trim(),
        endpoint_token,
        allowed_origins?.length ? allowed_origins : null,
        redirect_url || null,
        notify_email || null,
        notify_webhook || null,
        Boolean(spam_protection),
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Forms/create]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/forms/:id ───────────────────────────────────
router.put('/:id', async (req, res) => {
  const {
    name, allowed_origins, redirect_url,
    notify_email, notify_webhook, spam_protection, is_active,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE forms SET
          name             = COALESCE($1, name),
          allowed_origins  = $2,
          redirect_url     = $3,
          notify_email     = $4,
          notify_webhook   = $5,
          spam_protection  = COALESCE($6, spam_protection),
          is_active        = COALESCE($7, is_active),
          updated_at       = NOW()
        WHERE id=$8 AND user_id=$9
        RETURNING *`,
      [
        name?.trim() || null,
        allowed_origins?.length ? allowed_origins : null,
        redirect_url || null,
        notify_email || null,
        notify_webhook || null,
        spam_protection != null ? Boolean(spam_protection) : null,
        is_active != null ? Boolean(is_active) : null,
        req.params.id,
        req.user.userId,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Form not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[Forms/update]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/forms/:id ────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM forms WHERE id=$1 AND user_id=$2 RETURNING name',
      [req.params.id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Form not found' });
    res.json({ message: `Form "${rows[0].name}" deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/forms/:formId/submissions/:sid/read ───────
router.patch('/:id/submissions/:sid/read', async (req, res) => {
  try {
    const form = await getOwnedForm(req.params.id, req.user.userId);
    if (!form) return res.status(404).json({ error: 'Form not found' });

    await pool.query(
      'UPDATE submissions SET is_read=true WHERE id=$1 AND form_id=$2',
      [req.params.sid, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/forms/:id/submissions/:sid ───────────────
router.delete('/:id/submissions/:sid', async (req, res) => {
  try {
    const form = await getOwnedForm(req.params.id, req.user.userId);
    if (!form) return res.status(404).json({ error: 'Form not found' });

    await pool.query(
      'DELETE FROM submissions WHERE id=$1 AND form_id=$2',
      [req.params.sid, req.params.id]
    );
    res.json({ message: 'Submission deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Helper ───────────────────────────────────────────────
async function getOwnedForm(formId, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM forms WHERE id=$1 AND user_id=$2',
    [formId, userId]
  );
  return rows[0] || null;
}

module.exports = router;
