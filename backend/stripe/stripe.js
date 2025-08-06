import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function getStripeSales(month, year) {
  const from = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)); // End of month

  const fromTimestamp = Math.floor(from.getTime() / 1000);
  const toTimestamp = Math.floor(to.getTime() / 1000);

  const charges = [];
  let hasMore = true;
  let startingAfter;

  while (hasMore) {
    const response = await stripe.charges.list({
      limit: 100,
      created: {
        gte: fromTimestamp,
        lte: toTimestamp,
      },
      paid: true,
      starting_after: startingAfter,
    });

    charges.push(...response.data);
    hasMore = response.has_more;
    startingAfter = response.data.length > 0 ? response.data[response.data.length - 1].id : null;
  }

  const formatted = charges
    .filter(charge => charge.paid && !charge.refunded)
    .map((charge) => ({
      id: charge.id,
      payment_source_type: charge.payment_method_details?.type || charge.payment_method || "unknown",
      currency: charge.currency.toUpperCase(),
      amount: (charge.amount / 100).toFixed(2),
      fee: charge.balance_transaction ? null : "N/A", // We'll replace this below
      created_date: new Date(charge.created * 1000).toISOString(),
      card_name: charge.billing_details?.name || "",
      card_country: charge.payment_method_details?.card?.country || "",
    }));

  // Fetch and map fees (optional: more precise)
  const txIds = charges.map(c => c.balance_transaction).filter(Boolean);

  if (txIds.length > 0) {
    const txResponses = await Promise.all(txIds.map(id => stripe.balanceTransactions.retrieve(id)));

    const feeMap = new Map(txResponses.map(tx => [tx.id, (tx.fee / 100).toFixed(2)]));

    for (let row of formatted) {
      if (feeMap.has(row.id)) {
        row.fee = feeMap.get(row.id);
      }
    }
  }

  return formatted;
}
