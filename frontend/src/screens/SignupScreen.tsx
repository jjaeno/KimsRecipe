import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';



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
      const res = await fetch(`${API_BASE}/check-username?username=${username.trim()}`, {
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
      const res = await fetch(`${API_BASE}/signUp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, name, password, confirmPassword, phone }),
      });

      const data = await res.json();
      setMessage(data.message || JSON.stringify(data));
    } catch (error) {
      console.error(error);
      setMessage('회원가입 실패');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput style={styles.input} placeholder="아이디" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="이름" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="비밀번호 확인" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
      <TextInput style={styles.input} placeholder="전화번호(선택)" value={phone} onChangeText={setPhone} />

      <TouchableOpacity style={styles.button} onPress={checkUsername}>
        <Text style={styles.buttonText}>아이디 중복 확인</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={register}>
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#2196F3' }]} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>로그인 페이지로</Text>
      </TouchableOpacity>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginTop: 10, borderRadius: 8 },
  button: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, marginTop: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  message: { marginTop: 20, color: 'blue', textAlign: 'center' },
});
