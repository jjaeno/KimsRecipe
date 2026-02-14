import { client } from './client';
import type { HomePartyCategory, HomePartyMenu, SelectedItem } from '../types/homeParty';

export interface HomePartyEventInfo {
  storeId: number;
  eventType: string;
  headcount: number;
  eventDateTime: string;
}

export interface RecommendedSetItem {
  setId: number;
  hpMenuId: number;
  menuName: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export interface RecommendedSet {
  setId: number;
  setName: string;
  imageUrl?: string;
  basePrice: number;
  recommendedMinHeadcount: number;
  recommendedMaxHeadcount: number;
  items: RecommendedSetItem[];
}

export async function fetchRecommendedSet(params: { storeId: number; eventType: string; headcount: number }) {
  const response = await client.get('/v1/home-party/sets/recommend', { params });
  return response.data.data.sets as RecommendedSet[];
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

export async function fetchHomePartyCategories(params: { storeId: string }) {
  const response = await client.get('/v1/home-party/categories', { params });
  return response.data.data.categories as HomePartyCategory[];
}

export async function fetchHomePartyMenus(params: { storeId: string; hpCategoryId?: string; q?: string }) {
  const response = await client.get('/v1/home-party/menus', { params });
  return response.data.data.menus as HomePartyMenu[];
}

export async function fetchHomePartyMenusByIds(ids: string[]) {
  const response = await client.get('/v1/home-party/menus/by-ids', {
    params: { ids: ids.join(',') },
  });
  return response.data.data.menus as HomePartyMenu[];
}

export async function createHomePartyReservation(payload: {
  storeId: string;
  eventType: string;
  headcount: number;
  budgetMin?: number;
  budgetMax?: number;
  eventDateTime: string;
  pickupDateTime: string;
  sourceType: 'CUSTOM' | 'SET';
  baseSetId?: string | null;
  requestNote?: string;
  items: SelectedItem[];
}) {
  const response = await client.post('/v1/home-party/reservations', payload);
  return response.data.data as {
    reservationId: number;
    totalAmount: number;
    depositAmount: number;
    items: Array<{
      hpMenuId: number;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      menuNameSnapshot: string;
      imageUrlSnapshot?: string | null;
    }>;
  };
}
