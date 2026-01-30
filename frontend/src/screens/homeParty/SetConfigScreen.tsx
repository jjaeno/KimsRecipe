import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

export default function SetConfigScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>세트 구성 화면</Text>
      <Text style={styles.subtitle}>추후 기능이 추가될 예정입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: moderateScale(10),
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: '#666',
  },
});
