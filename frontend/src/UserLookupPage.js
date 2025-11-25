import { useState } from "react";
import axios from "axios";
import { fetchAuthSession } from "@aws-amplify/auth";
import { getReadableFormat } from "./helpers/readableFormat";

const adventureOptions = [
  "coc_aatt_beta",
  "fod",
  "fist",
  "fod-expansions",
  "fod-kickstarter",
  "fist_gnoll_demo",
  "coc_aatt_demo",
  "coc_aatt",
];
const itemOptions = [
  "lw_potionOfLaumspur",
  "bandOfTheBrave",
  "ukge_potionOfLaumspur",
  "lw_axemaster",
  "lw_modern_emblem",
  "lw_swordmaster",
  "lw_warrior",
  "lw_5_gold",
  "lw_axe",
  "lw_beastbane",
  "lw_circular_emblem",
  "lw_fortunate",
  "lw_gourgaz_bleeder",
  "lw_helmet",
  "lw_meal",
  "lw_oldschool_emblem",
  "lw_phonequest_logo",
  "lw_rope",
  "lw_spearmaster",
  "aatt_brawler",
  "aatt_magnifying_glass",
  "aatt_revolver",
  "aatt_shotgun",
  "aatt_sword_cane",
];
const featureOptions = ["collector-cards", "alpha-tester", "info-pages"];

const baseUrl = process.env.REACT_APP_BACKEND_BASE_URL;

function UserLookupPage() {
  const [newAdventure, setNewAdventure] = useState("");
  const [newSpecialItem, setNewSpecialItem] = useState("");
  const [newFeature, setNewFeature] = useState("");
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
        `${baseUrl}/user/${user.email ?? userId}/adventures`,
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

  const addSpecialItem = async () => {
    if (!newSpecialItem || !userId) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;
      await axios.post(
        `${baseUrl}/user/${user.email ?? userId}/specialItems`,
        { itemId: newSpecialItem },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchUser();
      setNewSpecialItem("");
    } catch (err) {
      console.error(err);
      alert("Failed to add adventure");
    }
  };

  const addFeature = async () => {
    if (!newFeature || !userId) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;
      await axios.post(
        `${baseUrl}/user/${user.email ?? userId}/features`,
        { featureId: newFeature },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchUser();
      setNewFeature("");
    } catch (err) {
      console.error(err);
      alert("Failed to add feature");
    }
  };

  const createUser = async () => {
    if (!userId || !userId.includes("@")) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;
      await axios.post(
        `${baseUrl}/user/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchUser();
    } catch (err) {
      console.error(err);
      alert("Failed to create user");
    }
  };

  const handleRemoveAdventure = async (adventureId) => {
    if (!window.confirm(`Remove adventure: ${adventureId}?`)) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;

      await axios.delete(
        `${process.env.REACT_APP_BACKEND_BASE_URL}/users/${user.userId}/adventures/${adventureId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state after successful removal
      setUser((prev) => ({
        ...prev,
        adventures: prev.adventures.filter(
          (a) => a.adventureId !== adventureId
        ),
      }));
    } catch (err) {
      console.error("Failed to remove adventure:", err);
      alert("Could not remove adventure.");
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm(`Remove item: ${itemId}?`)) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;

      await axios.delete(
        `${process.env.REACT_APP_BACKEND_BASE_URL}/users/${user.userId}/specialItems/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state after successful removal
      setUser((prev) => ({
        ...prev,
        specialItems: prev.specialItems.filter((a) => a.itemId !== itemId),
      }));
    } catch (err) {
      console.error("Failed to remove special item:", err);
      alert("Could not remove special item.");
    }
  };

  const handleRemoveFeature = async (featureId) => {
    if (!window.confirm(`Remove feature: ${featureId}?`)) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;

      await axios.delete(
        `${process.env.REACT_APP_BACKEND_BASE_URL}/users/${user.userId}/features/${featureId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state after successful removal
      setUser((prev) => ({
        ...prev,
        features: prev.features.filter((a) => a !== featureId),
      }));
    } catch (err) {
      console.error("Failed to remove feature:", err);
      alert("Could not remove feature.");
    }
  };

  const ownedAdventureIds = new Set(
    user?.adventures?.map((a) => a.adventureId) || []
  );
  const availableAdventures = adventureOptions.filter(
    (adv) => !ownedAdventureIds.has(adv)
  );

  const ownedItemIds = new Set(user?.specialItems?.map((i) => i.itemId) || []);
  const availableItems = itemOptions.filter((item) => !ownedItemIds.has(item));

  const ownedFeatures = new Set(user?.features || []);
  const availableFeatures = featureOptions.filter(
    (item) => !ownedFeatures.has(item)
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

      {error === "User not found" && userId.includes("@") && (
        <button
          onClick={createUser}
          className="bg-brand-teal-dark text-white px-4 py-2 rounded hover:bg-brand-teal disabled:bg-brand-gray-medium"
          disabled={loading || !userId}
        >
          {loading ? "Loading..." : "Create user"}
        </button>
      )}

      {!user && (
        <p className="text-gray-500">
          Username is case-sensitive, email address is not.
        </p>
      )}

      {user && (
        <div className="bg-white rounded shadow p-6 space-y-4">
          <p>
            <strong>Username:</strong>{" "}
            {user.username ?? (
              <p className="text-red-600">
                This user has not yet set up their account in the Sound Realms
                app.
              </p>
            )}
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
                  <li key={i} className="flex items-center">
                    <span>{getReadableFormat(adv.adventureId)}</span>
                    <button
                      onClick={() => handleRemoveAdventure(adv.adventureId)}
                      className="ml-4 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {user.specialItems && (
            <div>
              <strong>Special Items/Collector Cards:</strong>
              <ul className="list-disc list-inside">
                {user.specialItems.map((item, i) => (
                  <li key={i}>
                    <span>{getReadableFormat(item.itemId)}</span>
                    <button
                      onClick={() => handleRemoveItem(item.itemId)}
                      className="ml-4 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {user.features && (
            <div>
              <strong>Feature Toggles:</strong>
              <ul className="list-disc list-inside">
                {user.features.map((item, i) => (
                  <li key={i}>
                    <span>{getReadableFormat(item)}</span>
                    <button
                      onClick={() => handleRemoveFeature(item)}
                      className="ml-4 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t border-gray-300">
            <h2 className="text-2xl font-bold mb-4">Add Content</h2>

            <label className="font-semibold">Add Adventure:</label>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                <select
                  value={newAdventure}
                  onChange={(e) => setNewAdventure(e.target.value)}
                  className="w-64 md:w-80 border border-gray-400 p-2 rounded"
                  disabled={loading}
                >
                  <option value="">Select adventure</option>
                  {availableAdventures.map((adv) => (
                    <option key={adv} value={adv}>
                      {getReadableFormat(adv)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={addAdventure}
                disabled={!newAdventure || loading}
                className="bg-brand-teal-dark text-white px-4 py-2 rounded hover:bg-brand-teal disabled:bg-brand-gray-medium"
              >
                Add
              </button>
            </div>
          </div>

          <div className="pt-4">
            <label className="font-semibold">
              Add Special Item/Collector Card:
            </label>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                <select
                  value={newSpecialItem}
                  onChange={(e) => setNewSpecialItem(e.target.value)}
                  className="w-64 md:w-80 border border-gray-400 p-2 rounded"
                  disabled={loading}
                >
                  <option value="">Select item</option>
                  {availableItems.map((item) => (
                    <option key={item} value={item}>
                      {getReadableFormat(item)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={addSpecialItem}
                disabled={!newSpecialItem || loading}
                className="bg-brand-teal-dark text-white px-4 py-2 rounded hover:bg-brand-teal disabled:bg-brand-gray-medium"
              >
                Add
              </button>
            </div>
          </div>

          <div className="pt-4">
            <label className="font-semibold">Add Feature Toggle:</label>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                <select
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="w-64 md:w-80 border border-gray-400 p-2 rounded"
                  disabled={loading}
                >
                  <option value="">Select feature</option>
                  {availableFeatures.map((item) => (
                    <option key={item} value={item}>
                      {getReadableFormat(item)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={addFeature}
                disabled={!newFeature || loading}
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
