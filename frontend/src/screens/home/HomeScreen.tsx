// Responsibility: 홈 화면. 매장/카테고리/메뉴 데이터를 표시하고 카테고리/검색/정렬/그리드-리스트 전환을 제공한다. 상태는 StoreContext에서 가져오며, 네트워크 호출은 Context 내부의 API 모듈을 통해 수행된다.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
import { useStore } from '../../context/StoreContext';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/StackNavigator';
import type { TabParamList } from '../../navigation/TabNavigator';

// 그리드 카드 가로폭 계산
const screenWidth = Dimensions.get('window').width;
const ITEM_MARGIN = 1;
const NUM_COLUMNS = 2;
const H_PADDING = 32;
const ITEM_WIDTH = (screenWidth - H_PADDING * 2 - ITEM_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

/**
 * 홈 화면 컴포넌트
 * - Context에서 받아온 매장/카테고리/메뉴 데이터를 보여준다.
 * - 카테고리 필터, 검색, 정렬, 그리드/리스트 전환 기능을 제공한다.
 */
const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { stores, selectedStoreId, searchText, loading, error } = useStore();

  // 선택된 매장 정보
  const selectedStore = useMemo(
    () => stores.find((s) => s.storeId === selectedStoreId) ?? null,
    [stores, selectedStoreId],
  );

  // 카테고리 이름을 포함한 납작한 아이템 목록
  const allItems = useMemo(() => {
    if (!selectedStore?.categories) return [];
    return selectedStore.categories.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
      })),
    );
  }, [selectedStore]);

  // 카테고리/정렬 선택 상태
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [category, setCategory] = useState('모든 반찬');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sort, setSort] = useState('인기순');
  const sortData = ['인기순', '높은가격순', '낮은가격순'];

  // 카테고리 목록
  const categoryData = useMemo(() => {
    const names = selectedStore?.categories?.map((c) => c.categoryName) ?? [];
    return ['모든 반찬', ...Array.from(new Set(names))];
  }, [selectedStore]);

  // 그리드/리스트 전환
  const [isGrid, setIsGrid] = useState(true);

  // 카테고리/검색/정렬 필터 적용
  const filteredAndSortedItems = useMemo(() => {
    let result = [...allItems];
    if (category !== '모든 반찬') {
      result = result.filter((item) => item.categoryName === category);
    }
    if (searchText.trim() !== '') {
      result = result.filter((item) => item.name.toLowerCase().includes(searchText.toLowerCase()));
    }
    if (sort === '인기순') {
      result.sort((a, b) => b.popularity - a.popularity);
    } else if (sort === '높은가격순') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === '낮은가격순') {
      result.sort((a, b) => a.price - b.price);
    }
    return result;
  }, [allItems, category, sort, searchText]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.categoryContainer} onPress={() => setCategoryModalVisible(true)}>
          <Text style={styles.categoryText}>{category}</Text>
          <Icon name="arrow-drop-down" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.sortContainer}>
          <TouchableOpacity style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
            <Text style={styles.sortText}>{sort}</Text>
            <Icon name="arrow-drop-down" size={22} color="#797979" />
          </TouchableOpacity>
          <View style={styles.devider} />
          <TouchableOpacity onPress={() => setIsGrid(!isGrid)}>
            <Icon name={isGrid ? 'view-list' : 'grid-view'} size={22} color="#797979" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 카테고리 선택 모달 */}
      <Modal
        isVisible={categoryModalVisible}
        onBackdropPress={() => setCategoryModalVisible(false)}
        backdropOpacity={0.4}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>카테고리 선택</Text>
          <ScrollView style={{ maxHeight: moderateScale(300) }}>
            {categoryData.map((item, idx) => {
              const isSelected = item === category;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                  onPress={() => {
                    setCategory(item);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{item}</Text>
                  {isSelected && <Icon name="check" size={20} color="#009798" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* 정렬 선택 모달 */}
      <Modal
        isVisible={sortModalVisible}
        onBackdropPress={() => setSortModalVisible(false)}
        backdropOpacity={0.4}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <ScrollView style={{ maxHeight: moderateScale(300) }}>
            {sortData.map((item, idx) => {
              const isSelected = item === sort;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                  onPress={() => {
                    setSort(item);
                    setSortModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{item}</Text>
                  {isSelected && <Icon name="check" size={20} color="#009798" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {loading ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 6 }}>불러오는 중...</Text>
        </View>
      ) : error ? (
        <Text style={{ color: 'red', padding: 12 }}>데이터를 불러오지 못했습니다: {error}</Text>
      ) : (
        <View>
          {isGrid ? (
            <FlatList
              key="grid"
              data={filteredAndSortedItems}
              numColumns={2}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingVertical: moderateScale(10),
                paddingBottom: moderateScale(70),
              }}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.gridCard]}
                  onPress={() => navigation.navigate('Detail', { foodId: item.id })}
                >
                  <Image source={{ uri: item?.image }} style={styles.gridImage} resizeMode="cover" />
                  <Text style={styles.gridName} numberOfLines={2}>
                    {item?.name}
                  </Text>
                  <Text style={styles.gridPrice}>{item?.price.toLocaleString()}원</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <FlatList
              key="list"
              data={filteredAndSortedItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingVertical: moderateScale(10),
                paddingBottom: moderateScale(70),
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listCard}
                  onPress={() => navigation.navigate('Detail', { foodId: item.id })}
                >
                  <View>
                    <Text style={styles.listName}>{item.name}</Text>
                    <Text style={styles.listPrice}>{item.price.toLocaleString()}원</Text>
                  </View>
                  <Image source={{ uri: item.image }} style={styles.listImage} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
    backgroundColor: '#ffffff',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: moderateScale(20),
  },
  categoryContainer: {
    width: moderateScale(200),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(20),
    elevation: moderateScale(6),
    paddingVertical: moderateScale(5),
  },
  categoryText: {
    fontSize: moderateScale(13),
    color: '#222',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: moderateScale(13),
    color: '#797979',
  },
  devider: {
    height: moderateScale(20),
    width: moderateScale(1.5),
    backgroundColor: 'gray',
    marginHorizontal: moderateScale(5),
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
  gridCard: {
    width: ITEM_WIDTH,
    marginBottom: moderateScale(30),
  },
  gridName: {
    fontSize: moderateScale(14),
    fontWeight: '400',
    color: '#333',
  },
  gridPrice: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    marginTop: moderateScale(4),
    color: '#000',
  },
  gridImage: {
    width: '100%',
    height: ITEM_WIDTH,
    aspectRatio: 1,
    borderRadius: moderateScale(15),
    marginBottom: moderateScale(3),
  },
  listCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(15),
    borderColor: '#E2E2E2',
    marginBottom: moderateScale(10),
    paddingLeft: moderateScale(10),
    elevation: moderateScale(2),
  },
  listImage: {
    width: 110,
    height: 110,
    borderRadius: moderateScale(15),
  },
  listName: {
    fontSize: moderateScale(13),
    fontWeight: '400',
    paddingTop: moderateScale(25),
    paddingBottom: moderateScale(8),
    paddingLeft: moderateScale(10),
  },
  listPrice: {
    fontSize: moderateScale(13),
    fontWeight: 'bold',
    paddingLeft: moderateScale(10),
  },
});

export default HomeScreen;
