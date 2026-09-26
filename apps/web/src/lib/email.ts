/**
 * Transactional email for the gift-claim flow, backed by Resend.
 *
 * Hard rules (from the task brief):
 *  - `RESEND_API_KEY` and `OWNER_EMAIL` may not exist yet. A missing key logs a
 *    warning and is skipped — it must NEVER throw and never fails a claim.
 *  - Nothing here logs a key, an API error payload, or full message bodies.
 *
 * `resend` (the official Node SDK) is used: the `@resend/node` package named in
 * the brief does not exist on the npm registry (404).
 */
import { Resend } from "resend";

const FROM = "Winlerr <hello@winlerr.vip>";
const WHATSAPP_URL = "https://wa.me/260776950796";

export interface EmailResult {
  sent: boolean;
  skipped?: boolean;
}

export interface ClaimDetails {
  businessName: string;
  slug: string;
}

export interface ClaimNotification extends ClaimDetails {
  email: string;
  whatsapp?: string;
}

let client: Resend | null = null;

function readApiKey(): string | null {
  const key = process.env["RESEND_API_KEY"];
  return key && key.trim().length > 0 ? key.trim() : null;
}

function getClient(key: string): Resend {
  if (!client) client = new Resend(key);
  return client;
}

/** Minimal HTML escaping — business names come from the public form. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SKIPPED: EmailResult = { sent: false, skipped: true };

export async function sendClaimConfirmation(
  to: string,
  { businessName, slug }: ClaimDetails,
): Promise<EmailResult> {
  const key = readApiKey();
  if (!key) {
    console.warn("email: RESEND_API_KEY not set — skipping claim confirmation");
    return SKIPPED;
  }

  try {
    const { error } = await getClient(key).emails.send({
      from: FROM,
      to,
      subject: "Your free website is on the way — Winlerr",
      html: confirmationHtml(businessName, slug),
    });
    if (error) {
      console.warn("email: claim confirmation not delivered");
      return { sent: false };
    }
    return { sent: true };
  } catch {
    console.warn("email: claim confirmation failed");
    return { sent: false };
  }
}

export async function sendClaimNotification(
  toOwner: string,
  { businessName, slug, email, whatsapp }: ClaimNotification,
): Promise<EmailResult> {
  const key = readApiKey();
  if (!key) {
    console.warn("email: RESEND_API_KEY not set — skipping owner notification");
    return SKIPPED;
  }

  try {
    const { error } = await getClient(key).emails.send({
      from: FROM,
      to: toOwner,
      subject: `New claim: ${businessName} (${slug}.winlerr.vip)`,
      html: notificationHtml({ businessName, slug, email, whatsapp }),
    });
    if (error) {
      console.warn("email: owner notification not delivered");
      return { sent: false };
    }
    return { sent: true };
  } catch {
    console.warn("email: owner notification failed");
    return { sent: false };
  }
}

/**
 * Branded confirmation email. All CSS inline, no external images, no webfonts —
 * renders identically in Gmail, Outlook and Apple Mail.
 */
function confirmationHtml(businessName: string, slug: string): string {
  const name = esc(businessName);
  const host = esc(`${slug}.winlerr.vip`);

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;">
                <div style="font-size:24px;font-weight:700;letter-spacing:-0.02em;color:#0F172A;">winlerr</div>
                <div style="height:3px;width:56px;background-color:#2563EB;margin-top:12px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:700;color:#0F172A;">Your free website is on the way.</h1>
                <p style="margin:16px 0 0 0;font-size:16px;line-height:1.6;color:#334155;">Hi ${name} — thanks for claiming your free Winlerr website. We've reserved <strong style="color:#0F172A;">${host}</strong> and will be in touch within 24 hours to gather your branding.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color:#2563EB;border-radius:999px;">
                      <a href="${WHATSAPP_URL}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;">Chat on WhatsApp</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94A3B8;">winlerr.vip · Built in Zambia</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </html>
</html>`;
}

/** Internal notification to the owner — same brand frame, plain details. */
function notificationHtml({ businessName, slug, email, whatsapp }: ClaimNotification): string {
  const name = esc(businessName);
  const host = esc(`${slug}.winlerr.vip`);
  const visitorEmail = esc(email);
  const wa = whatsapp ? esc(whatsapp) : "—";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#F8FAFC;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;">
                <div style="font-size:24px;font-weight:700;letter-spacing:-0.02em;color:#0F172A;">winlerr</div>
                <div style="height:3px;width:56px;background-color:#2563EB;margin-top:12px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:#0F172A;">New website claim</h1>
                <p style="margin:16px 0 0 0;font-size:16px;line-height:1.7;color:#334155;">
                  <strong style="color:#0F172A;">${name}</strong> reserved <strong style="color:#0F172A;">${host}</strong><br />
                  Email: ${visitorEmail}<br />
                  WhatsApp: ${wa}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94A3B8;">winlerr.vip · Built in Zambia</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </html>
</html>`;
}
