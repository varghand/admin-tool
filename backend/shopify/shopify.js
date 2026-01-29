import axios from "axios";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_API_TOKEN;

export async function getShopifySales(month, year) {
  const from = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const to = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

  const created_at_min = from.toISOString();
  const created_at_max = to.toISOString();

  const baseUrl = `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-07/orders.json`;
  const allOrders = [];
  let pageInfo = null;

  try {
    while (true) {
      const response = await axios.get(baseUrl, {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        },
        params: {
          status: "any",
          financial_status: "paid",
          created_at_min,
          created_at_max,
          limit: 250,
          ...(pageInfo && { page_info: pageInfo }),
        },
      });

      allOrders.push(...response.data.orders);

      const linkHeader = response.headers["link"];
      if (!linkHeader || !linkHeader.includes('rel="next"')) {
        break;
      }

      const match = linkHeader.match(/page_info=([^&>]+)/);
      pageInfo = match?.[1];
    }

    const formatted = [];

    for (const order of allOrders) {
      for (const item of order.line_items) {
        formatted.push({
          id: order.id,
          created_date: order.created_at,
          currency: order.currency,
          payment_source: order.gateway ?? "Shopify",
          customer_name:
            `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim(),
          country: order.customer?.default_address?.country || "",
          product_id: item.title, 
          product_title: item.title,
          quantity: item.quantity,
          unit_price: parseFloat(item.price),
          total_price: (item.quantity * parseFloat(item.price)).toFixed(2),
          fee: (
            ((item.quantity * item.price) / order.total_price) *
            (order.total_price * 0.015 + 1.85)
          ).toFixed(2),
          shipping_cost: (
            ((item.quantity * item.price) / order.total_price) *
            parseFloat(order.total_shipping_price_set?.shop_money?.amount || 0)
          ).toFixed(2),
        });
      }
    }

    return formatted;
  } catch (error) {
    console.error("Failed to fetch Shopify sales:", error.message);
    throw error;
  }
}
