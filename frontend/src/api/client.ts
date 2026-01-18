// Responsibility: Axios 클라이언트 설정 및 공통 동작 정의.

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DEVICE } from '@env';

export type ApiError = Error & {
  status?: number;
  code?: string;
  data?: any;
};

export const client = axios.create({
  baseURL: API_DEVICE,
  timeout: 10000,
});

console.log('[api] baseURL:', API_DEVICE);

client.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // storage 접근 실패는 조용히 무시
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }

    const payload = error?.response?.data;
    const message =
      payload?.message ||
      error?.message ||
      '네트워크 요청 중 오류가 발생했습니다.';

    const apiError = new Error(message) as ApiError;
    apiError.status = error?.response?.status;
    apiError.code = payload?.code;
    apiError.data = payload?.data;

    return Promise.reject(apiError);
  },
);
