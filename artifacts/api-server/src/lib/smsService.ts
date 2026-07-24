/**
 * SMS / WhatsApp notification service using Twilio.
 *
 * Configuration (set as Replit Secrets):
 *   TWILIO_ACCOUNT_SID  — Twilio Account SID (starts with AC…)
 *   TWILIO_AUTH_TOKEN   — Twilio Auth Token
 *   TWILIO_FROM_NUMBER  — Sender number, e.g. "+14155238886"
 *                         For WhatsApp use "whatsapp:+14155238886"
 *
 * If any of the three env vars are missing the service logs a warning and
 * returns without throwing, so the approval flow is never blocked.
 */

import twilio from "twilio";

interface NotifyApprovalParams {
  to: string;        // Donor mobile number (e.g. "+919876543210")
  donorName: string;
  amount: string;    // Numeric string
  receiptToken: string;
  siteBaseUrl?: string;
}

function buildMessage(params: NotifyApprovalParams): string {
  const { donorName, amount, receiptToken, siteBaseUrl } = params;
  const amountFormatted = Number(amount).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const receiptUrl = siteBaseUrl
    ? `${siteBaseUrl}/receipt/${receiptToken}`
    : null;

  const lines = [
    `அன்பான ${donorName} அவர்களுக்கு,`,
    ``,
    `உங்கள் நன்கொடை ${amountFormatted} அனுமதிக்கப்பட்டது. 🙏`,
    `அருள்மிகு ஸ்ரீ ஐயப்பன் திருக்கோவிலுக்கு வழங்கிய உங்கள் அன்பான பங்களிப்பிற்கு நன்றி.`,
  ];

  if (receiptUrl) {
    lines.push(``, `உங்கள் ரசீது: ${receiptUrl}`);
  }

  return lines.join("\n");
}

/**
 * Normalize a phone number for Twilio.
 * If it doesn't start with "+" add India's country code (+91).
 * WhatsApp "from" numbers are left as-is (they already have the prefix).
 */
function normalizeTo(number: string): string {
  const trimmed = number.trim();
  if (trimmed.startsWith("whatsapp:") || trimmed.startsWith("+")) return trimmed;
  // Strip leading zeros common in Indian numbers
  const digits = trimmed.replace(/\D/g, "");
  return `+${digits.startsWith("91") ? digits : "91" + digits}`;
}

export async function notifyDonationApproved(
  params: NotifyApprovalParams,
  log: { warn: (obj: object, msg: string) => void; error: (obj: object, msg: string) => void; info: (obj: object, msg: string) => void },
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    log.warn(
      { missingVars: { accountSid: !accountSid, authToken: !authToken, from: !from } },
      "Twilio credentials not configured — skipping SMS notification",
    );
    return;
  }

  const to = normalizeTo(params.to);
  // If the "from" number is a WhatsApp number, mirror the "to" as WhatsApp too
  const toFormatted = from.startsWith("whatsapp:") ? `whatsapp:${to}` : to;

  const body = buildMessage(params);

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({ from, to: toFormatted, body });
    log.info({ sid: message.sid, to: toFormatted }, "Donation approval SMS sent");
  } catch (err) {
    // Log but do not rethrow — approval must succeed even if SMS fails
    log.error({ err, to: toFormatted }, "Failed to send donation approval SMS");
  }
}
