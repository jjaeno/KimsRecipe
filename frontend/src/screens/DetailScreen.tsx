import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Pressable, TouchableOpacity, ScrollView } from 'react-native';
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

  const [quantity, setQuantity] = useState(1); //수량
  const plus = () => setQuantity(q => q + 1);
  const minus = () => setQuantity(q => Math.max(1, q-1)); //최솟값: 1

  const totalPrice = (Number(item?.price)) * quantity;

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
      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: moderateScale(50)}}>
        <View style={styles.explainContainer}>
          <Text style={styles.name}>{item?.name}</Text>
          <Text style={styles.description}>{item?.description}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={{fontSize: moderateScale(14), fontWeight: '800', marginLeft: moderateScale(2)}}>가격</Text>
          <View style={styles.detailPriceContainer}>
            <View style={styles.amountWithIcon}>
            <Icon name='radio-button-checked' size={21} color="#1E7160"/>
            <Text style={styles.amount}>{item?.amount}</Text>
            </View>
            <Text style={{fontWeight: '600'}}>{item?.price.toLocaleString()}원</Text>
          </View>
        </View>
        <View style={styles.countContainer}>
          <Text style={{fontWeight: '800'}}>수량</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity onPress={minus}>
              <Text style={styles.minusBtn}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{quantity}</Text>
            <TouchableOpacity onPress={plus}>
              <Text style={styles.plusBtn}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={styles.cartContainer}>
        <View style={styles.minPayContainer}>
          <Text style={styles.minPayText}>택배 최소 주문 금액</Text>
          <Text style={styles.minPayText}>25,000원</Text>
        </View>
        <TouchableOpacity style={styles.addToCart}>
          <Text style={{fontSize: moderateScale(13), color: '#ffffff', fontWeight: '400'}}>{totalPrice.toLocaleString()}원 담기</Text>
        </TouchableOpacity>
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
    paddingTop: moderateScale(15),
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
    paddingHorizontal: moderateScale(16),
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
    marginLeft: moderateScale(6),
    paddingTop: moderateScale(1),
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(15),
    borderRadius: moderateScale(20),
    backgroundColor: '#ffffff',
    elevation: moderateScale(3)
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minusBtn: {
    fontSize: moderateScale(30),
    width: moderateScale(40),
    textAlign: 'center',
  },
  quantity: {
    fontSize: moderateScale(18),
    width: moderateScale(40),
    textAlign: 'center',
    fontWeight: '500'
  },
  plusBtn: {
    width: moderateScale(40),
    fontSize: moderateScale(20),
    textAlign: 'center'
  },
  cartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: moderateScale(10),
    borderTopRightRadius: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(20),
    backgroundColor: '#ffffff',
    borderColor: '#979797',
    borderWidth: moderateScale(0.2),
    position: 'absolute',
    bottom:0,
    left:0,
    right:0,

  },
  minPayContainer: {},
  minPayText: {
    marginBottom: moderateScale(2),
    fontSize: moderateScale(11),
    color: '#979797'
  },
  addToCart: {
    backgroundColor: '#009798',
    justifyContent: 'center',
    alignItems: 'center',
    width: moderateScale(190),
    height: moderateScale(40),
    borderRadius: moderateScale(5)
  }
})

export default DetailScreen;

