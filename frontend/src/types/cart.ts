// Responsibility: 장바구니 아이템 타입 정의.

// 서버에서 내려오는 장바구니 아이템 타입
export type CartItem = {
  storeMenuId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  amount: string;
  quantity: number;
  storeId: string;
};
