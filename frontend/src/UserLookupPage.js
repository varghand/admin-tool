import { useState } from "react";
import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";
import { getReadableFormat } from "./helpers/readableFormat";

const adventureOptions = ["coc_aatt_beta", "fod", "fist"];
const baseUrl = process.env.REACT_APP_BACKEND_BASE_URL;

function UserLookupPage() {
  const [newAdventure, setNewAdventure] = useState("");
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    if (!userId) return;

    setLoading(true);
    setUser(null);
    setError("");

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;
      const res = await axios.get(`${baseUrl}/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(res.data);
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("User not found");
      } else {
        setError("An error occurred");
      }
    }

    setLoading(false);
  };

  const addAdventure = async () => {
    if (!newAdventure || !userId) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;
      await axios.post(
        `${baseUrl}/user/${user.email}/adventures`,
        { adventureId: newAdventure },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchUser();
      setNewAdventure("");
    } catch (err) {
      console.error(err);
      alert("Failed to add adventure");
    }
  };

  const ownedAdventureIds = new Set(
    user?.adventures?.map((a) => a.adventureId) || []
  );
  const availableAdventures = adventureOptions.filter(
    (adv) => !ownedAdventureIds.has(adv)
  );

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold mb-4">User Lookup</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="border border-gray-400 p-2 rounded w-full max-w-md"
          placeholder="Enter username or email"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchUser();
          }}
          disabled={loading}
        />
        <button
          onClick={fetchUser}
          className="bg-brand-teal-dark text-white px-4 py-2 rounded hover:bg-brand-teal disabled:bg-brand-gray-medium"
          disabled={loading || !userId}
        >
          {loading ? "Loading..." : "Lookup"}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {!user && (
        <p className="text-gray-500">Username is case-sensitive, email address is not.</p>
      )}

      {user && (
        <div className="bg-white rounded shadow p-6 space-y-4">
          <p>
            <strong>Username:</strong> {user.username ?? <p className="text-red-600">This user has not yet set up their account in the Sound Realms app.</p>}
          </p>
          <p>
            <strong>Email:</strong> {user.email ?? user.userId}
          </p>

          {user.access && (
            <div>
              <strong>Special Access:</strong>
              <ul className="list-disc list-inside">
                {user.access.map((a, i) => (
                  <li key={i}>{getReadableFormat(a.specialAccess)}</li>
                ))}
              </ul>
            </div>
          )}

          {user.adventures && (
            <div>
              <strong>Adventures:</strong>
              <ul className="list-disc list-inside">
                {user.adventures.map((adv, i) => (
                  <li key={i}>{getReadableFormat(adv.adventureId)}</li>
                ))}
              </ul>
            </div>
          )}

          {user.specialItems && (
            <div>
              <strong>Special Items:</strong>
              <ul className="list-disc list-inside">
                {user.specialItems.map((item, i) => (
                  <li key={i}>{getReadableFormat(item.itemId)}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-gray-300">
            <label className="font-semibold">Add Adventure:</label>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={newAdventure}
                onChange={(e) => setNewAdventure(e.target.value)}
                className="border border-gray-400 p-2 rounded"
                disabled={loading}
              >
                <option value="">Select adventure</option>
                {availableAdventures.map((adv) => (
                  <option key={adv} value={adv}>
                    {getReadableFormat(adv)}
                  </option>
                ))}
              </select>
              <button
                onClick={addAdventure}
                disabled={!newAdventure || loading}
                className="bg-brand-teal-dark text-white px-4 py-2 rounded hover:bg-brand-teal disabled:bg-brand-gray-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserLookupPage;
