export type WishlistItem = {
  wishlistId: number;
  storeMenuId: string;
  menuName: string;
  price: number;
  imageUrl: string | null;
  amount: string | null;
  menuStatus: string;
  createdAt: string;
  storeId: string;
};

export type WishlistResponse = {
  totalCount: number;
  items: WishlistItem[];
};
