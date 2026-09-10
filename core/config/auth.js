const axios = require('axios');
const config = require('./env');

async function getAccessToken() {
  const body = new URLSearchParams({ grant_type: 'client_credentials' });

  const response = await axios.post(config.authUrl, body, {
    auth: { username: config.authUserId, password: config.authPassword },
  });

  return response.data.access_token;
}

module.exports = { getAccessToken };
