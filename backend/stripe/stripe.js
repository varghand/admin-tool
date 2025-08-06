import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function getStripeSales(month, year) {
  const from = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

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
      ...(startingAfter && { starting_after: startingAfter }),
    });

    charges.push(...response.data);
    hasMore = response.has_more;
    startingAfter = response.data.at(-1)?.id;
  }

  // Fetch fees from balance transactions
  const balanceMap = new Map();

  const balanceTxIds = charges
    .map((c) => c.balance_transaction)
    .filter(Boolean);

  const balanceChunks = [];
  const chunkSize = 50;

  for (let i = 0; i < balanceTxIds.length; i += chunkSize) {
    balanceChunks.push(balanceTxIds.slice(i, i + chunkSize));
  }

  for (const chunk of balanceChunks) {
    const txPromises = chunk.map((id) =>
      stripe.balanceTransactions.retrieve(id)
    );
    const txResults = await Promise.all(txPromises);

    for (const tx of txResults) {
      balanceMap.set(tx.id, {
        fee: (tx.fee / 100).toFixed(2),
      });
    }
  }

  // Map charge data into the final format
  const formatted = charges
    .filter((c) => c.paid && !c.refunded)
    .map((charge) => {
      const fee = charge.balance_transaction
        ? balanceMap.get(charge.balance_transaction)?.fee || "N/A"
        : "N/A";

      return {
        id: charge.id,
        payment_source_type: charge.payment_method_details?.type || "unknown",
        currency: charge.currency.toUpperCase(),
        amount: (charge.amount / 100).toFixed(2),
        fee,
        created_date: new Date(charge.created * 1000).toISOString(),
        card_name: charge.billing_details?.name || "",
        card_country: charge.payment_method_details?.card?.country || "",
      };
    });

  return formatted;
}
