// Responsibility: 홈 화면 상단 헤더. 매장 선택 모달, 검색 입력, 장바구니 바로가기 아이콘을 제공한다. 상태는 StoreContext를 사용하며, 네비게이션은 Stack 네비게이션을 따른다.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';
import type { RootStackParamList } from '../navigation/StackNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Modal from 'react-native-modal';
import { useStore } from '../context/StoreContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * 홈 헤더
 * - 현재 선택된 매장을 표시하고, 모달로 매장을 변경할 수 있다.
 * - 검색 입력을 StoreContext의 searchText에 반영한다.
 * - 장바구니 화면으로 이동하는 아이콘을 제공한다.
 */
export default function HomeHeader() {
  const navigation = useNavigation<NavigationProp>();
  const [visible, setVisible] = useState(false);
  const { stores, selectedStoreId, setSelectedStoreId, searchText, setSearchText } = useStore();

  const storeName = stores.find((s) => s.storeId === selectedStoreId)?.storeName ?? '매장 선택';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <Icon name="arrow-back-ios" size={24} color="#ffffff" style={{ marginRight: moderateScale(10) }} onPress={() => navigation.goBack()} />
        <TouchableOpacity style={styles.storeSelect} onPress={() => setVisible(true)}>
          <Text style={styles.storeText}>{storeName}</Text>
          <Icon name="arrow-drop-down" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* 매장 선택 모달 */}
      <Modal
        isVisible={visible}
        onBackdropPress={() => setVisible(false)}
        backdropOpacity={0.4}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>매장 선택</Text>
          <ScrollView style={{ maxHeight: moderateScale(300) }}>
            {stores.length === 0 ? (
              <Text style={{ paddingVertical: moderateScale(16), color: '#666' }}>불러온 매장이 없습니다.</Text>
            ) : (
              stores.map((store) => {
                const isSelected = store.storeId === selectedStoreId;
                return (
                  <TouchableOpacity
                    key={store.storeId}
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    onPress={() => {
                      setSelectedStoreId(store.storeId);
                      setVisible(false);
                    }}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{store.storeName}</Text>
                    {isSelected && <Icon name="check" size={20} color="#009798" />}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 검색/장바구니 */}
      <View style={styles.bottomRow}>
        <View style={styles.searchRow}>
          <Icon name="search" size={20} color="#009798" style={{ marginHorizontal: 8 }} />
          <TextInput
            placeholder="반찬 검색.."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
          />
        </View>
        <Icon
          name="shopping-cart"
          size={24}
          color="#fff"
          style={{ marginLeft: 'auto', marginTop: 4 }}
          onPress={() => navigation.navigate('Cart')}
        />
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
    alignItems: 'center',
  },
  storeText: {
    color: '#ffffff',
    fontSize: 16,
    marginRight: moderateScale(4),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 4,
    height: 40,
    marginRight: moderateScale(10),
  },
  searchInput: {
    flex: 1,
    color: 'black',
  },
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
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
    marginVertical: moderateScale(12),
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
    alignItems: 'center',
  },
  optionTextSelected: {
    fontSize: moderateScale(16),
    color: '#009798',
  },
});
