import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { useStore } from '../context/StoreContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from 'react-native-size-matters';
type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

const DetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const {flatItems, selectedStoreId} = useStore();
  const {foodId} = route.params;
  const item = flatItems.find(i => i.id === foodId);

  const [quantity, setQuantity] = useState(1);
  const plus = () => setQuantity(q => q + 1);
  const minus = () => setQuantity(q => Math.max(1, q-1)); //최솟값: 1
  return (
    <View style={styles.container}>
      <Image source={{uri: item?.image}} style={styles.image}/>
      <View style={styles.header}>
        <Icon name="arrow-back-ios" size={24} color="#ffffff" style={{marginRight:10}} onPress={()=>navigation.goBack()}/>
        <View style={styles.headerCombine}>
          <Icon name="favorite-outline" size={24} color="#ffffff" style={{marginRight:15}} onPress={()=>navigation.goBack()}/>
          <Icon name="shopping-cart" size={24} color="#ffffff" style={{marginRight:1}} onPress={()=>navigation.goBack()}/>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.explainContainer}>
          <Text style={styles.name}>{item?.name}</Text>
          <Text style={styles.description}>{item?.description}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={{fontSize: moderateScale(14), fontWeight: '800', marginLeft: moderateScale(2)}}>가격</Text>
          <View style={styles.detailPriceContainer}>
            <View style={styles.amountWithIcon}>
            <Icon name='adjust' size={24} color="#1E7160"/>
            <Text style={styles.amount}>{item?.amount}</Text>
            </View>
            <Text style={{fontWeight: '600'}}>{item?.price.toLocaleString()}원</Text>
          </View>
        </View>
        <View style={styles.countContainer}>
          <Text>수량</Text>
          <View style={styles.quantityContainer}>
            <Pressable onPress = {minus}><Text>-</Text></Pressable>
            <Text>{quantity}</Text>
            <Pressable onPress = {plus}><Text>+</Text></Pressable>
          </View>
        </View>
      </View>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
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
    marginVertical: moderateScale(20),
    paddingHorizontal: moderateScale(10)
  },
  name: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    paddingBottom: moderateScale(10),
  },
  description: {
    fontSize: moderateScale(12),
    color: '#979797'
  },
  priceContainer: {
    padding: moderateScale(13),
    paddingVertical: moderateScale(15),
    marginBottom: moderateScale(50),
    borderRadius: moderateScale(20),
    backgroundColor: '#ffffff',
    elevation: moderateScale(3)
  },
  detailPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: moderateScale(20),
  },
  amountWithIcon: {
    flexDirection: 'row'
  },
  amount: {
    marginLeft: moderateScale(5),
    paddingTop: moderateScale(2),
  },
  countContainer: {
    flexDirection: 'row',
    padding: moderateScale(20),
    borderRadius: moderateScale(20),
    backgroundColor: '#ffffff',
    elevation: moderateScale(3)
  }
})

export default DetailScreen;

