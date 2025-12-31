// Responsibility: 인증 관련 API 호출을 담당한다. 로그인/회원가입/아이디 중복 확인을 수행한다.

import { client } from './client';
import { ApiResponse } from '../types/api';

type AuthPayload = { username: string; password: string };
type SignupPayload = { username: string; name: string; password: string; confirmPassword: string; phone?: string };

export type LoginResult = {
  token: string;
  userId: number;
  username: string;
  name: string;
  phone?: string | null;
};

export async function login(payload: AuthPayload): Promise<LoginResult> {
  const res = await client.post<ApiResponse<LoginResult>>('/v1/auth/login', payload);
  if (!res.data?.success || !res.data?.data) {
    throw new Error(res.data?.message || '로그인에 실패했습니다.');
  }
  return res.data.data;
}

export async function signup(payload: SignupPayload) {
  const res = await client.post<ApiResponse<{ userId: number }>>('/v1/auth/signup', payload);
  if (!res.data?.success) {
    throw new Error(res.data?.message || '회원가입에 실패했습니다.');
  }
  return res.data.data;
}

export async function checkUsername(username: string): Promise<{ available: boolean; message: string }> {
  const res = await client.get<ApiResponse<{ available: boolean }>>('/v1/auth/check-username', {
    params: { username },
  });
  if (!res.data) {
    throw new Error('서버 응답이 없습니다.');
  }
  const available = !!res.data.data?.available;
  const message = res.data.message || (available ? '사용 가능한 아이디입니다.' : '이미 사용 중입니다.');
  return { available, message };
}
