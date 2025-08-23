import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DEVICE } from '@env';

// 장바구니 항목 타입 정의
type CartItem = {
    storeMenuId: string;
    name: string;
    description: string;
    price: number;
    image: any;
    amount: string;
    quantity: number;
    storeId: string;
};

// Context 내부 타입 정의
type CartContextType = {
    cartItems: CartItem[]; // 장바구니 항목
    loadCartFromServer: () => Promise<void>; //서버에서 장바구니 불러오기
    addToCart: (item: CartItem) => Promise<boolean>; // 항목 추가 함수
    removeFromCart: (storeMenuId: string) => Promise<void>; // 항목 삭제
    clearCart: () => Promise<void>; //전체 삭제
};

// Context 생성
const CartContext = createContext<CartContextType | undefined>(undefined);

// 장바구니 상태 제공
export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]); // 상태 초기화

    //서버의 장바구니 불러오기
    const loadCartFromServer = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('토큰 없음');
            }
            const response = await fetch(`${API_DEVICE}/cart/getCart`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message);
            }
            setCartItems(data.items);
            console.log('서버의 장바구니 불러오기 성공', data.items);
        } catch (err) {
            console.log('장바구니 불러오기 에러: ', err);
        }
    }

    // 장바구니에 항목 추가하는 함수
    const addToCart = async (item: CartItem): Promise<boolean> => {

        //서버로 장바구니 항목을 보냄
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('토큰 없음');
            }
            const body = {
                storeId: Number(item.storeId),
                storeMenuId: Number(item.storeMenuId),
                quantity: Number(item.quantity),
            };
            const response = await fetch(`${API_DEVICE}/cart/addCart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message);
            }
            console.log('추가 후 장바구니 상태', cartItems);
            //성공 시 서버 장바구니 재로드
            await loadCartFromServer();
            return true;
        } catch (err) {
            console.log('장바구니 서버 에러', err);
            return false;
        }
    };

    const removeFromCart = async (storeMenuId: string) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('토큰 없음');

            const response = await fetch(`${API_DEVICE}/cart/remove`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({storeMenuId}) // <- 객체 형태로 보내기
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message)
            }
            console.log('삭제 후 장바구니 상태', cartItems);
            await loadCartFromServer();
        } catch (err) {
            console.log('장바구니 에러: ', err);
        }
    };
    const clearCart = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('토큰 없음');

            const response = await fetch(`${API_DEVICE}/cart/clear`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message)
            }
            console.log('전체 삭제 후 장바구니 상태', cartItems);
            await loadCartFromServer();
        } catch (err) {
            console.log('장바구니 서버 에러', err);
        }
    }

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, loadCartFromServer }}>
            {children}
        </CartContext.Provider>
    );
};

// 커스텀 훅으로 다른 컴포넌트에서 사용 가능
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
