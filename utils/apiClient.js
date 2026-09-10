const axios = require('axios');
const config = require('../core/config/env');
const { getAccessToken } = require('../core/config/auth');

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

apiClient.interceptors.request.use((requestConfig) => {
  if (process.env.ACCESS_TOKEN) {
    requestConfig.headers.Authorization = `Bearer ${process.env.ACCESS_TOKEN}`;
  }
  return requestConfig;
});

// Refresh the token once on 401 and retry the original request.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      process.env.ACCESS_TOKEN = await getAccessToken();
      originalRequest.headers.Authorization = `Bearer ${process.env.ACCESS_TOKEN}`;
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);

module.exports = apiClient;
