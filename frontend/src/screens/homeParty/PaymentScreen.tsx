import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

export default function PaymentScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>결제 화면</Text>
      <Text style={styles.subtitle}>결제 기능은 추후 구현됩니다.</Text>
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
