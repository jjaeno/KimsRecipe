import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import Icon  from 'react-native-vector-icons/MaterialIcons'
import { moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage'; //토큰 저장을 위함
import {API_DEVICE} from '@env';


type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  /*----로그인했던 사용자는 자동 로그인(추후에 splashScreen에 넣어야함)----*/
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        navigation.replace('Start');
      }
    }
    checkToken();
  }, []);

  const login = async () => {
    //  if (!username || !password) {
    //    return Alert.alert('아이디와 비밀번호를 입력하세요.');
    //  }

    try {
      const res = await fetch(`${API_DEVICE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      setMessage(data.message || JSON.stringify(data));

      if (data.token) {
        console.log('JWT Token:', data.token);
      }
      if (data.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Start'}],
        });
        await AsyncStorage.setItem('token', data.token);
        console.log('로컬에 저장된 토큰:', AsyncStorage.getItem('token'));
      }
      
    } catch (error) {
      console.error(error);
      setMessage('로그인 실패');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Image
          source={require('../assets/image/icon.png')}
          style={{width: '50%', height: '40%', resizeMode: 'contain'}}
        />
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
        <Icon name = "arrow-forward-ios" size={12} color="black" style={{marginTop: moderateScale(2)}}/>
      </TouchableOpacity>
      
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: moderateScale(20), backgroundColor: '#ffffff', },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(190),
    marginTop: moderateScale(25),
    marginBottom: moderateScale(25)
  },
  title: { 
    fontSize: moderateScale(35), 
    fontWeight: 'bold',
    color: '#009798'
  },
  authContainer: {
    marginBottom: moderateScale(15),
    justifyContent: 'flex-start'
  },
  authText: {
    fontSize: moderateScale(12),
    fontWeight: 'bold'
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
    marginTop: moderateScale(20)
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
    marginTop: '70%'
  },
  signupText: {
    fontSize: moderateScale(13),
    marginRight: moderateScale(3)
  }
});
