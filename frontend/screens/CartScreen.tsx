import React from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

const CartScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View>
      <Text>장바구니화면</Text>
      <Button title="메인 탭으로 이동" onPress={() => navigation.navigate('Tab')} />
    </View>
  );
};

export default CartScreen;
