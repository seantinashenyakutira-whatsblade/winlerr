/**
 * Transactional email for the gift-claim flow, backed by Resend.
 *
 * Hard rules (from the task brief):
 *  - `RESEND_API_KEY` and `OWNER_EMAIL` may not exist yet. A missing key logs a
 *    warning and is skipped — it must NEVER throw and never fails a claim.
 *  - Nothing here logs a key, an API error payload, or full message bodies.
 *
 * `resend` (the official Node SDK) is used: the `@resend/node` package named in
 * the Task 7 brief does not exist on the npm registry (404).
 */
import { Resend } from "resend";

const FROM = "Winlerr <hello@winlerr.vip>";
const WHATSAPP_URL = "https://wa.me/260776950796";

const INK = "#0F172A";
const MUTED = "#64748B";
const BLUE = "#2563EB";
const PAGE = "#F8FAFC";

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

  const preview = `We reserved ${slug}.winlerr.vip and will reach out within 24 hours on WhatsApp.`;

  try {
    const { error } = await getClient(key).emails.send({
      from: FROM,
      to,
      subject: "Your free Winlerr website is reserved",
      text: `${preview}\n\nHi ${businessName} — thanks for claiming your free Winlerr website.\n\nWe have reserved ${slug}.winlerr.vip for your business and will be in touch within 24 hours on WhatsApp to gather your branding, services, and photos.\n\nIf you would like to get a head start, reply to this email or message us directly.\n\nChat on WhatsApp: ${WHATSAPP_URL}\n\nwinlerr.vip · Built in Zambia`,
      html: confirmationHtml(businessName, slug, preview),
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

  const body = [
    "New free website claim",
    `Business name: ${businessName}`,
    `Slug: ${slug}`,
    `Email: ${email}`,
    `WhatsApp: ${whatsapp || "—"}`,
    `Received: ${new Date().toISOString()}`,
    "Reply within 24 hours. WhatsApp them first — not email.",
  ].join("\n");

  try {
    const { error } = await getClient(key).emails.send({
      from: FROM,
      to: toOwner,
      subject: `New claim: ${businessName} (${slug}.winlerr.vip)`,
      text: body,
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
function confirmationHtml(businessName: string, slug: string, preview: string): string {
  const name = esc(businessName);
  const host = esc(`${slug}.winlerr.vip`);
  const pre = esc(preview);

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:${PAGE};font-family:Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${pre}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAGE};padding:32px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;">
            <tr>
              <td style="padding:40px 40px 0 40px;">
                <div style="font-size:24px;font-weight:700;letter-spacing:-0.02em;color:${INK};">winlerr</div>
                <div style="height:3px;width:56px;background-color:${BLUE};margin-top:12px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 0 40px;">
                <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:700;color:${INK};">Your free website is on the way.</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;">
                <p style="margin:0;font-size:16px;line-height:1.6;color:${MUTED};">Hi ${name} — thanks for claiming your free Winlerr website.</p>
                <p style="margin:16px 0 0 0;font-size:16px;line-height:1.6;color:${MUTED};">We have reserved ${host} for your business and will be in touch within 24 hours on WhatsApp to gather your branding, services, and photos.</p>
                <p style="margin:16px 0 0 0;font-size:16px;line-height:1.6;color:${MUTED};">If you would like to get a head start, reply to this email or message us directly.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:32px 40px 0 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr>
                    <td align="center" style="background-color:${BLUE};border-radius:999px;">
                      <a href="${WHATSAPP_URL}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:999px;">Chat on WhatsApp</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:32px 40px 40px 40px;border-top:1px solid #E2E8F0;">
                <p style="margin:24px 0 0 0;font-size:13px;line-height:1.6;color:${MUTED};">winlerr.vip · Built in Zambia</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
