import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Address, createAddress, getMyAddress, updateAddress } from '../../api/checkout.api';

type RouteParams = {
  postalCode?: string;
  addressLine1?: string;
};

export default function AddressEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [addressId, setAddressId] = useState<number | null>(null);
  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhone(text));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getMyAddress();
        if (!mounted) return;
        if (data) {
          const address = data as Address;
          setAddressId(address.addressId);
          setLabel(address.label || '');
          setRecipientName(address.recipientName || '');
          setPhone(address.phone || '');
          setPostalCode(address.postalCode || '');
          setAddressLine1(address.addressLine1 || '');
          setAddressLine2(address.addressLine2 || '');
          setIsDefault(address.isDefault === 1);
        }
      } catch (err: any) {
        Alert.alert('오류', err?.message || '배송지 정보를 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const params = route.params as RouteParams | undefined;
    if (!params) return;
    if (params.postalCode) setPostalCode(params.postalCode);
    if (params.addressLine1) setAddressLine1(params.addressLine1);
  }, [route.params]);

  const handleSearchAddress = () => {
    navigation.navigate('AddressSearchWebView');
  };

  const handleSave = async () => {
    if (!recipientName.trim()) {
      Alert.alert('입력 필요', '수령인 이름을 입력해 주세요.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('입력 필요', '연락처를 입력해 주세요.');
      return;
    }
    if (!addressLine1.trim()) {
      Alert.alert('입력 필요', '주소 검색으로 주소를 선택해 주세요.');
      return;
    }

    const payload = {
      label: label.trim() || null,
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      postalCode: postalCode.trim() || null,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || null,
      isDefault: isDefault ? 1 : 0,
    };

    try {
      setLoading(true);
      if (addressId) {
        await updateAddress(addressId, payload);
      } else {
        await createAddress(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('오류', err?.message || '배송지 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>배송지 정보</Text>

      <Text style={s.label}>별칭</Text>
      <TextInput
        style={s.input}
        placeholder="집, 회사"
        value={label}
        onChangeText={setLabel}
      />

      <Text style={s.label}>수령인</Text>
      <TextInput
        style={s.input}
        placeholder="홍길동"
        value={recipientName}
        onChangeText={setRecipientName}
      />

      <Text style={s.label}>연락처</Text>
      <TextInput
        style={s.input}
        placeholder="010-1234-5678"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={handlePhoneChange}
      />

      <Text style={s.label}>우편번호</Text>
      <View style={s.readonlyRow}>
        <TextInput style={[s.input, s.readonlyInput]} value={postalCode} editable={false} />
        <TouchableOpacity style={s.searchBtn} onPress={handleSearchAddress}>
          <Text style={s.searchBtnText}>주소 검색</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.label}>주소</Text>
      <TextInput style={[s.input, s.readonlyInput]} value={addressLine1} editable={false} />

      <Text style={s.label}>상세주소</Text>
      <TextInput
        style={s.input}
        placeholder="동/호수 등"
        value={addressLine2}
        onChangeText={setAddressLine2}
      />

      <View style={s.switchRow}>
        <Text style={s.label}>기본 배송지</Text>
        <Switch value={isDefault} onValueChange={setIsDefault} />
      </View>

      <TouchableOpacity style={[s.saveBtn, loading && s.btnDisabled]} onPress={handleSave} disabled={loading}>
        <Text style={s.saveBtnText}>{loading ? '저장 중...' : '저장'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#ffffff' },
  title: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
  },
  readonlyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readonlyInput: { backgroundColor: '#F6F6F6', flex: 1 },
  searchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#009798',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  saveBtn: { marginTop: 20, backgroundColor: '#009798', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
});
