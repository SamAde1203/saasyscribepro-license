// /api/webhook.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const GIST_ID = process.env.GITHUB_GIST_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function verifyAndAddEmail(email) {
  if (!email) return false;

  // Fetch current Gist content
  const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` },
  });
  const gist = await gistRes.json();
  const currentContent = gist.files?.['approved-customers.txt']?.content || '';
  const emails = new Set(currentContent.split('\n').filter(e => e.trim()));

  if (!emails.has(email)) {
    emails.add(email);
    const newContent = Array.from(emails).join('\n') + '\n';
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: { 'approved-customers.txt': { content: newContent } },
      }),
    });
    return true;
  }
  return false;
}

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Read raw body
  const buffer = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buffer.toString(), sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send('Webhook signature verification failed');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid' && session.customer_details?.email) {
      const email = session.customer_details.email;

      // Confirm it's your Founder Bundle
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const isBundle = lineItems.data.some(
        item => item.description?.includes('SaaSy Scribe ELITE – Founder Bundle (2025)')
      );

      if (isBundle) {
        const added = await verifyAndAddEmail(email);
        console.log(added ? `✅ Approved: ${email}` : `ℹ️ Already approved: ${email}`);
        return res.status(200).json({ status: 'success' });
      }
    }
  }

  return res.status(200).json({ status: 'ignored' });
}

// Helper to read raw body in Vercel
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}
