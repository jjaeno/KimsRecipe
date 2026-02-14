import React from 'react';
import {TouchableOpacity} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetailScreen from '../screens/product/DetailScreen';
import CartScreen from '../screens/cart/CartScreen';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import CheckoutScreen from '../screens/orders/CheckoutScreen';
import AddressEditScreen from '../screens/addresses/AddressEditScreen';
import AddressSearchWebViewScreen from '../screens/addresses/AddressSearchWebViewScreen';
import EventInfoInputScreen from '../screens/homeParty/EventInfoInputScreen';
import SetConfigScreen from '../screens/homeParty/SetConfigScreen';
import PaymentScreen from '../screens/homeParty/PaymentScreen';
import HomePartyMenuScreen from '../screens/homeParty/HomePartyMenuScreen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { CustomSetRouteParams } from '../types/homeParty';

export type RootStackParamList = {
  Start: undefined;
  Tab: undefined;
  Detail: {foodId: string};
  Cart: undefined;
  Login: undefined;
  Signup: undefined;
  Checkout: undefined;
  AddressEdit: undefined;
  AddressSearchWebView: undefined;
  EventInfoInput: undefined;
  SetConfig: CustomSetRouteParams;
  Payment: undefined;
  HomePartyMenu: CustomSetRouteParams;
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
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: '로그인', headerShown: false }} />
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
      <Stack.Screen
        name="AddressEdit"
        component={AddressEditScreen}
        options={({ navigation }) => ({
          title: '주소 수정',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontSize: 18, fontWeight: '600' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back-ios" size={20} color="#ffffff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="AddressSearchWebView" component={AddressSearchWebViewScreen} options={{headerShown: false}}/>
      <Stack.Screen
        name="EventInfoInput"
        component={EventInfoInputScreen}
        options={({ navigation }) => ({
          title: '',
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back-ios" size={20} color="#ffffff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="SetConfig"
        component={SetConfigScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: '결제' }} />
      <Stack.Screen name="HomePartyMenu" component={HomePartyMenuScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};



