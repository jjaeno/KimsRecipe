import React from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { dummyData } from '../data/dummyData';
import { useStore } from '../context/StoreContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from 'react-native-size-matters';
import { ModerateScale } from 'react-native-size-matters';
type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

const DetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const {selectedStoreId} = useStore();
  const {foodId} = route.params;

  const store = dummyData.find(s=> s.storeId === selectedStoreId);
  const allItems = store?.categories.flatMap(cat => cat.items);
  const item = allItems?.find(i => i.id === foodId);
  return (
    <View style={styles.container}>
      <Image source={item?.image} style={styles.image}/>
      <View style={styles.header}>
        <Icon name="arrow-back-ios" size={24} color="" style={{marginRight:10}} onPress={()=>navigation.goBack()}/>
        <View style={styles.headerCombine}>
          <Icon name="favorite-outline" size={24} color="" style={{marginRight:10}} onPress={()=>navigation.goBack()}/>
          <Icon name="shopping-cart" size={24} color="" style={{marginRight:10}} onPress={()=>navigation.goBack()}/>
        </View>
      </View>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  image: {
    width: '100%',
    height: '35%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(10),
    backgroundColor: 'gray'

  },
  headerCombine: {
    flexDirection: 'row'
  }
})

export default DetailScreen;

