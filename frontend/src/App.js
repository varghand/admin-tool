import { useState } from 'react';
import axios from 'axios';

function App() {
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const fetchUser = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/user/${userId}`);
      setUser(res.data);
      setError('');
    } catch (err) {
      setUser(null);
      if (err.response?.status === 404) {
        setError('User not found');
      } else {
        setError('An error occurred');
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
        <div className="bg-white p-4 rounded shadow w-80">
          <p><strong>ID:</strong> {user.userId}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Created:</strong> {user.createdAt}</p>
        </div>
      )}
    </div>
  );
}

export default App;