import React, {useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Menu } from 'react-native-paper';
import { moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
const HomeScreen: React.FC = () => {

  const [visible, setVisible] = useState(false)
  const [category, setCategory] = useState('전체 메뉴')
  const openCategory = () => setVisible(true);
  const closeCategory = () => setVisible(false);
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Menu
          visible={visible}
          onDismiss={closeCategory}
          anchor={
            <TouchableOpacity style={styles.categoryContainer} onPress={openCategory}>
              <Text style = {styles.categoryText}>{category}</Text>
              <Icon name="arrow-drop-down" size={24} color="black"/>
            </TouchableOpacity>
          }
          contentStyle={{
            backgroundColor: 'white',
            width: moderateScale(220),
            borderRadius: moderateScale(20)
            }
          }
        >
          <Menu.Item
            onPress={() => {setCategory('밑반찬'); closeCategory();}}
            title="밑반찬"
            titleStyle={{ fontSize: 15, fontWeight: 'bold', color: 'black' }}
          />
          <Menu.Item
            onPress={() => {setCategory('즉석반찬'); closeCategory();}}
            title="즉석반찬"
            titleStyle={{ fontSize: 15, fontWeight: 'bold', color: 'black' }}
          />
          <Menu.Item
            onPress={() => {setCategory('국탕류'); closeCategory();}}
            title="국탕류"
            titleStyle={{ fontSize: 15, fontWeight: 'bold', color: 'black' }}
          />
        </Menu>
        <View style={styles.sortContainer}>
          <Text>인기순</Text>
        </View>
      </View>

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
