import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import dotenv from 'dotenv';
dotenv.config();

const USER_POOL_ID = process.env.USER_POOL_ID;
const AWS_REGION = process.env.AWS_REGION;

const client = jwksClient({
  jwksUri: `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export function verifyCognitoToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).send('Missing token');

  jwt.verify(token, getKey, {
    algorithms: ['RS256'],
    issuer: `https://cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`
  }, (err, decoded) => {
    if (err) return res.status(401).send('Invalid token');
    req.user = decoded;
    next();
  });
}
