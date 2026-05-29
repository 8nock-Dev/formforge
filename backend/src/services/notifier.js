const axios     = require('axios');
const { sendEmail } = require('../config/mailer');

const APP_URL = () => process.env.APP_URL || 'http://localhost:5174';

/**
 * Sends a new-submission notification via email and/or webhook.
 */
async function notifySubmission(form, submission) {
  const promises = [];

  if (form.notify_email) {
    promises.push(sendEmailAlert(form, submission));
  }

  if (form.notify_webhook) {
    promises.push(sendWebhook(form, submission));
  }

  await Promise.allSettled(promises);
}

// ─────────────────────────────────────────────────────────
// Email alert
// ─────────────────────────────────────────────────────────
async function sendEmailAlert(form, submission) {
  const subject = `📬 New submission on "${form.name}"`;

  const rows = Object.entries(submission.data)
    .filter(([k]) => !k.startsWith('_'))
    .map(([k, v]) => `
      <tr>
        <td style="padding:8px 12px;font-size:13px;color:#6B7280;font-weight:500;vertical-align:top;white-space:nowrap;border-bottom:1px solid #F3F4F6;">${escapeHtml(k)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#111827;vertical-align:top;border-bottom:1px solid #F3F4F6;">${escapeHtml(String(v ?? ''))}</td>
      </tr>`)
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F9FAFB;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
    <div style="background:#4F46E5;padding:20px 24px;">
      <h1 style="color:white;margin:0;font-size:18px;font-weight:600;">📬 New Form Submission</h1>
      <p style="color:#A5B4FC;margin:4px 0 0;font-size:13px;">${escapeHtml(form.name)}</p>
    </div>
    <div style="padding:0;">
      <table style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
    </div>
    <div style="padding:16px 24px;background:#F9FAFB;border-top:1px solid #E5E7EB;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">
        Submitted ${new Date(submission.created_at).toUTCString()}<br>
        IP: ${submission.submitter_ip || 'unknown'} · Referrer: ${submission.referrer || 'direct'}
      </p>
      <a href="${APP_URL()}" style="display:inline-block;margin-top:12px;background:#111827;color:white;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:500;">
        View on FormForge →
      </a>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendEmail({ to: form.notify_email, subject, html });
  } catch (err) {
    console.error(`[Notifier] Email failed for form ${form.id}:`, err.message);
  }
}

// ─────────────────────────────────────────────────────────
// Webhook (Slack, Discord, or custom HTTP endpoint)
// ─────────────────────────────────────────────────────────
async function sendWebhook(form, submission) {
  // Slack/Discord compatible payload
  const payload = {
    text: `📬 New submission on *${form.name}*`,
    form_id:   form.id,
    form_name: form.name,
    submission_id: submission.id,
    data:      submission.data,
    submitted_at: submission.created_at,
    dashboard: `${APP_URL()}/forms/${form.id}`,
  };

  try {
    await axios.post(form.notify_webhook, payload, { timeout: 10000 });
  } catch (err) {
    console.error(`[Notifier] Webhook failed for form ${form.id}:`, err.message);
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { notifySubmission };
