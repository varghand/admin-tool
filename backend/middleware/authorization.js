import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
dotenv.config();

const AWS_REGION = process.env.AWS_REGION;
const TABLE_NAME = process.env.UNLOCKED_CONTENT_TABLE;

const ddbClient = new DynamoDBClient({ region: AWS_REGION });

export async function checkAdminAccess(req, res, next) {
  const userEmail = req.user.email; // Use email from token

  if (!userEmail) {
    return res.status(400).send("User email missing in token");
  }

  const params = {
    TableName: TABLE_NAME,
    Key: { userId: { S: userEmail } },
    ProjectionExpression: "specialAccess"
  };

  try {
    const data = await ddbClient.send(new GetItemCommand(params));
    const access = data.Item?.specialAccess?.SS || [];
    if (access.includes("varghand-employee")) {
      next();
    } else {
      res.status(403).send("Forbidden: insufficient access");
    }
  } catch (error) {
    console.error("DynamoDB error:", error);
    res.status(500).send("Internal server error");
  }
}
