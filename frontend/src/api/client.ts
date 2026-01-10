// Responsibility: Axios 클라이언트 설정 및 공통 동작 정의. baseURL과 타임아웃을 설정하고, 요청/응답 시 공통 처리 로직을 추가합니다.

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DEVICE } from '@env';

export const client = axios.create({
  baseURL: API_DEVICE,
  timeout: 10000,
});

console.log('[api] baseURL:', API_DEVICE);

// 요청 인터셉터: AsyncStorage에 저장된 토큰을 Authorization 헤더에 추가
client.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // 저장소 접근 실패 시 조용히 넘어감 (별도 알림 없음)
  }
  return config;
});

// 응답 인터셉터: 오류 발생 시 메시지 가공 후 throw
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }

    const message =
      error?.response?.data?.message ||
      error?.message ||
      '네트워크 요청 중 알 수 없는 오류가 발생했습니다.';
    return Promise.reject(new Error(message));
  },
);
