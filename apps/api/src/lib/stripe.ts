import Stripe from 'stripe';

/**
 * Stripe Client
 *
 * The default HTTP client is Node's http module, which does not exist on
 * Workers. The fetch client is functionally identical.
 *
 * Constructed lazily, on first use, rather than at module scope. Cloudflare
 * runs the script's top level when validating an upload, before any secret is
 * available, and the Stripe SDK throws synchronously when constructed without
 * a key ("Neither apiKey nor config.authenticator provided"). An eager
 * `new Stripe(process.env.STRIPE_API_SECRET_KEY!)` therefore made the very
 * first `wrangler deploy` of a fresh Worker impossible: the secret cannot be
 * loaded until the Worker exists, and the Worker cannot be created while the
 * secret is missing. Every other client in lib/ was already lazy; this one
 * was the exception. The exported name and shape are unchanged, so the eleven
 * billing call sites that read `stripeClient.<resource>` are untouched.
 */
let client: Stripe | undefined;

function getStripeClient(): Stripe {
  if (!client) {
    client = new Stripe(process.env.STRIPE_API_SECRET_KEY!, {
      httpClient: Stripe.createFetchHttpClient(),
    });
  }

  return client;
}

export const stripeClient: Stripe = new Proxy({} as Stripe, {
  get(_target, prop, _receiver) {
    const real = getStripeClient();
    const value = Reflect.get(real, prop, real);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
