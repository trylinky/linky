import Stripe from 'stripe';

/**
 * Stripe Client
 */
export const stripeClient = new Stripe(process.env.STRIPE_API_SECRET_KEY!);
