import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Menu } from 'react-native-paper';
import { TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';
import type { RootStackParamList } from './navigation/StackNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
//홈화면 헤더 구성
export default function HomeHeader() {

  //네비게이션 타입 지정
  type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
  const navigation = useNavigation<NavigationProp>();

  //호점 선택 로직
  const [visible, setVisible] = useState(false);
  const [store, setStore] = useState('킴스레시피 본점');
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  //검색 기능 로직
  const [searchText, setSearchText] = useState('');
  return (
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <Icon name="arrow-back-ios" size={24} color="#ffffff" style={{marginRight:moderateScale(10)}} onPress={()=>navigation.goBack()}/>
          <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={
              <TouchableOpacity style={styles.storeSelect} onPress={openMenu}>
                <Text style={styles.storeText} >{store}</Text>
                <Icon name="arrow-drop-down" size={24} color="#ffffff"/>
              </TouchableOpacity>
            }
            contentStyle={{
              backgroundColor: '#00BABB',
              borderRadius: moderateScale(10),
              paddingVertical: moderateScale(8),
              width: moderateScale(200),
            }}
          >
            <Menu.Item
              onPress={() => { setStore('킴스레시피 본점'); closeMenu(); }}
              title="킴스레시피 본점"
              titleStyle={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}
            />
            <Menu.Item
              onPress={() => { setStore('킴스레시피 2호점'); closeMenu(); }}
              title="킴스레시피 2호점"
              titleStyle={{ fontSize: 15, fontWeight: 'bold', color: '#ffffff' }}
            />
          </Menu>
        </View>
      <View style={styles.bottomRow}>
          <View style={styles.searchRow}>
            <Icon name="search" size={20} color="#009798" style={{marginHorizontal:8}}/>
            <TextInput
              placeholder="반찬 검색..."
              placeholderTextColor='#999'
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={()=> {
                console.log('검색어:', searchText);
              }}/>
            </View>
          <Icon name="shopping-cart" size={24} color="#fff" style={{marginLeft:'auto'}} onPress={()=>navigation.navigate('Cart')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'flex-start',
    backgroundColor: '#009798',
    paddingHorizontal: moderateScale(12),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(10),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  storeSelect: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  storeText: {
    color: '#ffffff',
    fontSize: 16,
    marginRight: moderateScale(4),
  },
  bottomRow: {
    flexDirection:'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
 searchRow: {
    flex:1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 4,
    height: 40,
    marginRight: moderateScale(10)
  },
  searchInput: {
    flex: 1,
    color: 'black',
  },
});
