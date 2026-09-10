require('dotenv').config();
const { getAccessToken } = require('../../core/config/auth');

module.exports = async function globalSetup() {
  process.env.ACCESS_TOKEN = await getAccessToken();
};
