import { useState } from "react";
import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";
import { getReadableFormat } from "./helpers/readableFormat";

const adventureOptions = [
  "coc_aatt_beta",
  "fod",
  "fist",
  "fod-kickstarter",
  "fod-beta",
  "bundle-pre-order",
  "fist-pre-order",
  "fod-pre-order",
  "fod-expansions",
];

const baseUrl = process.env.REACT_APP_BACKEND_BASE_URL;

export default function UsersByAdventurePage() {
  const [selectedAdventure, setSelectedAdventure] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    if (!selectedAdventure) return;
    setUsers([]);
    setLoading(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;

      const res = await axios.get(
        `${baseUrl}/users/by-adventure/${selectedAdventure}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      alert("Could not fetch users.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">List Users by Adventure</h1>
      <div className="flex gap-2">
        <select
          value={selectedAdventure}
          onChange={(e) => setSelectedAdventure(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Adventure</option>
          {adventureOptions
            .sort((a, b) =>
              getReadableFormat(a).localeCompare(getReadableFormat(b))
            )
            .map((adv) => (
              <option key={adv} value={adv}>
                {getReadableFormat(adv)}
              </option>
            ))}
        </select>

        <button
          onClick={fetchUsers}
          disabled={!selectedAdventure}
          className="bg-brand-teal-dark text-white px-4 py-2 rounded hover:bg-brand-teal disabled:bg-brand-gray-medium"
        >
          Lookup
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {users.length > 0 && (
        <div className="bg-white rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2">
            Found {users.length} users
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {users.map((user, index) => (
              <li key={index}>{user.userId}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
