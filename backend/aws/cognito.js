// services/cognito.js
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

/**
 * Get a user from Cognito by email (username).
 * @param {string} email - Cognito username (usually email).
 * @returns {Promise<object|null>} Cognito user object or null if not found.
 */
export async function getCognitoUser(email) {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
    });

    const response = await cognitoClient.send(command);
    return {
      username: response.Username,
      enabled: response.Enabled,
      status: response.UserStatus,
      attributes: Object.fromEntries(
        response.UserAttributes.map((attr) => [attr.Name, attr.Value])
      ),
    };
  } catch (error) {
    if (error.name === "UserNotFoundException") {
      return null;
    }
    console.error("Cognito error:", error);
    throw error;
  }
}

export async function getCognitoUserByUsername(username) {
  try {
    const command = new AdminGetUserCommand({
      Username: username,
      UserPoolId: process.env.USER_POOL_ID,
    });

    const response = await cognitoClient.send(command);
    return {
      username: response.Username,
      enabled: response.Enabled,
      status: response.UserStatus,
      attributes: Object.fromEntries(
        response.UserAttributes.map((attr) => [attr.Name, attr.Value])
      ),
    };
  } catch (err) {
    if (err.name === "UserNotFoundException") {
      return null; // return null if not found
    }
    console.error("Error fetching Cognito user:", err);
    throw err;
  }
}
