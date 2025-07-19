import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';
import type { RootStackParamList } from './navigation/StackNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Modal from 'react-native-modal';
import { useStore } from './context/StoreContext';
import { dummyData } from './data/dummyData';
//홈화면 헤더 구성
export default function HomeHeader() {

  //네비게이션 타입 지정
  type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
  const navigation = useNavigation<NavigationProp>();

  //호점 선택 로직 (모달 활용)
  const [visible, setVisible] = useState(false);
  const {selectedStoreId, setSelectedStoreId} = useStore(); //선택된 호점 id 전역 context 가져오기(기본값 본점id)
  const Store = dummyData.find(s=>s.storeId === selectedStoreId); //Store에는 선택된 호점의 전체 객체가 저장됨(id, name, categories)
  const StoreName = Store ? Store.storeName : '' //StoreName에는 현재 호점의 name이 저장됨
  //검색 기능 로직
  const [searchText, setSearchText] = useState('');
  return (
      <View style={styles.headerContainer}>

        {/* 뒤로가기, 호점선택*/}
        <View style={styles.topRow}>
          <Icon name="arrow-back-ios" size={24} color="#ffffff" style={{marginRight:moderateScale(10)}} onPress={()=>navigation.goBack()}/>
          <TouchableOpacity style={styles.storeSelect} onPress={()=>setVisible(true)}>
            <Text style={styles.storeText} >{StoreName}</Text>
            <Icon name="arrow-drop-down" size={24} color="#ffffff"/>
          </TouchableOpacity>
        </View>

        {/* 호첨선택 모달 */}
        <Modal
          isVisible={visible}
          onBackdropPress={() => setVisible(false)}
          backdropOpacity={0.4} //어두운 배경 투명도
          animationIn="slideInUp" //모달 열릴 때의 애니메이션
          animationOut="slideOutDown" //모달 닫힐 때의 애니메이션
          useNativeDriver //네이티브 스레드로 더 부드럽게
          style={styles.modalContainer}
          >
            <View style = {styles.modalContent}>
              <Text style = {styles.modalTitle}>호점 선택</Text>
              <ScrollView style={{maxHeight: moderateScale(300)}}>
                {dummyData.map((store) => {
                  const isSelected = store.storeId === selectedStoreId; //선택되어있는지 구분 위함
                  return (
                  <TouchableOpacity
                    key={store.storeId}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemSelected]}
                    onPress={()=>{
                      setSelectedStoreId(store.storeId);
                      setVisible(false);
                  }}>
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                      ]}>{store.storeName}</Text>
                    {isSelected && <Icon name = 'check' size={20} color='#009798'/>} 
                  </TouchableOpacity>
                );})}
            </ScrollView>
          </View>
        </Modal>
        
        {/* 검색창, 장바구니 */}
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
                  console.log('검색어:', searchText); //내부 로직 작성 예정
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
  modalContainer: {
    justifyContent: 'flex-end',
    margin:0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(16),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: 'black',
    marginVertical: moderateScale(12)
  },
  optionItem: {
    paddingVertical: moderateScale(20),
  },
    optionText: {
    fontSize: moderateScale(16),
    color: 'black',
  },
  optionItemSelected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  optionTextSelected: {
    fontSize: moderateScale(16),
    color: '#009798'
  }
});
