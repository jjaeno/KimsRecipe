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
        <Icon name="arrow-back-ios" size={24} color="#ffffff" style={{marginRight:10}} onPress={()=>navigation.goBack()}/>
        <View style={styles.headerCombine}>
          <Icon name="favorite-outline" size={24} color="#ffffff" style={{marginRight:10}} onPress={()=>navigation.goBack()}/>
          <Icon name="shopping-cart" size={24} color="#ffffff" style={{marginRight:10}} onPress={()=>navigation.goBack()}/>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.explainContainer}>
          <Text style={styles.name}>{item?.name}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={{fontSize: moderateScale(14), fontWeight: '900'}}>가격</Text>
          <View style={styles.devider}/>
          <View style={styles.detailPriceContainer}>
            <Icon name='adjust' size={24} color="#1E7160"/>
            <Text style={styles.price}>{item?.price.toLocaleString()}원</Text>
          </View>
        </View>
        <View style={styles.countContainer}>

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
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(10),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.02)'

  },
  headerCombine: {
    flexDirection: 'row'
  },

  content: {
    paddingHorizontal: moderateScale(16)
  },
  explainContainer: {
    marginVertical: moderateScale(30),
    backgroundColor: 'gray',
    paddingHorizontal: moderateScale(10)
  },
  name: {
    fontSize: moderateScale(20),
    fontWeight: 'bold'
  },

  priceContainer: {
    padding: moderateScale(10),
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(20),
    backgroundColor: '#ffffff',
    elevation: moderateScale(3)
  },
  detailPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    paddingTop: moderateScale(25)
  }
})

export default DetailScreen;

