import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './src/navigation/StackNavigator';
import { StoreProvider } from './src/context/StoreContext';
import { CartProvider } from './src/context/CartContext';

export default function App() {
  return (
    <CartProvider>
      <StoreProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </StoreProvider>
    </CartProvider>
  );
};
