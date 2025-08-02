import express from 'express';
import cors from 'cors';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';
dotenv.config();

import { verifyCognitoToken } from './middleware/authentication.js';
import { checkAdminAccess } from './middleware/authorization.js';
import { getCognitoUser, getCognitoUserByUsername } from "./aws/cognito.js";
import { getUnlockedContent } from './aws/dynamo.js';


const app = express();
app.use(cors());
app.use(express.json());

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

app.get('/user/:id', verifyCognitoToken,
  checkAdminAccess, async (req, res) => {
  const userId = req.params.id;

  try {
    var user;
    var cognitoUser;
    if (userId.includes("@")) {
      cognitoUser = await getCognitoUser(userId);
      user = await getUnlockedContent(userId);
    } else {
      cognitoUser = await getCognitoUserByUsername(userId);
      console.log(cognitoUser.attributes.email)
      user = await getUnlockedContent(cognitoUser.attributes.email);
      console.log(user)
    }
    

    if (!user && !cognitoUser) {
      return res.status(404).json({ error: 'User not found' });
    }


    res.json({...user, username: cognitoUser?.username});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/user/:id/adventures', verifyCognitoToken,
  checkAdminAccess, async (req, res) => {
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
