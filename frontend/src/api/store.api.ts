// Responsibility: 매장/카테고리/메뉴 API 호출을 담당한다. HTTP 호출은 client.ts로 위임하며, 여기서는 응답 파싱/검증만 수행한다.

import { client } from './client';
import { ApiResponse } from '../types/api';
import { Store } from '../types/store';

/**
 * 모든 매장/카테고리/메뉴 트리를 조회한다.
 * @returns Store 배열
 * @throws Error 응답 형식이 잘못되었거나 HTTP 오류가 발생한 경우
 */
export async function getStores(): Promise<Store[]> {
  const res = await client.get<ApiResponse<{ stores: Store[] }>>('/v1/stores');
  const data = res.data?.data?.stores;
  if (!Array.isArray(data)) {
    throw new Error('서버 응답 형식이 올바르지 않습니다.');
  }
  return data;
}
