import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function countUnlocksById() {
  const tableName = process.env.ACTIVATION_CODES_TABLE;

  const resultMap = new Map();
  let lastEvaluatedKey = undefined;

  do {
    const command = new ScanCommand({
      TableName: tableName,
      ProjectionExpression: "unlocks, used", // Fetch only necessary fields
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await dynamoClient.send(command);
    const items = response.Items || [];

    for (const item of items) {
      const unlock = item.unlocks?.M;
      const used = item.used?.BOOL || false;

      const id = unlock?.id?.S;
      const type = unlock?.type?.S;

      if (!id || !type) continue;

      if (!resultMap.has(id)) {
        resultMap.set(id, {
          id,
          type,
          total: 0,
          used: 0,
        });
      }

      const entry = resultMap.get(id);
      entry.total += 1;
      if (used) {
        entry.used += 1;
      }
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return Array.from(resultMap.values());
}
