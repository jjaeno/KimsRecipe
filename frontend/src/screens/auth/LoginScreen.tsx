// Responsibility: 로그인 화면. 사용자 입력을 받아 v1 로그인 API를 호출하고 토큰을 저장한 뒤 Start 화면으로 이동한다. 네트워크 호출은 api/auth.api.ts에 위임한다.

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StackNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi } from '../../api/auth.api';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * 로그인 화면
 * - 입력된 username/password로 v1 로그인 API 호출
 * - 성공 시 토큰 저장 후 Start 화면으로 이동
 * - 실패 시 메시지 표시
 */
const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // 이미 토큰이 있으면 바로 Start로 이동
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        navigation.replace('Tab');
      }
    };
    checkToken();
  }, [navigation]);

  const login = async () => {
    try {
      const result = await loginApi({ username: username.trim(), password });
      const token = result.token;
      setMessage('로그인 성공');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tab' }],
      });
      await AsyncStorage.setItem('token', token);
    } catch (error: any) {
      setMessage(error?.message || '로그인 실패');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Image source={require('../../assets/image/icon.png')} style={{ width: '50%', height: '40%', resizeMode: 'contain' }} />
      </View>
      <View style={styles.authContainer}>
        <Text style={styles.authText}>아이디</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} />
      </View>
      <View style={styles.authContainer}>
        <Text style={styles.authText}>비밀번호</Text>
        <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.loginButton} onPress={login}>
        <Text style={styles.loginText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.signupText}>아직 회원이 아닌가요? 회원가입</Text>
        <Icon name="arrow-forward-ios" size={12} color="black" style={{ marginTop: moderateScale(2) }} />
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: moderateScale(20), backgroundColor: '#ffffff' },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(190),
    marginTop: moderateScale(25),
    marginBottom: moderateScale(25),
  },
  authContainer: {
    marginBottom: moderateScale(15),
    justifyContent: 'flex-start',
  },
  authText: {
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  message: {
    fontSize: moderateScale(12),
    color: 'red',
  },
  loginButton: {
    width: '100%',
    height: moderateScale(50),
    backgroundColor: '#009798',
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(20),
  },
  loginText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  signupButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '70%',
  },
  signupText: {
    fontSize: moderateScale(13),
    marginRight: moderateScale(3),
  },
});
