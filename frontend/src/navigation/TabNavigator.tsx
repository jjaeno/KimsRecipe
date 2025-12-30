import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import WishListScreen from '../screens/WishListScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import MypageScreen from '../screens/MypageScreen';
import HomeHeader from '../HomeHeader';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from 'react-native-size-matters';

export type TabParamList = {
  Home: undefined;
  Wishlist: undefined;
  Orders: undefined;
  Mypage: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const makeLabel = (label: string) => ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: moderateScale(10), fontWeight: '600' }}>
    {label}
  </Text>
);

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          height: moderateScale(50),
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'help-outline';

          switch (route.name) {
            case 'Home':
              iconName = 'home';        // ✅ 수정
              break;
            case 'Wishlist':
              iconName = 'favorite';
              size = 23;
              break;
            case 'Orders':
              iconName = 'receipt-long';
              size = 23;
              break;
            case 'Mypage':
              iconName = 'person';
              size = 30;
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#009798',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          header: () => <HomeHeader />,
          tabBarLabel: makeLabel('홈'),
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishListScreen}
        options={{ tabBarLabel: makeLabel('찜') }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderHistoryScreen}
        options={{ tabBarLabel: makeLabel('주문내역') }}
      />
      <Tab.Screen
        name="Mypage"
        component={MypageScreen}
        options={{ tabBarLabel: makeLabel('마이페이지') }}
      />
    </Tab.Navigator>
  );
}
