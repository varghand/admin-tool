import { useState } from "react";
import axios from "axios";

function App() {
  const adventureOptions = ["coc_aatt_beta", "fod", "fist"];

  const [newAdventure, setNewAdventure] = useState("");

  const [userId, setUserId] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const fetchUser = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/user/${userId}`);
      setUser(res.data);
      setError("");
    } catch (err) {
      setUser(null);
      if (err.response?.status === 404) {
        setError("User not found");
      } else {
        setError("An error occurred");
      }
    }
  };

  const addAdventure = async () => {
    if (!newAdventure || !userId) return;

    try {
      await axios.post(`http://localhost:3001/user/${userId}/adventures`, {
        adventureId: newAdventure,
      });
      fetchUser(); // refresh user data
      setNewAdventure("");
    } catch (err) {
      console.error(err);
      alert("Failed to add adventure");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Sound Realms Admin Tool</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="border p-2 rounded w-64"
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button
          onClick={fetchUser}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Lookup
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {user && (
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
              >
                <option value="">Select adventure</option>
                {adventureOptions.map((adv) => (
                  <option key={adv} value={adv}>
                    {adv}
                  </option>
                ))}
              </select>
              <button
                onClick={addAdventure}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
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

export default App;
