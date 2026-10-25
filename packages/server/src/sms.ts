import { config } from './config';

/** "+972 52-655-0238" → "+972526550238". Local numbers without a country code are left to the provider. */
export const cleanPhone = (phone: string) => phone.replace(/[^\d+]/g, '');

/**
 * Sends a text message through Twilio when TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM are set.
 * Without them it does nothing, so reminders still go by email and browser notifications.
 */
export async function sendSms(to: string | null | undefined, text: string) {
  const { sid, token, from } = config.twilio;
  const phone = to ? cleanPhone(to) : '';
  if (!sid || !token || !from || phone.length < 8) return false;
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: phone, From: from, Body: text }),
    });
    if (!res.ok) console.warn('sms failed', res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.warn('sms failed', e);
    return false;
  }
}
