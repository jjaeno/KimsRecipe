import React, {useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
const HomeScreen: React.FC = () => {
  //카테고리 선택 로직 (모달 활용)
  const [categoryModalVisible, setcategoryModalVisible] = useState(false)
  const [category, setCategory] = useState('모든 반찬')
  const categoryData = ['모든 반찬', '밑반찬', '즉석반찬', '국탕류', '볶음류', '튀김류'];
  //정렬 선택 로직 (모달 활용)
  const [sortModalVisible, setsortModalVisible] = useState(false)
  const [sort, setSort] = useState('인기순')
  const sortData = ['인기순', '높은 가격순', '낮은 가격순']
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
            <Text style={styles.sortText}>인기순</Text>
            <Icon name="arrow-drop-down" size={22} color="#797979"/>
          </TouchableOpacity>
          <View style={styles.devider}/>
          <Icon name="menu" size={22} color="#797979"/>
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
      <View style={styles.content}>

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
    width: moderateScale(220),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(20),
    elevation: moderateScale(6),
    paddingVertical: moderateScale(5)
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
})
export default HomeScreen;
