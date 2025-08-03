import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RootStackParamList } from '../navigation/StackNavigator';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/TabNavigator';



//네비게이션 타입 지정(Compisite은 Stack, Tab 둘 다 커버 가능)
type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Mypage'>,
  NativeStackScreenProps<RootStackParamList>
>;


const MypageScreen: React.FC<Props> = ({navigation}) => {
  const logout = async () => {
    await AsyncStorage.removeItem('token')
    navigation.navigate('Login'); //추후에 navigation.reset 방식으로 교체
  };
  return (
    <View>
      <Text>마이페이지 화면입니다</Text>
      <TouchableOpacity onPress={()=> logout()}>
        <Text>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MypageScreen;
