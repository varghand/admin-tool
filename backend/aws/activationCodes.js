import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });


export async function countUnlocksById() {
  const tableName = process.env.ACTIVATION_CODES_TABLE;
  let lastKey;
  const allItems = [];

  do {
    const response = await dynamoClient.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastKey,
      })
    );

    const items = (response.Items || []).map((item) => unmarshall(item));
    allItems.push(...items);
    lastKey = response.LastEvaluatedKey;
  } while (lastKey);

  const resultMap = new Map();

  for (const item of allItems) {
    const id = item.unlocks?.id;
    const type = item.unlocks?.type;

    if (!id) continue;

    if (!resultMap.has(id)) {
      resultMap.set(id, {
        id,
        type: type || "unknown",
        total: 0,
        used: 0,
      });
    }

    const entry = resultMap.get(id);
    entry.total += 1;
    if (item.used === true) {
      entry.used += 1;
    }
  }

  return Array.from(resultMap.values());
}
