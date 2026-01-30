import { client } from './client';

export interface HomePartyEventInfo {
  storeId: number;
  eventType: string;
  headcount: number;
  eventDateTime: string;
}

export async function fetchRecommendedSet(params: { storeId: number; eventType: string; headcount: number }) {
  const response = await client.get('/v1/home-party/sets/recommend', { params });
  return response.data.data.sets;
}

export async function estimateReservation(payload: {
  storeId: number;
  eventType: string;
  headcount: number;
  setId?: number;
  itemsOverride?: { storeMenuId: number; quantity: number }[];
}) {
  const response = await client.post('/v1/home-party/reservations/estimate', payload);
  return response.data.data;
}
