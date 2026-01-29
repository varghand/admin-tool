import { useState } from "react";
import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";
import { getReadableFormat } from "./helpers/readableFormat";

const baseUrl = process.env.REACT_APP_BACKEND_BASE_URL;

const periods = [
  { label: "January-June", value: "H1" },
  { label: "July-December", value: "H2" },
  { label: "January", value: "January" },
  { label: "February", value: "February" },
  { label: "March", value: "March" },
  { label: "April", value: "April" },
  { label: "May", value: "May" },
  { label: "June", value: "June" },
  { label: "July", value: "July" },
  { label: "August", value: "August" },
  { label: "September", value: "September" },
  { label: "October", value: "October" },
  { label: "November", value: "November" },
  { label: "December", value: "December" },
];

const getMonthsForPeriod = (period) => {
  if (period === "H1") return [0, 1, 2, 3, 4, 5];
  if (period === "H2") return [6, 7, 8, 9, 10, 11];
  if (period === "January") return [0];
  if (period === "February") return [1];
  if (period === "March") return [2];
  if (period === "April") return [3];
  if (period === "May") return [4];
  if (period === "June") return [5];
  if (period === "July") return [6];
  if (period === "August") return [7];
  if (period === "September") return [8];
  if (period === "October") return [9];
  if (period === "November") return [10];
  if (period === "December") return [11];
  return [];
};

export default function SalesReportPage() {
  const [period, setPeriod] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("product");
  const [sortDir, setSortDir] = useState("asc");

  const sortSalesData = (data) => {
    if (!sortBy) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal =
        sortBy === "product"
          ? (a.product_id || "").toLowerCase()
          : (a.payment_source || "").toLowerCase();

      const bVal =
        sortBy === "product"
          ? (b.product_id || "").toLowerCase()
          : (b.payment_source || "").toLowerCase();

      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    return sorted;
  };

  const fetchSales = async () => {
    if (!period || !year) return;

    setLoading(true);
    setSalesData([]);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;

      const months = getMonthsForPeriod(period);

      const requests = months.map((m) =>
        axios.get(`${baseUrl}/sales`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            month: m,
            year,
          },
        }),
      );

      const responses = await Promise.all(requests);

      const combinedSales = responses.flatMap((r) => r.data);

      const transformedData = flattenAndAggregate(combinedSales);
      setSalesData(transformedData || []);
    } catch (err) {
      console.error("Failed to fetch sales data:", err);
      alert("Could not fetch sales data.");
    } finally {
      setLoading(false);
    }
  };

  const flattenAndAggregate = (sales) => {
    sales.forEach((sale) => {
      if (
        sale.payment_source === "Stripe (fast checkout)" ||
        sale.payment_source === "PayPal (through Stripe)" ||
        sale.payment_source === "ideal" ||
        sale.payment_source === "eps" ||
        sale.payment_source === "klarna"
      ) {
        sale.payment_source = "Stripe";
      }
    });

    const aggregated = Object.values(
      sales.reduce((acc, sale) => {
        const key = `${sale.product_id}_${sale.currency}_${sale.payment_source}`;

        if (!acc[key]) {
          acc[key] = {
            key,
            product_id: sale.product_id,
            currency: sale.currency,
            number_of_sales: sale.quantity,
            total_amount: parseFloat(sale.total_price),
            total_fee: parseFloat(sale.fee),
            payment_source: sale.payment_source,
            shipping_cost: parseFloat(sale.shipping_cost) || 0,
          };
        } else {
          acc[key].number_of_sales += sale.quantity;
          acc[key].total_amount += parseFloat(sale.total_price);
          acc[key].total_fee += parseFloat(sale.fee);
          acc[key].shipping_cost += parseFloat(sale.shipping_cost) || 0;
        }

        return acc;
      }, {}),
    );

    return aggregated;
  };

  const getPrintingCosts = (item) => {
    if (!item || typeof item !== "string") return 0;

    switch (item.trim()) {
      case "F.I.S.T. Deluxe Box Set":
        return 100;
      case "The Fortress Of Death T-shirt":
        return 100;
      case "F.I.S.T. T-shirt":
        return 100;
      case "Call of Cthulhu - Alone Against the Tide, Deluxe Box Set":
        return 100;
      case "Call of Cthulhu - Alone Against the Tide, Tuck Box Set":
        return 50;
      default:
        return 0;
    }
  };

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
          <label className="block font-semibold mb-1">Period</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-gray-400 p-2 rounded w-48"
          >
            <option value="">Select Period</option>
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
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
          disabled={!period || !year || loading}
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
                <th
                  className="p-2 border-b cursor-pointer select-none"
                  onClick={() => {
                    setSortBy("product");
                    setSortDir(
                      sortBy === "product" && sortDir === "asc"
                        ? "desc"
                        : "asc",
                    );
                  }}
                >
                  Product{" "}
                  {sortBy === "product" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
                <th
                  className="p-2 border-b cursor-pointer select-none"
                  onClick={() => {
                    setSortBy("payment");
                    setSortDir(
                      sortBy === "payment" && sortDir === "asc"
                        ? "desc"
                        : "asc",
                    );
                  }}
                >
                  Payment Source{" "}
                  {sortBy === "payment" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
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
              {sortSalesData(salesData).map((sale, i) => (
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
                      ? `-${getPrintingCosts(sale.product_id) * sale.number_of_sales} ${sale.currency}`
                      : ""}
                  </td>
                  <td className="p-2">25%</td>
                  <td className="p-2">
                    {formatAmount(
                      (sale.total_amount -
                        sale.total_fee -
                        sale.shipping_cost -
                        getPrintingCosts(sale.product_id) *
                          sale.number_of_sales) /
                        1.25,
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
