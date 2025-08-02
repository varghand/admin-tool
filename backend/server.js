const express = require('express');
const cors = require('cors');
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

    const user = {
      userId: result.Item.userId.S,
      name: result.Item.name?.S || '',
      email: result.Item.email?.S || '',
      createdAt: result.Item.createdAt?.S || '',
    };

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