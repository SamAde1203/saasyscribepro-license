// /api/webhook.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const GIST_ID = process.env.GITHUB_GIST_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function updateGistFile(filename, newContent) {
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [filename]: { content: newContent },
      },
    }),
  });
  return response.ok;
}

async function getGistFileContent(filename) {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` },
  });
  if (!res.ok) return '';
  const gist = await res.json();
  return gist.files?.[filename]?.content || '';
}

async function addEmailToGistFile(email, filename) {
  if (!email) return false;

  let content = await getGistFileContent(filename);
  const emails = new Set(
    content
      .split('\n')
      .map(e => e.trim())
      .filter(e => e)
  );

  if (!emails.has(email)) {
    emails.add(email);
    const newContent = Array.from(emails).join('\n') + '\n';
    await updateGistFile(filename, newContent);
    return true;
  }
  return false;
}

// Helper to read raw body in Vercel
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status !== 'paid' || !session.customer_details?.email) {
      return res.status(200).json({ status: 'ignored', reason: 'payment not complete or no email' });
    }

    const email = session.customer_details.email;

    // Fetch line items to detect product
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const description = lineItems.data[0]?.description || '';

    let targetFile = null;

    if (description.includes('SaaSy Scribe ELITE – Founder Bundle (2025)')) {
      targetFile = 'elite-approved-customers.txt';
    } else if (description.includes('SaaSy Scribe PRO')) {
      targetFile = 'pro-approved-customers.txt';
    } else {
      console.log('Unrecognized product:', description);
      return res.status(200).json({ status: 'ignored', reason: 'unknown product' });
    }

    const added = await addEmailToGistFile(email, targetFile);
    console.log(added ? `✅ ${targetFile}: ${email}` : `ℹ️ Already approved: ${email}`);

    return res.status(200).json({ status: 'success', file: targetFile });
  }

  return res.status(200).json({ status: 'ignored', event: event.type });
}
