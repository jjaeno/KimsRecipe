import { client } from './client';
import { ApiResponse } from '../types/api';

export type Address = {
  addressId: number;
  recipientName: string;
  phone: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  isDefault: number;
};

// 배송지 조회
export async function getAddresses() {
  const res = await client.get<ApiResponse<{ addresses: Address[] }>>('/v1/addresses');
  if (!res.data?.success) throw new Error(res.data?.message || '배송지 조회 실패');
  return res.data.data;
}

// 주문 생성
export async function createOrder(payload: {
  deliveryRequest: string;
  addressId?: number;
  pointsUsed: number;
}) {
  const res = await client.post<ApiResponse<any>>('/v1/orders', payload);
  if (!res.data?.success) throw new Error(res.data?.message || '주문 생성 실패');
  return res.data.data;
}

// 결제 생성
export async function createPayment(payload: { orderId: number; method: 'CARD'|'KAKAO'|'TOSS'|'OTHER' }) {
  const res = await client.post<ApiResponse<any>>('/v1/payments', payload);
  if (!res.data?.success) throw new Error(res.data?.message || '결제 생성 실패');
  return res.data.data;
}

// 결제 확정
export async function confirmPayment(paymentId: number, payload: { pgTransactionId: string; paidAmount: number }) {
  const res = await client.post<ApiResponse<any>>(`/v1/payments/${paymentId}/confirm`, payload);
  if (!res.data?.success) throw new Error(res.data?.message || '결제 확정 실패');
  return res.data.data;
}
