import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StartScreen from '../screens/StartScreen';
import DetailScreen from '../screens/DetailScreen';
import CartScreen from '../screens/CartScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Start: undefined;
  Tab: undefined;
  Detail: undefined;
  Cart: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Start"
      screenOptions={
        {headerStyle: {
          backgroundColor: '#009798'
        },
        headerTintColor: '#FFFFFF'
      }
      }
      >
      <Stack.Screen name="Start" component={StartScreen} />
      <Stack.Screen name="Tab" component={TabNavigator} options={{headerShown:false}}/>
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
    </Stack.Navigator>
  );
};

