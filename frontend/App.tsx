import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './src/navigation/StackNavigator';
import { StoreProvider } from './src/context/StoreContext';

export default function App () {
  return (
    <StoreProvider>
      <NavigationContainer>
        <StackNavigator/>
      </NavigationContainer>
    </StoreProvider>
  );
};
