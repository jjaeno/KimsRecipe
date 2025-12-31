// Responsibility: 장바구니 API 호출을 담당한다. HTTP 호출은 client.ts로 위임하며, 응답 파싱/검증만 수행한다.

import { client } from './client';
import { ApiResponse } from '../types/api';
import { CartItem } from '../types/cart';

type CartResponse = {
  cartId: number | null;
  storeId: number | null;
  items: CartItem[];
};

/**
 * 장바구니 조회
 */
export async function getCart(): Promise<CartResponse> {
  const res = await client.get<ApiResponse<CartResponse>>('/v1/cart');
  if (!res.data?.success) {
    throw new Error(res.data?.message || '장바구니 조회 실패');
  }
  return res.data.data || { cartId: null, storeId: null, items: [] };
}

/**
 * 장바구니 항목 추가
 */
export async function addCartItem(storeId: number, storeMenuId: number, quantity: number) {
  const res = await client.post<ApiResponse<{ cartId: number; storeId: number }>>('/v1/cart/items', {
    storeId,
    storeMenuId,
    quantity,
  });
  if (!res.data?.success) {
    throw new Error(res.data?.message || '장바구니 추가 실패');
  }
  return res.data.data;
}

/**
 * 장바구니 항목 삭제
 */
export async function removeCartItem(storeMenuId: number) {
  const res = await client.delete<ApiResponse<unknown>>(`/v1/cart/items/${storeMenuId}`);
  if (!res.data?.success) {
    throw new Error(res.data?.message || '장바구니 삭제 실패');
  }
  return res.data.data;
}

/**
 * 장바구니 전체 삭제
 */
export async function clearCart() {
  const res = await client.delete<ApiResponse<unknown>>('/v1/cart');
  if (!res.data?.success) {
    throw new Error(res.data?.message || '장바구니 초기화 실패');
  }
  return res.data.data;
}
