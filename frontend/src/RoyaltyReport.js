import { useState } from "react";
import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";
import { getReadableFormat } from "./helpers/readableFormat";

const baseUrl = process.env.REACT_APP_BACKEND_BASE_URL;

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function SalesReportPage() {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    if (!month || !year) return;

    setLoading(true);
    setSalesData([]);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;

      const res = await axios.get(`${baseUrl}/sales`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          month: parseInt(month),
          year,
        },
      });

      const transformedData = flattenAndAggregate(res.data);
      setSalesData(transformedData || []);
    } catch (err) {
      console.error("Failed to fetch sales data:", err);
      alert("Could not fetch sales data.");
    }

    setLoading(false);
  };

  const flattenAndAggregate = (sales) => {
    sales.forEach((sale) => {
      if (sale.payment_source === "Stripe (fast checkout)" || sale.payment_source === "PayPal (through Stripe)") {
        sale.payment_source = "Stripe";
      }
    });

    const aggregated = Object.values(
      sales
        .flatMap((sale) =>
          sale.products.map((product) => {
            const key = `${product.id || product.title}_${sale.currency}_${
              sale.payment_source
            }`;
            return {
              key,
              product_id: product.id || product.title,
              currency: sale.currency,
              number_of_sales: product.quantity,
              total_amount: parseFloat(sale.total_price),
              total_fee: parseFloat(sale.fee),
              payment_source: sale.payment_source,
              shipping_cost: parseFloat(sale.shipping_cost) || 0,
            };
          })
        )
        .reduce((acc, item) => {
          if (!acc[item.key]) {
            acc[item.key] = { ...item };
          } else {
            acc[item.key].number_of_sales += item.number_of_sales;
            acc[item.key].total_amount += item.total_amount;
            acc[item.key].total_fee += item.total_fee;
            acc[item.key].shipping_cost += item.shipping_cost;
          }
          return acc;
        }, {})
    );

    console.log(aggregated);

    return aggregated;
  };

  const getPrintingCosts = (item) => {
    switch (item.trim()) {
      case "F.I.S.T. Deluxe Box Set":
        return 100;
      case "The Fortress Of Death T-shirt":
        return 100;
      case "F.I.S.T. T-shirt":
        return 100;
    }
    return 0;
  }

  const formatAmount = (num) => {
    if (!num) {
      return num;
    }
    return num.toFixed(0);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Sales Report</h1>

      <div className="flex items-end gap-4">
        <div>
          <label className="block font-semibold mb-1">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-400 p-2 rounded w-48"
          >
            <option value="">Select Month</option>
            {months.map((m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-gray-400 p-2 rounded w-32"
            min="2000"
            max="2100"
          />
        </div>

        <button
          onClick={fetchSales}
          disabled={!month || !year || loading}
          className="bg-brand-teal-dark text-white px-4 py-2 rounded hover:bg-brand-teal disabled:bg-brand-gray-medium"
        >
          {loading ? "Loading..." : "Get Report"}
        </button>
      </div>

      <p>
        Currently showing sales made through Stripe + Shopify + Apple IAP
        (physical sales made at events etc missing)
      </p>

      {salesData.length > 0 && (
        <div className="overflow-auto bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">
            Found {salesData.length} sales
          </h2>

          <table className="min-w-full text-sm border border-gray-300">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2 border-b">Product</th>
                <th className="p-2 border-b">Payment Source</th>
                <th className="p-2 border-b">Quantity</th>
                <th className="p-2 border-b">Total Sales</th>
                <th className="p-2 border-b">Payment Fees</th>
                <th className="p-2 border-b">Shipping Costs</th>
                <th className="p-2 border-b">Printing Costs</th>
                <th className="p-2 border-b">VAT</th>
                <th className="p-2 border-b">Net Sales</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((sale, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{getReadableFormat(sale.product_id)}</td>
                  <td className="p-2">{sale.payment_source}</td>
                  <td className="p-2">{sale.number_of_sales}</td>
                  <td className="p-2">
                    {formatAmount(sale.total_amount)} {sale.currency}
                  </td>
                  <td className="p-2">
                    -{formatAmount(sale.total_fee)} {sale.currency}
                  </td>
                  <td className="p-2">
                    {sale.shipping_cost > 0
                      ? `-${formatAmount(sale.shipping_cost)} ${sale.currency}`
                      : ""}
                  </td>
                  <td className="p-2">
                    {getPrintingCosts(sale.product_id) > 0
                      ? `-${getPrintingCosts(sale.product_id)*sale.number_of_sales} ${sale.currency}`
                      : ""}
                  </td>
                  <td className="p-2">25%</td>
                  <td className="p-2">
                    {formatAmount(
                      (sale.total_amount - sale.total_fee - sale.shipping_cost - getPrintingCosts(sale.product_id)*sale.number_of_sales)/1.25
                    )}{" "}
                    {sale.currency}
                  </td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-100">
                <td colSpan={9} className="p-2 border-b"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
