import { useState } from "react";
import axios from "axios";

function App() {
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
        </div>
      )}
    </div>
  );
}

export default App;
