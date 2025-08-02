import { useState } from "react";
import axios from "axios";

import { Authenticator } from "@aws-amplify/ui-react";

function App() {
  const adventureOptions = ["coc_aatt_beta", "fod", "fist"];
  // const baseUrl = 'http://localhost:3001';
  const baseUrl = "https://sr-admin-backend-b76118fcd0f9.herokuapp.com";

  const [newAdventure, setNewAdventure] = useState("");
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    if (!userId) return;

    setLoading(true);
    setUser(null); // hide previous user data on every lookup
    setError("");

    try {
      const res = await axios.get(`${baseUrl}/user/${userId}`);
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
      await axios.post(`${baseUrl}/user/${userId}/adventures`, {
        adventureId: newAdventure,
      });
      fetchUser(); // refresh user data
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
    <Authenticator signUpAttributes={[]} variation="modal" hideSignUp={true}>
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Sound Realms Admin Tool</h1>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="border p-2 rounded w-64"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={fetchUser}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
            disabled={loading || !userId}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 mx-auto text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              "Lookup"
            )}
          </button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        {!loading && user && (
          <div className="bg-white p-4 rounded shadow w-full max-w-lg space-y-2">
            <p>
              <strong>ID:</strong> {user.userId}
            </p>

            {user.access && (
              <div>
                <strong>Special Access:</strong>
                <ul className="list-disc list-inside">
                  {user.access.map((a, i) => (
                    <li key={i}>{a.specialAccess}</li>
                  ))}
                </ul>
              </div>
            )}

            {user.adventures && (
              <div>
                <strong>Adventures:</strong>
                <ul className="list-disc list-inside">
                  {user.adventures.map((adv, i) => (
                    <li key={i}>{adv.adventureId}</li>
                  ))}
                </ul>
              </div>
            )}

            {user.specialItems && (
              <div>
                <strong>Special Items:</strong>
                <ul className="list-disc list-inside">
                  {user.specialItems.map((item, i) => (
                    <li key={i}>{item.itemId}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <label className="font-semibold">Add Adventure:</label>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={newAdventure}
                  onChange={(e) => setNewAdventure(e.target.value)}
                  className="border p-2 rounded"
                  disabled={loading}
                >
                  <option value="">Select adventure</option>
                  {availableAdventures.map((adv) => (
                    <option key={adv} value={adv}>
                      {adv}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addAdventure}
                  disabled={!newAdventure || loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Authenticator>
  );
}

export default App;
