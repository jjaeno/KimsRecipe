// Responsibility: 회원가입 화면. 입력값을 받아 v1 회원가입/아이디 중복 확인 API를 호출하고, 성공 시 로그인 화면으로 돌아간다.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { moderateScale } from 'react-native-size-matters';
import { signup as signupApi, checkUsername as checkUsernameApi } from '../api/auth.api';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const checkUsername = async () => {
    if (!username.trim()) {
      return Alert.alert('알림', '아이디를 입력해주세요.');
    }
    try {
      const { message } = await checkUsernameApi(username.trim());
      setMessage(message);
    } catch (error: any) {
      setMessage(error?.message || '중복 확인에 실패했습니다.');
    }
  };

  const register = async () => {
    if (!username || !name || !password || !confirmPassword) {
      return Alert.alert('알림', '필수 항목을 입력해주세요.');
    }
    try {
      await signupApi({ username, name, password, confirmPassword, phone });
      Alert.alert('회원가입', '회원가입에 성공했습니다.');
      navigation.goBack();
    } catch (error: any) {
      setMessage(error?.message || '회원가입 실패');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.idContainer}>
        <TextInput style={styles.idInput} placeholder="아이디" value={username} onChangeText={setUsername} />
        <TouchableOpacity style={styles.idcheckButton} onPress={checkUsername}>
          <Text style={styles.idcheckText}>중복 확인</Text>
        </TouchableOpacity>
      </View>
      <TextInput style={styles.input} placeholder="이름" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 확인"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TextInput style={styles.input} placeholder="전화번호(선택)" value={phone} onChangeText={setPhone} />
      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity style={styles.signupButton} onPress={register}>
        <Text style={styles.signupText}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: moderateScale(20), paddingTop: moderateScale(40), backgroundColor: '#fff' },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: moderateScale(20),
    marginRight: moderateScale(20),
  },
  idcheckButton: {
    backgroundColor: '#009798',
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(15),
  },
  idcheckText: {
    fontSize: moderateScale(11),
    fontWeight: 'bold',
    color: '#ffffff',
    padding: moderateScale(10),
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: moderateScale(20),
  },
  message: {
    fontSize: moderateScale(12),
    color: 'red',
  },
  signupButton: {
    width: '100%',
    height: moderateScale(50),
    backgroundColor: '#009798',
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(20),
  },
  signupText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
