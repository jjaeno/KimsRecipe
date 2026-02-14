import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/StackNavigator';

const EVENT_TYPES = ['생일파티', '집들이', '친목모임', '제사', '기타'];
const STORAGE_KEY = 'homePartyEventInfo';

type Props = NativeStackScreenProps<RootStackParamList, 'EventInfoInput'>;

export default function EventInfoInputScreen({ navigation }: Props) {
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [headcount, setHeadcount] = useState(4);
  const [showTypePicker, setShowTypePicker] = useState(false);

  useEffect(() => {
    const loadEventInfo = async () => {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return;
      try {
        const info = JSON.parse(json) as {
          eventType?: string;
          headcount?: number;
          eventDateTime?: string;
        };

        if (info.eventDateTime) {
          const parsed = new Date(info.eventDateTime);
          if (!Number.isNaN(parsed.getTime())) {
            setDate(parsed);
          }
        }

        if (typeof info.eventType === 'string') {
          setEventType(EVENT_TYPES.includes(info.eventType) ? info.eventType : '기타');
        }

        if (typeof info.headcount === 'number' && Number.isFinite(info.headcount) && info.headcount > 0) {
          setHeadcount(Math.floor(info.headcount));
        }
      } catch {
        // ignore corrupted storage payload
      }
    };

    loadEventInfo();
  }, []);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (event?.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    if (!selectedDate) {
      setShowPicker(false);
      return;
    }

    if (Platform.OS === 'android') {
      const nextDate = new Date(date);
      nextDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      nextDate.setHours(12, 0, 0, 0);
      setDate(nextDate);
      setShowPicker(false);
      return;
    }

    const nextDate = new Date(selectedDate);
    nextDate.setHours(12, 0, 0, 0);
    setDate(nextDate);
    setShowPicker(false);
  };

  const dateDisplay = useMemo(() => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const day = days[date.getDay()];
    return `${y}년 ${m}월 ${d}일 (${day})`;
  }, [date]);

  const saveAndGoBack = async () => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);

    const eventInfo = {
      eventType,
      headcount,
      eventDateTime: normalized.toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(eventInfo));
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBanner}>
          <View>
            <Icon name="info" size={15} color="#ffffff" style={{marginRight: moderateScale(9)}} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoText}>아래 옵션을 선택하면 자동으로 홈파티 음식 구성을 추천해드립니다.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>행사 날짜</Text>
          <TouchableOpacity
            onPress={() => {
              setShowPicker(true);
            }}
            style={styles.inputCard}
          >
            <Icon name="event" size={24} color="#4F9B99" style={{position: 'absolute', left: moderateScale(11)}}/>
            <Text style={styles.inputText}>{dateDisplay}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>행사 종류</Text>
          <TouchableOpacity style={styles.inputCard} onPress={() => setShowTypePicker(true)}>
            <Text style={[styles.inputText, {fontWeight: '500'}]}>{eventType}</Text>
            <Icon name="arrow-drop-down" size={24} color="#7A7A7A" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>인원 수</Text>
          <View style={[styles.inputCard, {justifyContent: 'space-between'}]}>
            <TouchableOpacity
              onPress={() => setHeadcount(Math.max(1, headcount - 1))}
              style={styles.stepperButton}
            >
              <Text style={[styles.stepperButtonText,{fontSize: moderateScale(29)}]}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{headcount}명</Text>
            <TouchableOpacity onPress={() => setHeadcount(headcount + 1)} style={styles.stepperButton}>
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <TouchableOpacity style={styles.ctaButton} onPress={saveAndGoBack}>
          <Text style={styles.ctaText}>확인</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChangeDate}
        />
      )}

      <Modal
        isVisible={showTypePicker}
        onBackdropPress={() => setShowTypePicker(false)}
        backdropOpacity={0.4}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>행사 종류 선택</Text>
          <FlatList
            data={EVENT_TYPES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.optionItem, item === eventType && styles.optionItemSelected]}
                onPress={() => {
                  setEventType(item);
                  setShowTypePicker(false);
                }}
              >
                <Text style={item === eventType ? styles.optionTextSelected : styles.optionText}>{item}</Text>
                {item === eventType ? <Icon name="check" size={20} color="#009798" /> : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(120),
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8DA6A0',
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    marginTop: moderateScale(12),
    marginBottom: moderateScale(24),
  },
  infoIconText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoText: {
    color: '#ffffff',
    fontSize: moderateScale(13),
    fontWeight: '400',
  },
  section: {
    marginBottom: moderateScale(18),
  },
  sectionLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: moderateScale(12),
  },
  inputCard: {
    height: moderateScale(52),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E9E9E9',
    paddingHorizontal: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputText: {
    marginLeft: moderateScale(10),
    fontSize: moderateScale(14),
    color: '#222222',
  },
  stepperButton: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: moderateScale(20),
    fontWeight: '400',
  },
  stepperValue: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#1E1E1E',
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
    backgroundColor: 'transparent',
  },
  ctaButton: {
    height: moderateScale(54),
    borderRadius: moderateScale(14),
    backgroundColor: '#4F9B99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(16),
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: 'black',
    marginVertical: moderateScale(12),
  },
  optionItem: {
    paddingVertical: moderateScale(20),
  },
  optionText: {
    fontSize: moderateScale(16),
    color: 'black',
  },
  optionItemSelected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTextSelected: {
    fontSize: moderateScale(16),
    color: '#009798',
  },
});
