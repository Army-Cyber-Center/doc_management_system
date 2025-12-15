import apiClient from './apiClient';

export const register = async (data) => {
  const response = await apiClient.post(
    '/api/v1/auth/register',
    data
  );
  return response.data;
};
