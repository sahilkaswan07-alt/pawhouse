/**
 * send-reminders.js
 * ------------------------------------------------------------------
 * Runs on a daily schedule (see .github/workflows/whatsapp-reminders.yml).
 * It has NOTHING to do with the website page loading — it runs whether
 * or not anyone ever opens petbox.html that day. That's what makes this
 * "automatic": a scheduled job, not a click in a browser.
 *
 * What it does:
 *   1. Reads reminders-data.json (the shared schedule for every pet).
 *   2. Finds items where "due" is TODAY and "done" is false.
 *   3. Sends one WhatsApp message per pet (listing all items due today)
 *      to that pet's ownerWhatsApp, via the Twilio WhatsApp API.
 *
 * Requires Node 18+ (built-in fetch — no npm install needed).
 *
 * Environment variables (set as GitHub Actions secrets — see README):
 *   TWILIO_ACCOUNT_SID   - starts with "AC..."
 *   TWILIO_AUTH_TOKEN    - your Twilio auth token
 *   TWILIO_WHATSAPP_FROM - e.g. "whatsapp:+14155238886" (Twilio sandbox
 *                           number, or your approved WhatsApp sender)
 *   TIMEZONE (optional)  - IANA zone for "today", default "Asia/Kolkata"
 * ------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'reminders-data.json');
const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

function todayIsoInTimezone(tz) {
  // en-CA locale formats as YYYY-MM-DD, which is what we store in "due"
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

function loadData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

function findDueItemsForToday(data, today) {
  const results = [];
  for (const pet of data.pets) {
    const dueToday = (pet.items || []).filter(it => !it.done && it.due === today);
    if (dueToday.length > 0) {
      results.push({ pet, dueToday });
    }
  }
  return results;
}

function buildMessage(pet, items) {
  const lines = items.map(it => {
    const label = it.type === 'deworming' ? 'Deworming' : 'Vaccination';
    return `• ${it.name} (${label}) is due today`;
  });
  return (
    `Hi! This is a reminder from Paw House 🐾 for ${pet.name}:\n\n` +
    `${lines.join('\n')}\n\n` +
    `Please schedule a visit at your convenience.  🐶🐱`
  );
}

async function sendTwilioWhatsApp(toNumber, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    throw new Error(
      'Missing Twilio credentials. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.'
    );
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  const params = new URLSearchParams();
  params.set('To', `whatsapp:${toNumber}`);
  params.set('From', from.startsWith('whatsapp:') ? from : `whatsapp:${from}`);
  params.set('Body', body);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Twilio error (${res.status}): ${json.message || JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  const today = todayIsoInTimezone(TIMEZONE);
  console.log(`Checking reminders for ${today} (${TIMEZONE})...`);

  const data = loadData();
  const due = findDueItemsForToday(data, today);

  if (due.length === 0) {
    console.log('Nothing due today. No messages sent.');
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const { pet, dueToday } of due) {
    const message = buildMessage(pet, dueToday);
    try {
      await sendTwilioWhatsApp(pet.ownerWhatsApp, message);
      console.log(`✔ Sent reminder to ${pet.name}'s owner (${pet.ownerWhatsApp}) — ${dueToday.length} item(s).`);
      sent++;
    } catch (err) {
      console.error(`✘ Failed to send for ${pet.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`Done. Sent: ${sent}, Failed: ${failed}.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exitCode = 1;
});
