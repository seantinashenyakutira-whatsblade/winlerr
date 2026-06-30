// Resend email helpers — server-side only
// Called from admin panel or Supabase Edge Functions
// Never expose RESEND_API_KEY in frontend code

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY
const RESEND_FROM = import.meta.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'Winlerr <hello@winlerr.com>'
const ADMIN_EMAIL = import.meta.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL

const RESEND_API = 'https://api.resend.com'

async function resendFetch(endpoint, body) {
  if (!RESEND_API_KEY) {
    console.warn('[Winlerr Resend] RESEND_API_KEY not set. Skipping email.')
    return { error: 'RESEND_API_KEY not configured' }
  }
  try {
    const res = await fetch(`${RESEND_API}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) return { error: data }
    return { data }
  } catch (err) {
    return { error: err.message }
  }
}

export async function addContact({ email, firstName, lastName }) {
  return resendFetch('/audiences/contacts', {
    email,
    first_name: firstName || '',
    last_name: lastName || '',
    unsubscribed: false,
  })
}

export async function sendEmail({ to, subject, html, replyTo }) {
  return resendFetch('/emails', {
    from: RESEND_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    reply_to: replyTo || undefined,
  })
}

export async function sendBatch(emails) {
  return resendFetch('/emails/batch', {
    messages: emails.map(e => ({
      from: RESEND_FROM,
      to: Array.isArray(e.to) ? e.to : [e.to],
      subject: e.subject,
      html: e.html,
    })),
  })
}

// ===== WINLERR SPECIFIC EMAILS =====

export async function sendWelcomeEmail({ email, fullName }) {
  return sendEmail({
    to: email,
    subject: 'Welcome to Winlerr Early Access 🚀',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="font-size:24px;margin-bottom:8px">Welcome to Winlerr, ${fullName}!</h1>
        <p style="color:#475569;font-size:16px;line-height:1.6">
          Thanks for joining the early access list. You're now among the first businesses
          to experience Winlerr — a platform built to help you manage your website, content,
          customer engagement, and automation from one place.
        </p>
        <p style="color:#475569;font-size:16px;line-height:1.6">
          We'll keep you updated as we build toward launch. In the meantime, feel free
          to <a href="${process.env.SITE_URL || 'https://winlerr.com'}/#prototype" style="color:#0A84FF">request your free prototype</a>
          and tell us what your business needs.
        </p>
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0" />
        <p style="color:#94A3B8;font-size:14px">Winlerr — Automate. Optimize. Grow.</p>
      </div>
    `,
  })
}

export async function sendAdminNotification({ type, data }) {
  if (!ADMIN_EMAIL) return { error: 'ADMIN_NOTIFICATION_EMAIL not set' }

  let subject, html
  if (type === 'prototype') {
    subject = `New Prototype Request — ${data.businessName}`
    html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2>New Prototype Request</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #E2E8F0;font-weight:600">Business</td><td style="padding:8px;border:1px solid #E2E8F0">${data.businessName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #E2E8F0;font-weight:600">Contact</td><td style="padding:8px;border:1px solid #E2E8F0">${data.fullName} — ${data.email || 'No email'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #E2E8F0;font-weight:600">Type</td><td style="padding:8px;border:1px solid #E2E8F0">${data.prototypeType || 'Not specified'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #E2E8F0;font-weight:600">Country</td><td style="padding:8px;border:1px solid #E2E8F0">${data.country || 'Not specified'}</td></tr>
        </table>
        <p><a href="${process.env.SITE_URL || 'https://winlerr.com'}/admin.html" style="color:#0A84FF">View in admin panel</a></p>
      </div>
    `
  } else if (type === 'suggestion') {
    subject = `New Feature Suggestion — ${data.feature?.substring(0, 40)}...`
    html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2>New Feature Suggestion</h2>
        <p><strong>From:</strong> ${data.fullName} — ${data.businessName}</p>
        <p><strong>Feature:</strong> ${data.feature}</p>
        <p><strong>Reason:</strong> ${data.reason || 'Not provided'}</p>
      </div>
    `
  } else {
    return { error: 'Unknown notification type' }
  }

  return sendEmail({ to: ADMIN_EMAIL, subject, html })
}

export async function sendNewsletter({ to, subject, html }) {
  return sendEmail({ to, subject, html })
}

export async function sendTestEmail({ subject, html }) {
  if (!ADMIN_EMAIL) return { error: 'ADMIN_NOTIFICATION_EMAIL not set' }
  return sendEmail({ to: ADMIN_EMAIL, subject: `[TEST] ${subject}`, html })
}
