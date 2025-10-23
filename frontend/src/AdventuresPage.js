import { useEffect, useState } from "react";
import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";

const baseUrl = process.env.REACT_APP_BACKEND_BASE_URL;

export default function AdventuresListPage() {
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAdventures = async () => {
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;

      const res = await axios.get(`${baseUrl}/api/available-adventures`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const sorted = [...res.data].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );

      console.log(sorted)

      setAdventures(sorted);
    } catch (err) {
      console.error("Failed to fetch adventures:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdventures();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Adventures</h1>

      {loading && <p>Loading...</p>}

      {!loading && adventures.length > 0 && (
        <div className="bg-white rounded shadow p-4 overflow-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-300">
                <th className="py-2 px-4 font-semibold">Adventure ID</th>
                <th className="py-2 px-4 font-semibold">Demo Available</th>
                <th className="py-2 px-4 font-semibold">Beta</th>
                <th className="py-2 px-4 font-semibold">Pre-Order</th>
                <th className="py-2 px-4 font-semibold">Soundtrack</th>
                <th className="py-2 px-4 font-semibold">Released</th>
                <th className="py-2 px-4 font-semibold">Sort Order</th>
              </tr>
            </thead>
            <tbody>
              {adventures.map((a) => (
                <tr key={a.adventureId} className="border-b border-gray-200">
                  <td className="py-2 px-4 font-mono">{a.adventureId}</td>
                  <td className="py-2 px-4">{a.freeDemoAvailable ? "✅" : "❌"}</td>
                  <td className="py-2 px-4">{a.isBeta ? "✅" : "❌"}</td>
                  <td className="py-2 px-4">{a.isPreOrder ? "✅" : "❌"}</td>
                  <td className="py-2 px-4">{a.soundtrackAvailable ? "✅" : "❌"}</td>
                  <td className="py-2 px-4">{a.isReleased ? "✅" : "❌"}</td>
                  <td className="py-2 px-4">{a.sortOrder ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && adventures.length === 0 && (
        <p className="text-gray-500">No adventures found.</p>
      )}
    </div>
  );
}
