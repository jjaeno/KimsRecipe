import { client } from './client';
import { ApiResponse } from '../types/api';

export type Address = {
  addressId: number;
  userId?: number;
  label?: string | null;
  recipientName: string;
  phone: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  isDefault: number;
  created_at?: string;
  updated_at?: string;
};

// 배송지 목록 조회
export async function getAddresses() {
  const res = await client.get<ApiResponse<{ addresses: Address[] }>>('/v1/addresses');
  if (!res.data?.success) throw new Error(res.data?.message || 'Address list failed');
  return res.data.data;
}

// 기본 배송지 조회
export async function getMyAddress() {
  const res = await client.get<ApiResponse<Address | null>>('/v1/addresses/me');
  if (!res.data?.success) throw new Error(res.data?.message || 'Default address fetch failed');
  return res.data.data;
}

// 배송지 생성
export async function createAddress(payload: {
  label?: string | null;
  recipientName: string;
  phone: string;
  postalCode?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  isDefault: number;
}) {
  const res = await client.post<ApiResponse<Address>>('/v1/addresses', payload);
  if (!res.data?.success) throw new Error(res.data?.message || 'Create address failed');
  return res.data.data;
}

// 배송지 수정
export async function updateAddress(
  addressId: number,
  payload: {
    label?: string | null;
    recipientName: string;
    phone: string;
    postalCode?: string | null;
    addressLine1: string;
    addressLine2?: string | null;
    isDefault: number;
  }
) {
  const res = await client.put<ApiResponse<Address>>(`/v1/addresses/${addressId}`, payload);
  if (!res.data?.success) throw new Error(res.data?.message || 'Update address failed');
  return res.data.data;
}

// 주문 생성
export async function createOrder(payload: {
  deliveryRequest: string;
  addressId?: number;
  pointsUsed: number;
}) {
  const res = await client.post<ApiResponse<any>>('/v1/orders', payload);
  if (!res.data?.success) throw new Error(res.data?.message || 'Create order failed');
  return res.data.data;
}

// 결제 생성
export async function createPayment(payload: { orderId: number; method: 'CARD'|'KAKAO'|'TOSS'|'OTHER' }) {
  const res = await client.post<ApiResponse<any>>('/v1/payments', payload);
  if (!res.data?.success) throw new Error(res.data?.message || 'Create payment failed');
  return res.data.data;
}

// 결제 확정
export async function confirmPayment(paymentId: number, payload: { pgTransactionId: string; paidAmount: number }) {
  const res = await client.post<ApiResponse<any>>(`/v1/payments/${paymentId}/confirm`, payload);
  if (!res.data?.success) throw new Error(res.data?.message || 'Confirm payment failed');
  return res.data.data;
}
