const express = require('express');
const cors = require('cors');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const command = new GetItemCommand({
      TableName: 'unlocked-content-table-prod',
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
