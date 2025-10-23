import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

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

export async function removeAccessToAdventure(userEmail, adventureId) {
  const normalizedEmail = userEmail.trim().toLowerCase();

  const getParams = {
    TableName: process.env.UNLOCKED_CONTENT_TABLE,
    Key: marshall({ userId: normalizedEmail }),
  };

  const getResult = await dynamoClient.send(new GetItemCommand(getParams));
  if (!getResult.Item) {
    throw "User not found";
  }

  const user = unmarshall(getResult.Item);

  const updatedAdventures = (user.adventures || []).filter(
    (a) => a.adventureId !== adventureId
  );

  if (updatedAdventures.length === user.adventures.length) {
    throw "Adventure not found in user's account";
  }

  const updateParams = {
    TableName: process.env.UNLOCKED_CONTENT_TABLE,
    Key: marshall({ userId: normalizedEmail }),
    UpdateExpression: "SET adventures = :adventures",
    ExpressionAttributeValues: marshall({
      ":adventures": updatedAdventures,
    }),
    ReturnValues: "UPDATED_NEW",
  };

  await dynamoClient.send(new UpdateItemCommand(updateParams));
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

export async function removeAccessToSpecialItem(userEmail, itemId) {
  const normalizedEmail = userEmail.trim().toLowerCase();

  const getParams = {
    TableName: process.env.UNLOCKED_CONTENT_TABLE,
    Key: marshall({ userId: normalizedEmail }),
  };

  const getResult = await dynamoClient.send(new GetItemCommand(getParams));
  if (!getResult.Item) {
    throw "User not found";
  }

  const user = unmarshall(getResult.Item);

  const updatedItems = (user.specialItems || []).filter(
    (a) => a.itemId !== itemId
  );

  if (updatedItems.length === user.specialItems.length) {
    throw "Special item not found in user's account";
  }

  const updateParams = {
    TableName: process.env.UNLOCKED_CONTENT_TABLE,
    Key: marshall({ userId: normalizedEmail }),
    UpdateExpression: "SET specialItems = :specialItems",
    ExpressionAttributeValues: marshall({
      ":specialItems": updatedItems,
    }),
    ReturnValues: "UPDATED_NEW",
  };

  await dynamoClient.send(new UpdateItemCommand(updateParams));
}

export async function addFeature(userEmail, featureId) {
  await createUser(userEmail);

  const normalizedEmail = userEmail.trim().toLowerCase();
  const userKey = {
    userId: { S: normalizedEmail },
  };

  const updateCommand = new UpdateItemCommand({
    TableName: process.env.UNLOCKED_CONTENT_TABLE,
    Key: userKey,
    UpdateExpression:
      "SET features = list_append(if_not_exists(features, :empty), :newItem)",
    ExpressionAttributeValues: {
      ":newItem": {
        L: [{ S: featureId }],
      },
      ":empty": { L: [] },
    },
    ReturnValues: "ALL_NEW",
  });

  return await dynamoClient.send(updateCommand);
}

export async function removeAccessToFeature(userEmail, featureId) {
  const normalizedEmail = userEmail.trim().toLowerCase();

  const getParams = {
    TableName: process.env.UNLOCKED_CONTENT_TABLE,
    Key: marshall({ userId: normalizedEmail }),
  };

  const getResult = await dynamoClient.send(new GetItemCommand(getParams));
  if (!getResult.Item) {
    throw "User not found";
  }

  const user = unmarshall(getResult.Item);

  const updatedFeatures = (user.features || []).filter((a) => a !== featureId);

  if (updatedFeatures.length === user.features.length) {
    throw "Feature not found in user's account";
  }

  const updateParams = {
    TableName: process.env.UNLOCKED_CONTENT_TABLE,
    Key: marshall({ userId: normalizedEmail }),
    UpdateExpression: "SET features = :features",
    ExpressionAttributeValues: marshall({
      ":features": updatedFeatures,
    }),
    ReturnValues: "UPDATED_NEW",
  };

  await dynamoClient.send(new UpdateItemCommand(updateParams));
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

export async function getAvailableContent() {
  try {
    const command = new ScanCommand({
      TableName: process.env.AVAILABLE_CONTENT_TABLE,
    });

    const result = await dynamoClient.send(command);
    if (!result.Items) {
      return []; 
    }

    const adventures = result.Items.map(unmarshall);
    adventures.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    return adventures;
  } catch (err) {
    console.error("Error fetching data:", err);
    return [];
  }
}