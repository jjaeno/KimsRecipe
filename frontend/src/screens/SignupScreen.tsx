import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { moderateScale } from 'react-native-size-matters';
import { API_DEVICE } from '@env';


type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const checkUsername = async () => {
   // if (!username.trim()) return Alert.alert('아이디를 입력해주세요.');

    try {
      const res = await fetch(`${API_DEVICE}/v1/auth/check-username?username=${username.trim()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage('중복 확인 실패');
    }
  };

  const register = async () => {
     if (!username || !name || !password || !confirmPassword) {
       return Alert.alert('필수 항목을 입력하세요.');
     }

    try {
      const res = await fetch(`${API_DEVICE}/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, password, confirmPassword, phone }),
      });

      const data = await res.json();
      setMessage(data.message || JSON.stringify(data));
      if (data.success){
        Alert.alert('회원가입 성공', '로그인 페이지로 이동합니다.')
        navigation.goBack();
      }
    } catch (error) {
      console.error(error);
      setMessage('회원가입 실패');
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
      <TextInput style={styles.input} placeholder="비밀번호 확인" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
      <TextInput style={styles.input} placeholder="전화번호(선택)" value={phone} onChangeText={setPhone} />
      <Text style={styles.message}>{message}</Text>
      
      <TouchableOpacity style={styles.signupButton} onPress={register}>
        <Text style={styles.signupText}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: moderateScale(20), paddingTop: moderateScale(40), backgroundColor: '#fff' },
    idContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      //justifyContent: 'space-between'
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
      marginBottom: moderateScale(15)
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
      marginTop: moderateScale(20)
    },
    signupText: {
      fontSize: moderateScale(16),
      fontWeight: 'bold',
      color: '#ffffff',
    },
});
