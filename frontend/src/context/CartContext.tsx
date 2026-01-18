// Responsibility: 장바구니 상태 및 API 호출 제어.

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, CartResponse, CartSummary } from '../types/cart';
import { getCart, addCartItem, updateCartItemQuantity, removeCartItem, removeCartItemsBulk, clearCart as clearCartApi, validateCart } from '../api/cart.api';

type CartContextType = {
  cartItems: CartItem[];
  summary: CartSummary;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  loadCartFromServer: () => Promise<void>;
  addToCart: (item: CartItem) => Promise<boolean>;
  updateQuantity: (storeMenuId: string, quantity: number) => Promise<void>;
  removeFromCart: (storeMenuId: string) => Promise<void>;
  removeSelected: (storeMenuIds: string[]) => Promise<void>;
  clearCart: () => Promise<void>;
  validateBeforeCheckout: (priceMap: Record<string, number>) => Promise<any>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_CACHE_KEY = 'cart_cache_v1';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // 로컬 상태 보관
  const [summary, setSummary] = useState<CartSummary>({ storeId: null, storeName: null, minOrderAmount: 0, baseDeliveryFee: 0, totalPrice: 0 }); // 요약 정보
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [error, setError] = useState<string | null>(null); // 에러 메시지
  const [fromCache, setFromCache] = useState(false); // 오프라인 캐시 여부

  const loadCartFromServer = useCallback(async () => {
    setLoading(true); // 로딩 시작
    setError(null); // 에러 초기화
    setFromCache(false); // 캐시 플래그 초기화

    try {
      const data: CartResponse = await getCart(); // 서버에서 카트 조회
      setCartItems(data.items ?? []); // 서버 데이터 반영
      setSummary(data.summary); // 서버 요약 반영
      await AsyncStorage.setItem(CART_CACHE_KEY, JSON.stringify(data)); // 오프라인 캐시 저장

    } catch (err: any) {
      setError(err?.message || '장바구니를 불러오지 못했습니다.'); // 에러 메시지 저장
      const cached = await AsyncStorage.getItem(CART_CACHE_KEY); // 캐시 조회
      if (cached) {
        const parsed = JSON.parse(cached) as CartResponse; // 캐시 파싱
        setCartItems(parsed.items ?? []); // 캐시 데이터 반영
        setSummary(parsed.summary); // 캐시 요약 반영
        setFromCache(true); // 캐시 사용 표시
      }
    } finally {
      setLoading(false); // 로딩 종료
    }
  }, []);

  const addToCart = async (item: CartItem): Promise<boolean> => {
    try {
      await addCartItem(Number(item.storeId), Number(item.storeMenuId), Number(item.quantity));
      await loadCartFromServer();
      return true;
    } catch (err: any) {
      setError(err?.message || '장바구니 추가 중 오류가 발생했습니다.');
      return false;
    }
  };

  const updateQuantity = async (storeMenuId: string, quantity: number) => {
    try {
      await updateCartItemQuantity(Number(storeMenuId), Number(quantity)); // 서버 수량 변경
    } catch (err: any) {
      setError(err?.message || '수량 변경 중 오류가 발생했습니다.'); // 에러 저장
      throw err; // 상위에서 롤백 처리 가능하게 던짐
    }
  };

  const removeFromCart = async (storeMenuId: string) => {
    try {
      await removeCartItem(Number(storeMenuId)); // 단일 삭제 요청
      await loadCartFromServer(); // 서버 상태로 동기화
    } catch (err: any) {
      setError(err?.message || '삭제 중 오류가 발생했습니다.'); // 에러 저장
      throw err;
    }
  };

  const removeSelected = async (storeMenuIds: string[]) => {
    try {
      const ids = storeMenuIds.map((id) => Number(id)); // 숫자 변환
      await removeCartItemsBulk(ids); // 다건 삭제 요청
      await loadCartFromServer(); // 서버 상태로 동기화
    } catch (err: any) {
      setError(err?.message || '선택 삭제 중 오류가 발생했습니다.'); // 에러 저장
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await clearCartApi(); // 전체 삭제 요청
      await loadCartFromServer(); // 서버 상태로 동기화
    } catch (err: any) {
      setError(err?.message || '장바구니 초기화 중 오류가 발생했습니다.'); // 에러 저장
      throw err;
    }
  };

  const validateBeforeCheckout = async (priceMap: Record<string, number>) => {
    const result = await validateCart(priceMap); // 서버 검증 호출
    return result; // 결과 반환
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        summary,
        loading,
        error,
        fromCache,
        loadCartFromServer,
        addToCart,
        updateQuantity,
        removeFromCart,
        removeSelected,
        clearCart,
        validateBeforeCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
