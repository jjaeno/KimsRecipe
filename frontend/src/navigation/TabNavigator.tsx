import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import WishListScreen from '../screens/WishListScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import MypageScreen from '../screens/MypageScreen';
import HomeHeader from '../HomeHeader';
export type TabParamList = {
  Home: undefined;
  Wishlist: undefined;
  Orders: undefined;
  Mypage: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator (){
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home" component={HomeScreen}  options={{header: () => <HomeHeader/>}}/>
      <Tab.Screen name="Wishlist" component={WishListScreen} />
      <Tab.Screen name="Orders" component={OrderHistoryScreen} />
      <Tab.Screen name="Mypage" component={MypageScreen} />
    </Tab.Navigator>
  );
};

