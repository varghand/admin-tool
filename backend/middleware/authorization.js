import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb';

import dotenv from "dotenv";
dotenv.config();

const AWS_REGION = process.env.AWS_REGION;
const TABLE_NAME = process.env.UNLOCKED_CONTENT_TABLE;

const ddbClient = new DynamoDBClient({ region: AWS_REGION });

async function getUserByEmail(userEmail) {
  const params = {
    TableName: TABLE_NAME,
    Key: { userId: { S: userEmail } },
  };
  const data = await ddbClient.send(new GetItemCommand(params));
  if (!data.Item) return null;
  return unmarshall(data.Item);
}

function requireSpecialAccess(specialAccess) {
  return async (req, res, next) => {
    const userEmail = req.user?.email?.trim();
    if (!userEmail) {
      return res.status(400).send("User email missing in token");
    }

    try {
      const user = await getUserByEmail(userEmail);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }

      if (user.access && user.access.some(a => a.specialAccess === specialAccess)) {
        return next();
      } else {
        return res.status(403).send("Forbidden: insufficient access");
      }
    } catch (error) {
      console.error("DynamoDB error:", error);
      return res.status(500).send("Internal server error");
    }
  };
}

export const checkAdminAccess = requireSpecialAccess("varghand-employee");
export const checkPowerlordAccess = requireSpecialAccess("sound-realms-powerlord");
