import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetailScreen from '../screens/product/DetailScreen';
import CartScreen from '../screens/cart/CartScreen';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import CheckoutScreen from '../screens/orders/CheckoutScreen';
import Icon from 'react-native-vector-icons/MaterialIcons';

export type RootStackParamList = {
  Start: undefined;
  Tab: undefined;
  Detail: {foodId: string};
  Cart: undefined;
  Login: undefined;
  Signup: undefined;
  Checkout: undefined;
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
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={({ navigation }) => ({
          title: '장바구니',
          headerTitleAlign: 'center',
          headerTitleStyle: {fontSize: 18, fontWeight: '600'},
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back-ios" size={20} color="#ffffff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={({ navigation }) => ({
          title: '주문/결제',
          headerTitleAlign: 'center',
          headerTitleStyle: {fontSize: 18, fontWeight: '600'},
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back-ios" size={20} color="#ffffff" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

