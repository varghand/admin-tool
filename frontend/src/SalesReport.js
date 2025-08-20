import { useState } from "react";
import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";

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

      setSalesData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch sales data:", err);
      alert("Could not fetch sales data.");
    }

    setLoading(false);
  };

  const totalAmount = salesData.reduce(
    (sum, user) => sum + parseFloat(user.total_price || 0),
    0
  );

  const totalFees = salesData.reduce(
    (sum, user) => sum + parseFloat(user.fee || 0),
    0
  );

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
                <th className="p-2 border-b">#</th>
                <th className="p-2 border-b">Date</th>
                <th className="p-2 border-b">Name</th>
                <th className="p-2 border-b">Payment Source</th>
                <th className="p-2 border-b">Amount</th>
                <th className="p-2 border-b">Fee</th>
                <th className="p-2 border-b">Country</th>
                <th className="p-2 border-b">Products</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((sale, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">
                    {isNaN(new Date(sale.created_date).getTime())
                      ? ""
                      : new Date(sale.created_date).toLocaleString()}
                  </td>
                  <td className="p-2">{sale.customer_name}</td>
                  <td className="p-2">{sale.payment_source}</td>
                  <td className="p-2">
                    {sale.total_price} {sale.currency}
                  </td>
                  <td className="p-2">
                    -{sale.fee} {sale.currency}
                  </td>
                  <td className="p-2">{sale.country}</td>
                  {
                    <td className="p-2">
                      {sale.products
                        .map((product) => product.title)
                        .join(" + ")}
                    </td>
                  }
                </tr>
              ))}
              <tr className="font-bold bg-gray-100">
                <td className="p-2 border-b">{salesData.length}</td>
                <td colSpan={3} className="p-2 border-b"></td>
                {/* <td className="p-2 border-b">{totalAmount.toFixed(2)} kr</td>
                <td className="p-2 border-b">{totalFees.toFixed(2)} kr</td> */}
                <td colSpan={4} className="p-2 border-b"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
