import React, {useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList, Dimensions } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
import { dummyData } from '../data/dummyData';
import type {FoodItem, StoreData} from '../data/dummyData';
import {useStore} from '../context/StoreContext';
  //그리드뷰 넓이 계산
  const screenWidth = Dimensions.get('window').width;
  const ITEM_MARGIN = 1;
  const NUM_COLUMNS = 2;
  const H_PADDING = 32;
  const ITEM_WIDTH = (screenWidth - H_PADDING * 2 - ITEM_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;


const HomeScreen: React.FC = () => {

  //전역 context에 저장되어있는 현재 호점 id 가져오기
  const {selectedStoreId} = useStore();
  // 현재 선택된 호점
  const Store: StoreData | undefined = dummyData.find(s=>s.storeId === selectedStoreId); //현재 호점 id에 따른 Store[]의 첫번째 인덱스 객체들이 Store에 저장됨
  const allItems: FoodItem[] = Store
    ? Store.categories.flatMap(cat=>cat.items) //categories 안에 있던 items[]안의 객체들을 꺼내 1차원 배열로 만듬
    : [];

  //카테고리 선택 로직 (모달 활용)
  const [categoryModalVisible, setcategoryModalVisible] = useState(false)
  const [category, setCategory] = useState('모든 반찬')
  const categoryData = ['모든 반찬', '밑반찬', '즉석반찬', '국탕류', '볶음류', '튀김류'];
  //정렬 선택 로직 (모달 활용)
  const [sortModalVisible, setsortModalVisible] = useState(false)
  const [sort, setSort] = useState('인기순')
  const sortData = ['인기순', '높은가격순', '낮은가격순']

  //그리드뷰 <-> 리스트뷰
  const [isGrid, setIsGrid] = useState(true);

  return (
    <View style={styles.container}>
      
      {/* 카테고리, 정렬 기능 */}
      <View style={styles.topRow}>

        <TouchableOpacity style={styles.categoryContainer} onPress={()=>setcategoryModalVisible(true)}>
          <Text style = {styles.categoryText}>{category}</Text>
          <Icon name="arrow-drop-down" size={24} color="black"/>
        </TouchableOpacity>

        <View style={styles.sortContainer}>
          <TouchableOpacity style={styles.sortButton} onPress={()=>setsortModalVisible(true)}>
            <Text style={styles.sortText}>{sort}</Text>
            <Icon name="arrow-drop-down" size={22} color="#797979"/>
          </TouchableOpacity>
          <View style={styles.devider}/>
          <TouchableOpacity onPress={()=> setIsGrid(!isGrid)}>
            <Icon name={isGrid ? "view-list" : "grid-view"} size={22} color="#797979"/>
          </TouchableOpacity>
        </View>
      </View>
      {/* 카테고리 모달 */}
      <Modal
        isVisible={categoryModalVisible}
        onBackdropPress={() => setcategoryModalVisible(false)}
        backdropOpacity={0.4} //어두운 배경 투명도
        animationIn="slideInUp" //모달 열릴 때의 애니메이션
        animationOut="slideOutDown" //모달 닫힐 때의 애니메이션
        useNativeDriver //네이티브 스레드로 더 부드럽게
        style={styles.modalContainer}
        >
          <View style = {styles.modalContent}>
            <Text style = {styles.modalTitle}>카테고리 선택</Text>
            <ScrollView style={{maxHeight: moderateScale(300)}}>
              {categoryData.map((item, idx) => {
                const isSelected = item === category;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionItemSelected
                  ]}
                  onPress={()=>{
                    setCategory(item);
                    setcategoryModalVisible(false);
                  }}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{item}</Text>
                    {isSelected && <Icon name = 'check' size={20} color='#009798'/>}
                  </TouchableOpacity>
              );})}
          </ScrollView>
        </View>
      </Modal>

      {/* 정렬 선택 모달 */}
      <Modal
        isVisible={sortModalVisible}
        onBackdropPress={() => setsortModalVisible(false)}
        backdropOpacity={0.4} //어두운 배경 투명도
        animationIn="slideInUp" //모달 열릴 때의 애니메이션
        animationOut="slideOutDown" //모달 닫힐 때의 애니메이션
        useNativeDriver //네이티브 스레드로 더 부드럽게
        style={styles.modalContainer}
        >
          <View style = {styles.modalContent}>
            <ScrollView style={{maxHeight: moderateScale(300)}}>
              {sortData.map((item, idx) => {
                const isSelected = item === sort;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionItemSelected
                  ]}
                  onPress={()=>{
                    setSort(item);
                    setsortModalVisible(false);
                  }}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{item}</Text>
                    {isSelected && <Icon name = 'check' size={20} color='#009798'/>}
                  </TouchableOpacity>
              );})}
          </ScrollView>
        </View>
      </Modal>

      <View style={styles.content}>
        {isGrid ?
          <FlatList
            key = 'grid'
            data={allItems}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingVertical: moderateScale(10),
              paddingBottom: moderateScale(70),
            }}
            columnWrapperStyle={{justifyContent: 'space-between'}}
            renderItem={({item}) => (
              <View style={[styles.gridCard]}>
                <Image source={item?.image} style={styles.gridImage} resizeMode='cover'/>
                <Text style={styles.gridName} numberOfLines={2}>
                  {item?.name}
                </Text>
                <Text style={styles.gridPrice}>
                  {item?.price.toLocaleString()}원
                </Text>
              </View>
            )}
          />
        :
          <FlatList
            key='list'
            data={allItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingVertical: moderateScale(10),
              paddingBottom: moderateScale(70),
            }}
            renderItem={({item}) => (
              <View style={styles.listCard}>
                <View>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={styles.listPrice}>{item.price.toLocaleString()}원</Text>
                </View>
                <Image source={item.image} style={styles.listImage}/>
              </View>
            )}
           />
        }
      </View>
    </View>
  );
};
const styles=StyleSheet.create ({
  container: {
    flex : 1,
    paddingHorizontal : moderateScale(16),
    backgroundColor: '#ffffff'
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
    paddingVertical: moderateScale(5)
  },
  categoryText: {
    
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: moderateScale(13),
    color: '#797979'
  },
  devider: {
    height: moderateScale(20),
    width: moderateScale(1.5),
    backgroundColor: 'gray',
    marginHorizontal: moderateScale(5)
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
  },
  gridCard: {
    width: ITEM_WIDTH,
    marginBottom: moderateScale(30)
  },
  gridName: {
    fontSize: moderateScale(14),
    fontWeight: '400',
    color: '#333'
  },
  gridPrice: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    marginTop: moderateScale(4),
    color: '#000'
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
    borderRadius: moderateScale(15)
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
  }
})
export default HomeScreen;
