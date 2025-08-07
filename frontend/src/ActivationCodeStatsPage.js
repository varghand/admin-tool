
import { useEffect, useState } from "react";
import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";

const baseUrl = process.env.REACT_APP_BACKEND_BASE_URL;

export default function ActivationCodeStatsPage() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;

      const res = await axios.get(`${baseUrl}/activation-code-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch activation code stats:", err);
      alert("Could not load activation code statistics.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Activation Code Stats</h1>

      {loading && <p>Loading...</p>}

      {!loading && stats.length > 0 && (
        <div className="bg-white rounded shadow p-4 overflow-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-300">
                <th className="py-2 px-4 font-semibold">ID</th>
                <th className="py-2 px-4 font-semibold">Type</th>
                <th className="py-2 px-4 font-semibold">Total Codes</th>
                <th className="py-2 px-4 font-semibold">Used</th>
                <th className="py-2 px-4 font-semibold">Unused</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-2 px-4">{item.id}</td>
                  <td className="py-2 px-4">{item.type}</td>
                  <td className="py-2 px-4">{item.total}</td>
                  <td className="py-2 px-4">{item.used}</td>
                  <td className="py-2 px-4">{item.total - item.used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
