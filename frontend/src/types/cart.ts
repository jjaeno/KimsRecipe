// Responsibility: 장바구니 타입 정의.

// CartItem: 장바구니에 담긴 개별 메뉴 아이템 정보
export type CartItem = {
  storeMenuId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  amount: string;
  menuStatus: 'ON_SALE' | 'SOLD_OUT' | 'HIDDEN';
  quantity: number;
  storeId: string;
};

// CartSummary: 장바구니 요약 정보
export type CartSummary = {
  storeId: number | null;
  storeName: string | null;
  minOrderAmount: number;
  baseDeliveryFee: number;
  totalPrice: number;
  userPoints?: number;
};

// CartResponse: 장바구니 전체 정보
export type CartResponse = {
  cartId: number | null;
  storeId: number | null;
  items: CartItem[];
  summary: CartSummary;
};
