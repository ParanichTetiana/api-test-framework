module.exports = {
  authUrl: process.env.AUTH_URL,
  authUserId: process.env.AUTH_USER_ID,
  authPassword: process.env.AUTH_PASSWORD,
  apiBaseUrl: process.env.API_BASE_URL,
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
  },
};
