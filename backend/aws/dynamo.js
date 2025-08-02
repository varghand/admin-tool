import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function getUnlockedContent(userEmail) {
  try {
    const command = new GetItemCommand({
      TableName: process.env.UNLOCKED_CONTENT_TABLE,
      Key: {
        userId: { S: userEmail.trim().toLowerCase() },
      },
    });

    const result = await dynamoClient.send(command);
    if (!result.Item) {
      return null;
    }
    return unmarshall(result.Item);
  } catch (err) {
    console.error("Error fetching data:", err);
    return null;
  }
}
