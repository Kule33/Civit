import axios from 'axios';

const API_BASE_URL = 'http://localhost:5201/api/auth';

export const register = async (email, password, emailRedirectTo) => {
  const response = await axios.post(`${API_BASE_URL}/register`, {
    email,
    password,
    emailRedirectTo
  });
  return response.data;
};

export const login = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/login`, {
    email,
    password
  });
  return response.data; // should include access_token and refresh_token
};

export const refreshToken = async (refreshToken) => {
  const response = await axios.post(`${API_BASE_URL}/refresh`, {
    refreshToken,
  });
  return response.data;
};
