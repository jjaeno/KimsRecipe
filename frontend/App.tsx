import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './src/navigation/StackNavigator';
import { StoreProvider } from './src/context/StoreContext';
import { CartProvider } from './src/context/CartContext';
import { WishListProvider } from './src/context/WishListContext';

export default function App() {
  return (
    <CartProvider>
      <WishListProvider>
        <StoreProvider>
          <NavigationContainer>
            <StackNavigator />
          </NavigationContainer>
        </StoreProvider>
      </WishListProvider>
    </CartProvider>
  );
};
