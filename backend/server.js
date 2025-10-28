import express from "express";
import cors from "cors";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
dotenv.config();

import { verifyCognitoToken } from "./middleware/authentication.js";
import { checkAdminAccess } from "./middleware/authorization.js";
import {
  getCognitoUserByEmail,
  getCognitoUserByUsername,
} from "./aws/cognito.js";
import {
  addAccessToAdventure,
  getUnlockedContent,
  addSpecialItem,
  createUser,
  removeAccessToAdventure,
  addFeature,
  removeAccessToSpecialItem,
  removeAccessToFeature,
  getAvailableContent,
  updateAdventureStatus,
} from "./aws/dynamo.js";
import { getStripeSales } from "./stripe/stripe.js";
import { getShopifySales } from "./shopify/shopify.js";
import { countUnlocksById, getUsedCodesByUnlockId } from "./aws/activationCodes.js";
import { triggerActiveCampaignAutomation } from "./activeCampaign/activeCampaign.js";
import { getAppleIAPSales } from "./apple/apple.js";

const app = express();
app.use(cors());
app.use(express.json());

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/user/:id", verifyCognitoToken, checkAdminAccess, async (req, res) => {
  const userId = req.params.id;

  try {
    var user;
    var cognitoUser;
    if (userId.includes("@")) {
      cognitoUser = await getCognitoUserByEmail(userId);
      user = await getUnlockedContent(userId);
    } else {
      cognitoUser = await getCognitoUserByUsername(userId);
      if (!cognitoUser) {
        return res.status(404).json({ error: "User not found" });
      }
      user = await getUnlockedContent(cognitoUser.attributes.email);
    }

    if (!user && !cognitoUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      ...user,
      username: cognitoUser?.username,
      email: cognitoUser?.attributes.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post(
  "/user/:id",
  verifyCognitoToken,
  checkAdminAccess,
  async (req, res) => {
    const userId = req.params.id;
    const { adventureId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    try {
      await createUser(userId, adventureId);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create user" });
    }
  }
);

app.post(
  "/user/:id/adventures",
  verifyCognitoToken,
  checkAdminAccess,
  async (req, res) => {
    const userId = req.params.id;
    const { adventureId } = req.body;

    if (!adventureId) {
      return res.status(400).json({ error: "adventureId is required" });
    }

    if (!userId || !userId.includes("@")) {
      return res.status(400).json({ error: "userId must be an email address" });
    }

    try {
      await addAccessToAdventure(userId, adventureId);
      if (adventureId === "coc_aatt_beta") {
        triggerActiveCampaignAutomation(userId, "aatt-beta-user")
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add adventure" });
    }
  }
);

app.delete("/users/:id/adventures/:adventureId", async (req, res) => {
  const { id, adventureId } = req.params;

  if (!id || !adventureId) {
    return res.status(400).json({ error: "User ID and Adventure ID are required" });
  }

  try {
    removeAccessToAdventure(id, adventureId);

    res.json({ message: `Adventure ${adventureId} removed from user ${id}` });
  } catch (error) {
    console.error("Error removing adventure:", error);
    res.status(500).json({ error: "Failed to remove adventure" });
  }
});

app.post(
  "/user/:id/specialItems",
  verifyCognitoToken,
  checkAdminAccess,
  async (req, res) => {
    const userId = req.params.id;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: "itemId is required" });
    }

    try {
      await addSpecialItem(userId, itemId);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add adventure" });
    }
  }
);

app.delete("/users/:id/specialItems/:itemId", async (req, res) => {
  const { id, itemId } = req.params;

  if (!id || !itemId) {
    return res.status(400).json({ error: "User ID and Item ID are required" });
  }

  try {
    removeAccessToSpecialItem(id, itemId);

    res.json({ message: `Special Item ${itemId} removed from user ${id}` });
  } catch (error) {
    console.error("Error removing special item:", error);
    res.status(500).json({ error: "Failed to remove special item" });
  }
});

app.post(
  "/user/:id/features",
  verifyCognitoToken,
  checkAdminAccess,
  async (req, res) => {
    const userId = req.params.id;
    const { featureId } = req.body;

    if (!featureId) {
      return res.status(400).json({ error: "featureId is required" });
    }

    try {
      await addFeature(userId, featureId);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add feature" });
    }
  }
);

app.delete("/users/:id/features/:featureId", async (req, res) => {
  const { id, featureId } = req.params;

  if (!id || !featureId) {
    return res.status(400).json({ error: "User ID and Feature ID are required" });
  }

  try {
    removeAccessToFeature(id, featureId);

    res.json({ message: `FEature ${featureId} removed from user ${id}` });
  } catch (error) {
    console.error("Error removing feature:", error);
    res.status(500).json({ error: "Failed to remove feature" });
  }
});

app.get(
  "/users/by-adventure/:adventureId",
  verifyCognitoToken,
  checkAdminAccess,
  async (req, res) => {
    const { adventureId } = req.params;

    const command = new ScanCommand({
      TableName: process.env.UNLOCKED_CONTENT_TABLE,
      FilterExpression: "contains(adventures, :adventure)",
      ExpressionAttributeValues: {
        ":adventure": { M: { adventureId: { S: adventureId } } },
      },
    });

    try {
      const result = await dynamoClient.send(command);
      const users = result.Items.map((item) => unmarshall(item));
      res.json(users);
    } catch (error) {
      console.error("Error scanning for users by adventure:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.get("/sales", verifyCognitoToken, checkAdminAccess, async (req, res) => {
  try {
    const month = parseInt(req.query.month); // 0-based: January = 0
    const year = parseInt(req.query.year);

    if (isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year provided" });
    }

    const stripeSales = await getStripeSales(month, year);
    const shopifySales = await getShopifySales(parseInt(month), parseInt(year));
    const appleSales = await getAppleIAPSales(parseInt(year), parseInt(month)+1);
    res.json([...stripeSales, ...shopifySales, ...appleSales]);
  } catch (error) {
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error("Error status:", error.response.status);
      console.error("Error headers:", error.response.headers);
      console.error("Error data:", error.response.data.toString());
    } else {
      console.error("Failed to fetch sales data:", error);
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/activation-code-stats",
  verifyCognitoToken,
  checkAdminAccess,
  async (req, res) => {
    try {
      const result = await countUnlocksById();
      res.json(result);
    } catch (err) {
      console.error("Failed to count unlocks:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/activation-codes/used/:unlockId",
  verifyCognitoToken,
  checkAdminAccess,
  async (req, res) => {
    const { unlockId } = req.params;

    try {
      const result = await getUsedCodesByUnlockId(unlockId);
      res.json(result);
    } catch (err) {
      console.error("Failed to count unlocks:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get("/apple-sales", verifyCognitoToken, checkAdminAccess, async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: "Missing required query params: year, month" });
    }

    const sales = await getAppleIAPSales(parseInt(year), parseInt(month));
    res.json({ sales });
  } catch (error) {
    if (error.response) {
      // Server responded with a status code outside 2xx
      console.error("Error status:", error.response.status);
      console.error("Error headers:", error.response.headers);
      console.error("Error data:", error.response.data.toString());
    } else {
      console.error("Failed to fetch Apple IAP sales:", error);
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(
  "/api/available-adventures",
  verifyCognitoToken,
  checkAdminAccess,
  async (req, res) => {
    try {
      const result = await getAvailableContent();
      res.set("Cache-Control", "no-store"); 
      res.json(result);
    } catch (err) {
      console.error("Failed to count unlocks:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.put(
  "/api/available-adventures/:adventureId/status",
  verifyCognitoToken,
  checkAdminAccess,
  async (req, res) => {
    const { adventureId } = req.params;
    const { status } = req.body;

    if (!adventureId || !status) {
      return res.status(400).json({ error: "Missing adventureId or status" });
    }

    try {
      const result = await updateAdventureStatus(adventureId, status);
      res.json(result);
    } catch (err) {
      console.error("Failed to update adventure status:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
