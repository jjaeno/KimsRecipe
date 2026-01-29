// Responsibility: 찜 목록 상태 및 API 제어.

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { addWishlistItem, getWishlist, removeWishlistItem } from '../api/wishlist.api';
import { WishlistItem } from '../types/wishlist';

type WishListContextType = {
  wishlistItems: WishlistItem[];
  loading: boolean;
  error: string | null;
  loadWishlist: () => Promise<void>;
  toggleWishlist: (storeMenuId: string | number) => Promise<void>;
  isInWishlist: (storeMenuId: string | number) => boolean;
};

const WishListContext = createContext<WishListContextType | undefined>(undefined);

export const WishListProvider = ({ children }: { children: React.ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWishlist();
      setWishlistItems(data.items ?? []);
    } catch (err: any) {
      setError(err?.message || '찜 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const wishlistIdSet = useMemo(() => {
    return new Set(wishlistItems.map((item) => String(item.storeMenuId)));
  }, [wishlistItems]);

  const isInWishlist = useCallback(
    (storeMenuId: string | number) => wishlistIdSet.has(String(storeMenuId)),
    [wishlistIdSet],
  );

  const toggleWishlist = useCallback(
    async (storeMenuId: string | number) => {
      const id = Number(storeMenuId);
      if (!Number.isFinite(id)) return;

      if (isInWishlist(id)) {
        await removeWishlistItem(id);
        setWishlistItems((prev) => prev.filter((it) => String(it.storeMenuId) !== String(id)));
      } else {
        await addWishlistItem(id);
        await loadWishlist();
      }
    },
    [isInWishlist, loadWishlist],
  );

  return (
    <WishListContext.Provider
      value={{
        wishlistItems,
        loading,
        error,
        loadWishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishListContext.Provider>
  );
};

export const useWishList = () => {
  const context = useContext(WishListContext);
  if (!context) throw new Error('useWishList must be used within a WishListProvider');
  return context;
};
