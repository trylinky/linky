import Stripe from 'stripe';

/**
 * Stripe Client
 *
 * The default HTTP client is Node's http module, which does not exist on
 * Workers. The fetch client is functionally identical.
 */
export const stripeClient = new Stripe(process.env.STRIPE_API_SECRET_KEY!, {
  httpClient: Stripe.createFetchHttpClient(),
});
