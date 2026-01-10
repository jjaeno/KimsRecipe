import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetailScreen from '../screens/product/DetailScreen';
import CartScreen from '../screens/cart/CartScreen';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

export type RootStackParamList = {
  Start: undefined;
  Tab: undefined;
  Detail: {foodId: string};
  Cart: undefined;
  Login: undefined;
  Signup: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login"
      screenOptions={
        {headerStyle: {
          backgroundColor: '#009798'
        },
        headerTintColor: '#FFFFFF'
      }
      }
      >
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: '로그인' , headerShown:false}} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: '회원가입' }} />
      <Stack.Screen name="Tab" component={TabNavigator} options={{headerShown:false}}/>
      <Stack.Screen name="Detail" component={DetailScreen} options={{headerShown: false}}/>
      <Stack.Screen name="Cart" component={CartScreen} />
    </Stack.Navigator>
  );
};

