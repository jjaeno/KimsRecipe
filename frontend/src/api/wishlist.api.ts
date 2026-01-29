// Responsibility: 찜(wishlist) API 호출.

import { client } from './client';
import { ApiResponse } from '../types/api';
import { WishlistResponse } from '../types/wishlist';

export async function getWishlist(): Promise<WishlistResponse> {
  const res = await client.get<ApiResponse<WishlistResponse>>('/v1/wishlists');
  if (!res.data?.success) {
    throw new Error(res.data?.message || '찜 목록 조회 실패');
  }
  return res.data.data as WishlistResponse;
}

export async function addWishlistItem(storeMenuId: number) {
  const res = await client.post<ApiResponse<{ storeMenuId: string; added: boolean }>>('/v1/wishlists', {
    storeMenuId,
  });
  if (!res.data?.success) {
    throw new Error(res.data?.message || '찜 추가 실패');
  }
  return res.data.data;
}

export async function removeWishlistItem(storeMenuId: number) {
  const res = await client.delete<ApiResponse<{ storeMenuId: string; removed: boolean }>>(`/v1/wishlists/${storeMenuId}`);
  if (!res.data?.success) {
    throw new Error(res.data?.message || '찜 해제 실패');
  }
  return res.data.data;
}
