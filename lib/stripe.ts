import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable.');
  }

  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as any,
  });

  return stripeInstance;
}

// Legacy export for compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const client = getStripe();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
