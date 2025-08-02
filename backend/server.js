const express = require('express');
const cors = require('cors');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const command = new GetItemCommand({
      TableName: process.env.UNLOCKED_CONTENT_TABLE,
      Key: {
        userId: { S: userId },
      },
    });

    const result = await dynamoClient.send(command);

    if (!result.Item) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Convert DynamoDB item to plain JS object (handles nested arrays/objects)
    const user = unmarshall(result.Item);

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/user/:id/adventures', async (req, res) => {
  const userId = req.params.id;
  const { adventureId } = req.body;

  if (!adventureId) {
    return res.status(400).json({ error: 'adventureId is required' });
  }

  try {
    const command = new UpdateItemCommand({
      TableName: process.env.UNLOCKED_CONTENT_TABLE,
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: 'SET adventures = list_append(if_not_exists(adventures, :empty), :newItem)',
      ExpressionAttributeValues: {
        ':newItem': { L: [{ M: { adventureId: { S: adventureId } } }] },
        ':empty': { L: [] }
      },
      ReturnValues: 'UPDATED_NEW'
    });

    const result = await dynamoClient.send(command);
    res.json({ success: true, updated: result.Attributes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add adventure' });
  }
});


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
