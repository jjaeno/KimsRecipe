import React from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { moderateScale } from 'react-native-size-matters';
type Props = NativeStackScreenProps<RootStackParamList, 'Start'>;

const StartScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.bannerContainer}>
        <Text>이벤트 배너</Text> {/* 이미지로 대체 */}
      </View>
      <View style={styles.selectContainer}>
        <TouchableOpacity style={styles.selectButton} onPress={() => navigation.navigate('Tab')}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>반찬 주문하기</Text>
          </View>
          <View style={styles.imgContainer}>
            <Text style={styles.img}>그림</Text> {/* 이미지로 대체 */}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectButton}>
          <View style={styles.textContainer}>
            <Text style={styles.text}>홈파티 예약하기</Text>
          </View>
          <View style={styles.imgContainer}>
            <Text style={styles.img}>그림</Text> {/* 이미지로 대체 */}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StartScreen;

const styles = StyleSheet.create ({
  container: {
    flex : 1,
    paddingHorizontal : moderateScale(22),
    backgroundColor: '#F0F0F3'
  },
  bannerContainer: {
    width : '100%',
    height : '50%',
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(20),
    marginVertical: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  selectButton: {
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(20),
  },
  textContainer: {
    width: '100%',
    height: moderateScale(40),
    backgroundColor: '#009798',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
  },
  imgContainer: {
    width: '100%',
    height: moderateScale(110),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },
  text: {
    fontSize: moderateScale(13),
    fontWeight: 'semibold',
    color: '#ffffff'
  },
  img: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: 'gray',
  }
})
