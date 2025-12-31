// Responsibility: 매장/카테고리/메뉴 관련 프론트엔드 타입 정의.

// 서버에서 내려오는 매장 타입
export type Store = {
  storeId: string;
  storeName: string;
  categories: StoreCategory[];
};
// 서버에서 내려오는 매장 카테고리 타입
export type StoreCategory = {
  categoryId: string;
  categoryName: string;
  items: StoreItem[];
};

// 서버에서 내려오는 매장 메뉴 타입
export type StoreItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  popularity: number;
  amount: string;
};

// id 기반으로 접근하기 위해 Flat하게 만든 아이템
export type FlatItem = StoreItem & {
  storeId: string;
  categoryId: string;
  categoryName?: string;
};
