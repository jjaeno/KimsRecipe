import React, {useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
const HomeScreen: React.FC = () => {

  const [modalVisible, setModalVisible] = useState(false)
  const [category, setCategory] = useState('모든 반찬')
  const categoryData = ['모든 반찬', '밑반찬', '즉석반찬', '국탕류', '볶음류', '튀김류'];
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.categoryContainer} onPress={()=>setModalVisible(true)}>
          <Text style = {styles.categoryText}>{category}</Text>
          <Icon name="arrow-drop-down" size={24} color="black"/>
        </TouchableOpacity>
        <View style={styles.sortContainer}>
          <Text>인기순</Text>
        </View>
      </View>
      {/* 모달 */}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        backdropOpacity={0.4} //어두운 배경 투명도
        animationIn="slideInUp" //모달 열릴 때의 애니메이션
        animationOut="slideOutDown" //모달 닫힐 때의 애니메이션
        useNativeDriver //네이티브 스레드로 더 부드럽게
        style={styles.modalContainer}
        >
          <View style = {styles.modalContent}>
            <Text style = {styles.modalTitle}>카테고리 선택</Text>
            <ScrollView style={{maxHeight: moderateScale(300)}}>
              {categoryData.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.optionItem}
                  onPress={()=>{
                    setCategory(item);
                    setModalVisible(false);
                  }}>
                    <Text style={styles.optionText}>{item}</Text>
                  </TouchableOpacity>
              ))}
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
    paddingHorizontal : moderateScale(22),
    backgroundColor: '#ffffff'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: moderateScale(20),
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
  categoryContainer: {
    width: moderateScale(220),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(20),
    elevation: moderateScale(6),
    paddingVertical: moderateScale(5)
  }
})
export default HomeScreen;
