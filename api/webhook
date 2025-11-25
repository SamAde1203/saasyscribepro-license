import Stripe from 'stripe';
import { promises as fs } from 'fs';
import path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleSubscriptionCreated(session);
      break;
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionCancelled(subscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}

async function handleSubscriptionCreated(session) {
  try {
    // Generate license key
    const licenseKey = 'SaaSYPRO-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    // Read existing licenses
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    let licenses = {};
    
    try {
      const data = await fs.readFile(licensesPath, 'utf8');
      licenses = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, create empty object
    }
    
    // Add new license
    licenses[licenseKey] = {
      email: session.customer_details.email,
      created: new Date().toISOString(),
      active: true,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription
    };
    
    // Save licenses
    await fs.writeFile(licensesPath, JSON.stringify(licenses, null, 2));
    
    console.log(`License created: ${licenseKey} for ${session.customer_details.email}`);
    
    // TODO: Send welcome email with license key
    // You can integrate with SendGrid or similar here
    
  } catch (error) {
    console.error('Error handling subscription:', error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  // Mark license as inactive when subscription cancelled
  // Implementation similar to above
}
