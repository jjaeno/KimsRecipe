// Responsibility: 장바구니 상태를 전역으로 관리한다. 네트워크 호출은 api/cart.api.ts에 위임하고, 여기서는 상태/로딩/에러와 add/remove/clear 동작만 노출한다.

import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../types/cart';
import { getCart, addCartItem, removeCartItem, clearCart as clearCartApi } from '../api/cart.api';

type CartContextType = {
  cartItems: CartItem[];
  loading: boolean;
  error: string | null;
  loadCartFromServer: () => Promise<void>;
  addToCart: (item: CartItem) => Promise<boolean>;
  removeFromCart: (storeMenuId: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * CartProvider
 * - cartItems, loading, error 상태를 관리한다.
 * - 네트워크 호출은 api/cart.api.ts에 위임하고, 상태 업데이트/에러 저장만 수행한다.
 * - addToCart는 화면 Alert 분기를 위해 boolean을 반환한다.
 */
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 서버에서 장바구니를 불러온다.
   * - 성공 시 cartItems 상태 업데이트
   * - 실패 시 error 상태에 메시지 저장
   */
  const loadCartFromServer = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('액세스 토큰이 없습니다.');
      const data = await getCart();
      setCartItems(data.items ?? []);
    } catch (err: any) {
      setError(err?.message || '장바구니를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 장바구니에 항목을 추가한다.
   * @returns 성공 여부 (화면에서 Alert 분기에 사용)
   */
  const addToCart = async (item: CartItem): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('액세스 토큰이 없습니다.');
      await addCartItem(Number(item.storeId), Number(item.storeMenuId), Number(item.quantity));
      await loadCartFromServer();
      return true;
    } catch (err: any) {
      setError(err?.message || '장바구니 추가 중 오류가 발생했습니다.');
      return false;
    }
  };

  /**
   * 장바구니에서 특정 메뉴를 삭제한다.
   */
  const removeFromCart = async (storeMenuId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('액세스 토큰이 없습니다.');
      await removeCartItem(Number(storeMenuId));
      await loadCartFromServer();
    } catch (err: any) {
      setError(err?.message || '장바구니 항목 삭제 중 오류가 발생했습니다.');
    }
  };

  /**
   * 장바구니를 비운다.
   */
  const clearCart = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('액세스 토큰이 없습니다.');
      await clearCartApi();
      await loadCartFromServer();
    } catch (err: any) {
      setError(err?.message || '장바구니 초기화 중 오류가 발생했습니다.');
    }
  };

  return (
    <CartContext.Provider
      value={{ cartItems, loading, error, loadCartFromServer, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

/**
 * CartContext 훅
 * @returns CartContext 값
 * @throws Error Provider 밖에서 사용 시
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
