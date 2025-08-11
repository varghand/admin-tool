import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function getStripeSales(month, year) {
  const yearMonthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const requestedDate = new Date(Date.UTC(year, month, 1));
  const now = new Date();
  const firstDayOfCurrentMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  if (requestedDate < firstDayOfCurrentMonth) {
    const existing = await dynamoClient.send(
      new GetItemCommand({
        TableName: process.env.SALES_REPORT_TABLE,
        Key: marshall({ yearMonth: yearMonthKey, salesChannel: "Stripe" }),
      })
    );

    if (existing.Item) {
      return unmarshall(existing.Item).sales;
    }
  }

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

  const formatted = [];

  for (const charge of charges.filter((c) => c.paid && !c.refunded)) {
    const fee = charge.balance_transaction
      ? balanceMap.get(charge.balance_transaction)?.fee || "N/A"
      : "N/A";

    let productNames = [];

    if (charge.invoice) {
      try {
        const lineItems = await stripe.invoices.listLineItems(charge.invoice);
        const products = await Promise.all(
          lineItems.data
            .filter((item) => item.price?.product)
            .map((item) => stripe.products.retrieve(item.price.product))
        );
        productNames = products.map((prod) => prod.name);
      } catch {
        productNames = ["Error fetching products"];
      }
    } else if (charge.payment_intent) {
      try {
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: charge.payment_intent,
          limit: 1,
        });

        if (sessions.data.length > 0) {
          const session = sessions.data[0];

          const lineItems = await stripe.checkout.sessions.listLineItems(
            session.id
          );
          const products = await Promise.all(
            lineItems.data
              .filter((item) => item.price?.product)
              .map((item) => stripe.products.retrieve(item.price.product))
          );
          productNames = products.map((prod) => prod.name);
        } else {
          productNames = ["No products found in checkout session"];
        }
      } catch {
        productNames = ["Error fetching products"];
      }
    } else {
      productNames = ["No invoice or payment_intent"];
    }

    formatted.push({
      id: charge.id,
      payment_source_type: getPaymentType(charge.payment_method_details?.type),
      currency: charge.currency.toUpperCase(),
      amount: (charge.amount / 100).toFixed(2),
      fee,
      created_date: new Date(charge.created * 1000).toISOString(),
      name: charge.billing_details?.name || "",
      country:
        charge.payment_method_details?.card?.country ||
        charge.billing_details?.address?.country ||
        "",
      products: productNames.join(", "),
    });
  }

  if (requestedDate < firstDayOfCurrentMonth) {
    await dynamoClient.send(
      new PutItemCommand({
        TableName: process.env.SALES_REPORT_TABLE,
        Item: marshall({
          yearMonth: yearMonthKey,
          salesChannel: "Stripe",
          sales: formatted,
        }),
      })
    );
  }

  return formatted.reverse();
}

function getPaymentType(type) {
  switch (type) {
    case "card":
      return "Stripe";
    case "link":
      return "Stripe (fast checkout)";
    case "paypal":
      return "PayPal (through Stripe)";
    case null:
      return "Unknown";
    default:
      return type;
  }
}
