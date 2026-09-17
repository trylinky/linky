// One-off. Run once against production after Task 11 ships:
//   cd apps/api && dotenvx run -f ../../.env.local -- \
//     node --experimental-strip-types scripts/backfill-trial-end-behaviour.ts
//
// 1. Every Stripe subscription still `trialing` gets
//    trial_settings.end_behavior.missing_payment_method = 'cancel', so it
//    cancels itself at trial end like new signups do.
// 2. Every subscription already `past_due` with a trial_end and no successful
//    payment is cancelled now; the deleted webhook downgrades it.
//
// Reads STRIPE_API_SECRET_KEY. Pass --dry-run to print without changing.
import Stripe from 'stripe';

const dryRun = process.argv.includes('--dry-run');
const stripe = new Stripe(process.env.STRIPE_API_SECRET_KEY!, {
  httpClient: Stripe.createFetchHttpClient(),
});

async function main() {
  let updated = 0;
  let cancelled = 0;

  for await (const sub of stripe.subscriptions.list({
    status: 'trialing',
    limit: 100,
  })) {
    const current = sub.trial_settings?.end_behavior?.missing_payment_method;
    if (current === 'cancel') continue;
    console.log(`trialing ${sub.id}: ${current ?? 'create_invoice'} -> cancel`);
    if (!dryRun) {
      await stripe.subscriptions.update(sub.id, {
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      });
    }
    updated += 1;
  }

  for await (const sub of stripe.subscriptions.list({
    status: 'past_due',
    limit: 100,
  })) {
    if (sub.trial_end == null) continue;
    const invoices = await stripe.invoices.list({
      subscription: sub.id,
      status: 'paid',
      limit: 1,
    });
    if (invoices.data.length > 0) continue;
    console.log(`past_due unconverted trial ${sub.id}: cancelling`);
    if (!dryRun) {
      await stripe.subscriptions.cancel(sub.id);
    }
    cancelled += 1;
  }

  console.log(
    `${dryRun ? '[dry run] ' : ''}updated ${updated}, cancelled ${cancelled}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
