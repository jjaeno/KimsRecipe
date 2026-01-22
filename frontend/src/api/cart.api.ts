// Responsibility: 장바구니 API 호출.

import { client, ApiError } from './client';
import { ApiResponse } from '../types/api';
import { CartResponse } from '../types/cart';

type ValidateResponse = {
  valid: boolean;
  cartId: number | null;
  items: any[];
  summary: any;
};

const isApiError = (err: any): err is ApiError => {
  return err && typeof err === 'object' && ('status' in err || 'code' in err);
};

export async function getCart(): Promise<CartResponse> {
  const res = await client.get<ApiResponse<CartResponse>>('/v1/cart');
  if (!res.data?.success) {
    throw new Error(res.data?.message || '장바구니 조회 실패');
  }
  return res.data.data as CartResponse;
}

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

export async function updateCartItemQuantity(storeMenuId: number, quantity: number) {
  const res = await client.patch<ApiResponse<{ cartId: number; storeId: number }>>(`/v1/cart/items/${storeMenuId}`, {
    quantity,
  });
  if (!res.data?.success) {
    throw new Error(res.data?.message || '장바구니 수량 변경 실패');
  }
  return res.data.data;
}

export async function removeCartItem(storeMenuId: number) {
  const res = await client.delete<ApiResponse<unknown>>(`/v1/cart/items/${storeMenuId}`);
  if (!res.data?.success) {
    throw new Error(res.data?.message || '장바구니 삭제 실패');
  }
  return res.data.data;
}

export async function removeCartItemsBulk(storeMenuIds: number[]) {
  const res = await client.delete<ApiResponse<{ removed: number }>>('/v1/cart/items', {
    data: { storeMenuIds },
  });
  if (!res.data?.success) {
    throw new Error(res.data?.message || '선택 삭제 실패');
  }
  return res.data.data;
}

export async function clearCart() {
  const res = await client.delete<ApiResponse<unknown>>('/v1/cart');
  if (!res.data?.success) {
    throw new Error(res.data?.message || '장바구니 초기화 실패');
  }
  return res.data.data;
}

export async function validateCart(priceMap: Record<string, number>, selectedIds?: string[]) {
  try {
    const res = await client.get<ApiResponse<ValidateResponse>>('/v1/cart/validate', {
      params: { 
        priceMap: JSON.stringify(priceMap) ,
        selectedIds: selectedIds ? JSON.stringify(selectedIds) : undefined
      },
    });
    if (!res.data?.success) {
      throw new Error(res.data?.message || '장바구니 검증 실패');
    }
    return res.data.data;
  } catch (err) {
    if (isApiError(err)) {
      throw err;
    }
    throw err;
  }
}
