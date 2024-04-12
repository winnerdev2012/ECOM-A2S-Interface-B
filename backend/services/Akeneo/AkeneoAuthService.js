const axios = require('axios');
const base64 = require('base-64');
const dotenv = require('dotenv');
const { redisClient } = require('../../server');
dotenv.config();

const { AKENEO_AUTH_API_URI,
  AKENEO_API_ID,
  AKENEO_API_SECRET,
  AKENEO_API_USERNAME,
  AKENEO_API_PASSWORD } = process.env;

const getClientCredentialsToken = async () => {
  // Check Redis for token
  const redisKey = 'akeneo_access_token';
  const redisToken = await redisClient.getAsync(redisKey);
  if (redisToken) {
    return `Bearer ${redisToken}`;
  }

  const encode_string = `${AKENEO_API_ID}:${AKENEO_API_SECRET}`;
  const auth_string = base64.encode(encode_string);
  const data = {
    username: AKENEO_API_USERNAME,
    password: AKENEO_API_PASSWORD,
    grant_type: 'password',
  };
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth_string}`
  };
  const options = {
    method: 'POST',
    url: `${AKENEO_AUTH_API_URI}token`,
    data: data,
    headers: headers
  };
  const response = await axios(options);
  const tokenData = response.data;

  // Save token to Redis
  await redisClient.setAsync(redisKey, tokenData.access_token);
  await redisClient.expireAsync(redisKey, tokenData.expires_in);

  return `Bearer ${tokenData.access_token}`;
}

module.exports = {
  getClientCredentialsToken
};