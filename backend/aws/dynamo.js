import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

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

export async function addAccessToAdventure(userEmail, adventureId) {
  await createUser(userEmail);

  const normalizedEmail = userEmail.trim().toLowerCase();
  const userKey = {
    userId: { S: normalizedEmail },
  };
  
  const updateCommand = new UpdateItemCommand({
    TableName: process.env.UNLOCKED_CONTENT_TABLE,
    Key: userKey,
    UpdateExpression:
      "SET adventures = list_append(if_not_exists(adventures, :empty), :newItem)",
    ExpressionAttributeValues: {
      ":newItem": {
        L: [
          {
            M: {
              adventureId: { S: adventureId },
            },
          },
        ],
      },
      ":empty": { L: [] },
    },
    ReturnValues: "ALL_NEW",
  });

  return await dynamoClient.send(updateCommand);
}

export async function addSpecialItem(userEmail, itemId) {
  await createUser(userEmail);

  const normalizedEmail = userEmail.trim().toLowerCase();
  const userKey = {
    userId: { S: normalizedEmail },
  };

  const updateCommand = new UpdateItemCommand({
    TableName: process.env.UNLOCKED_CONTENT_TABLE,
    Key: userKey,
    UpdateExpression:
      "SET specialItems = list_append(if_not_exists(specialItems, :empty), :newItem)",
    ExpressionAttributeValues: {
      ":newItem": {
        L: [
          {
            M: {
              itemId: { S: itemId },
            },
          },
        ],
      },
      ":empty": { L: [] },
    },
    ReturnValues: "ALL_NEW",
  });

  return await dynamoClient.send(updateCommand);
}

export async function createUser(userEmail) {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const userKey = {
    userId: { S: normalizedEmail },
  };

  // Step 1: Check if user already exists
  const getCommand = new GetItemCommand({
    TableName: process.env.UNLOCKED_CONTENT_TABLE,
    Key: userKey,
  });

  const existing = await dynamoClient.send(getCommand);

  if (!existing.Item) {
    // Step 2: If not found, create new user
    const putCommand = new PutItemCommand({
      TableName: process.env.UNLOCKED_CONTENT_TABLE,
      Item: {
        userId: { S: normalizedEmail },
        createdAt: { S: new Date().toISOString() },
      },
    });

    return await dynamoClient.send(putCommand);
  }
}