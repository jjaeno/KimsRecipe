import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { moderateScale } from 'react-native-size-matters';
import { createHomePartyReservation, fetchHomePartyMenusByIds } from '../../api/homeParty';
import { useStore } from '../../context/StoreContext';
import type { RootStackParamList } from '../../navigation/StackNavigator';
import type { HomePartyMenu } from '../../types/homeParty';

const EVENT_STORAGE_KEY = 'homePartyEventInfo';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;
type MenuMap = Record<string, HomePartyMenu>;
type PayMethod = 'CARD' | 'KAKAO' | 'TOSS' | 'OTHER';

type EventInfoStorage = {
  eventType?: string;
  headcount?: number;
  eventDateTime?: string;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
};

const formatBudget = (value?: number) => {
  if (!value) return '미정';
  if (value >= 10000 && value % 10000 === 0) return `${value / 10000}만원`;
  return `${value.toLocaleString()}원`;
};

export default function PaymentScreen({ navigation, route }: Props) {
  const {
    mode,
    storeId,
    eventType,
    eventDateTime,
    headcount,
    budgetMin,
    budgetMax,
    selectedItems,
    setConfigTitle,
    setId,
    recommendedMinHeadcount,
    recommendedMaxHeadcount,
  } = route.params;

  const { stores } = useStore();
  const [menuMap, setMenuMap] = useState<MenuMap>({});
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('CARD');
  const [requestNote, setRequestNote] = useState('');
  const [pickupDateTime, setPickupDateTime] = useState(eventDateTime);
  const [displayEventType, setDisplayEventType] = useState(eventType);
  const [displayHeadcount, setDisplayHeadcount] = useState(headcount);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const submitLockRef = useRef(false);

  const draftStorageKey = useMemo(() => {
    return ['homePartyCheckoutDraft', storeId, eventType, eventDateTime, String(setId || ''), mode].join(':');
  }, [storeId, eventType, eventDateTime, setId, mode]);

  const storeName = useMemo(() => {
    return stores.find((store) => String(store.storeId) === String(storeId))?.storeName || `매장 #${storeId}`;
  }, [stores, storeId]);

  const servingText = useMemo(() => {
    if (recommendedMinHeadcount && recommendedMaxHeadcount) {
      return `${recommendedMinHeadcount}~${recommendedMaxHeadcount}인용 구성`;
    }
    return `${Math.max(1, displayHeadcount - 1)}~${displayHeadcount + 2}인용 구성`;
  }, [recommendedMinHeadcount, recommendedMaxHeadcount, displayHeadcount]);

  const totalAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const menu = menuMap[String(item.hpMenuId)];
      if (!menu) return sum;
      return sum + Number(menu.price) * Number(item.quantity);
    }, 0);
  }, [selectedItems, menuMap]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const restoreDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(draftStorageKey);
        if (!raw) return;
        const draft = JSON.parse(raw) as { payMethod?: PayMethod; requestNote?: string; pickupDateTime?: string };
        if (draft.payMethod) setPayMethod(draft.payMethod);
        if (typeof draft.requestNote === 'string') setRequestNote(draft.requestNote);
        if (typeof draft.pickupDateTime === 'string') setPickupDateTime(draft.pickupDateTime);
      } catch (err) {
        console.warn('failed to restore home party checkout draft', err);
      }
    };
    restoreDraft();
  }, [draftStorageKey]);

  useEffect(() => {
    AsyncStorage.setItem(
      draftStorageKey,
      JSON.stringify({ payMethod, requestNote, pickupDateTime }),
    ).catch((err) => {
      console.warn('failed to save home party checkout draft', err);
    });
  }, [draftStorageKey, payMethod, requestNote, pickupDateTime]);

  useFocusEffect(
    useCallback(() => {
      const syncEventInfo = async () => {
        try {
          const raw = await AsyncStorage.getItem(EVENT_STORAGE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw) as EventInfoStorage;
          if (parsed.eventType) setDisplayEventType(parsed.eventType);
          if (typeof parsed.headcount === 'number' && Number.isFinite(parsed.headcount) && parsed.headcount > 0) {
            setDisplayHeadcount(Math.floor(parsed.headcount));
          }
          if (parsed.eventDateTime) setPickupDateTime(parsed.eventDateTime);
        } catch (err) {
          console.warn('failed to sync event info', err);
        }
      };
      syncEventInfo();
    }, []),
  );

  useEffect(() => {
    const ids = Array.from(new Set(selectedItems.map((item) => String(item.hpMenuId))));
    if (!ids.length) {
      setMenuMap({});
      return;
    }
    let active = true;
    setLoadingMenus(true);
    fetchHomePartyMenusByIds(ids)
      .then((menus) => {
        if (!active) return;
        const next: MenuMap = {};
        menus.forEach((menu) => {
          next[String(menu.hpMenuId)] = menu;
        });
        setMenuMap(next);
      })
      .catch((err) => {
        if (!active) return;
        Alert.alert('오류', err?.message || '메뉴 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!active) return;
        setLoadingMenus(false);
      });
    return () => {
      active = false;
    };
  }, [selectedItems]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const toggleAccordion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded;
    setExpanded(next);
    Animated.timing(rotateAnim, {
      toValue: next ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const handleSubmit = async () => {
    if (submitLockRef.current || submitting) return;
    if (!isOnline) {
      Alert.alert('오프라인', '오프라인에서는 예약을 진행할 수 없습니다.');
      return;
    }
    if (!pickupDateTime) {
      Alert.alert('입력 필요', '픽업 일시를 확인해주세요.');
      return;
    }
    if (!selectedItems.length) {
      Alert.alert('입력 필요', '선택한 메뉴가 없습니다.');
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      const result = await createHomePartyReservation({
        storeId,
        eventType: displayEventType,
        headcount: displayHeadcount,
        budgetMin,
        budgetMax,
        eventDateTime,
        pickupDateTime,
        sourceType: setId ? 'SET' : 'CUSTOM',
        baseSetId: setId ? String(setId) : null,
        requestNote,
        items: selectedItems,
      });
      await AsyncStorage.removeItem(draftStorageKey);
      Alert.alert(
        '예약 접수 완료',
        `예약번호 ${result.reservationId}\n총 금액 ${result.totalAmount.toLocaleString()}원`,
      );
      navigation.navigate('Tab');
    } catch (err: any) {
      Alert.alert('예약 실패', err?.message || '예약/결제를 진행하지 못했습니다.');
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>행사 정보</Text>
          <View style={styles.card}>
            <Text style={styles.eventName}>{displayEventType}</Text>
            <View style={styles.infoRow}>
              <Icon name="event" size={20} color="#009798" />
              <Text style={styles.infoText}>{formatDateTime(eventDateTime)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="people" size={20} color="#009798" />
              <Text style={styles.infoText}>{displayHeadcount}인</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>선택한 세트</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <Text style={styles.setTitle}>{setConfigTitle || '세트 구성'}</Text>
                <Text style={styles.setSubText}>{servingText}</Text>
              </View>
              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel}>총 금액</Text>
                <Text style={styles.amountValue}>{totalAmount.toLocaleString()}원</Text>
              </View>
            </View>

            {expanded ? (
              <>
                <View style={styles.cardDivider} />
                {loadingMenus ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator />
                  </View>
                ) : (
                  selectedItems.map((item, index) => {
                    const menu = menuMap[String(item.hpMenuId)];
                    return (
                      <View key={String(item.hpMenuId)}>
                        <View style={styles.setItemRow}>
                          {menu?.imageUrl ? (
                            <Image source={{ uri: menu.imageUrl }} style={styles.setItemImage} />
                          ) : (
                            <View style={[styles.setItemImage, styles.setItemImagePlaceholder]} />
                          )}
                          <View style={styles.setItemInfo}>
                            <Text style={styles.setItemName}>
                              {menu?.menuName || '메뉴 정보 없음'} x {item.quantity}
                            </Text>
                            <Text style={styles.setItemPrice}>
                              {menu ? (menu.price * item.quantity).toLocaleString() : '-'}원
                            </Text>
                          </View>
                        </View>
                        {index !== selectedItems.length - 1 ? <View style={styles.itemDivider} /> : null}
                      </View>
                    );
                  })
                )}
              </>
            ) : null}

            <View style={styles.cardDivider} />
            <TouchableOpacity style={styles.accordionToggle} onPress={toggleAccordion}>
              <Text style={styles.accordionToggleText}>{expanded ? '접기' : '세트 구성 보기'}</Text>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <Icon name="expand-more" size={20} color="#009798" />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>픽업 정보</Text>
          <View style={styles.card}>
            <View style={styles.pickupTop}>
              <View style={styles.pickupInfoWrap}>
                <View style={styles.infoRow}>
                  <Icon name="event" size={20} color="#009798" />
                  <Text style={styles.infoText}>{formatDateTime(pickupDateTime)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="place" size={20} color="#009798" />
                  <Text style={styles.infoText}>{storeName}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('EventInfoInput')}>
                <Icon name="settings" size={20} color="#009798" />
              </TouchableOpacity>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.rowBetween}>
              <Text style={styles.requestLabel}>요청사항</Text>
              <TextInput
                style={styles.requestInput}
                value={requestNote}
                onChangeText={setRequestNote}
                placeholder="포장 꼼꼼히 해주세요."
                placeholderTextColor="#9AA0A6"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>결제수단</Text>
          <View style={styles.card}>
            {(['CARD', 'KAKAO', 'TOSS', 'OTHER'] as const).map((method) => {
              const checked = payMethod === method;
              return (
                <TouchableOpacity key={method} style={styles.radioRow} onPress={() => setPayMethod(method)}>
                  <View style={[styles.radioOuter, checked && styles.radioOuterActive]}>
                    {checked ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={styles.radioText}>
                    {method === 'CARD'
                      ? '신용/체크카드'
                      : method === 'KAKAO'
                        ? '카카오페이'
                        : method === 'TOSS'
                          ? '토스페이'
                          : '기타 결제수단'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>주의사항</Text>
          <View style={styles.card}>
            <Text style={styles.noticeText}>결제 완료 후 매장 확인을 통해 예약 확정 여부가 결정됩니다.</Text>
            <View style={styles.warningRow}>
              <Icon name="warning" size={16} color="#F05A5A" />
              <Text style={styles.warningText}>예약 확정 이후에는 취소 및 변경이 어렵습니다.</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <Text style={styles.footerLabel}>최종 결제 금액</Text>
            <Text style={styles.footerValue}>{totalAmount.toLocaleString()}원</Text>
          </View>
          <TouchableOpacity
            style={[styles.ctaButton, (submitting || !selectedItems.length || !isOnline) && styles.ctaButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !selectedItems.length || !isOnline}
          >
            <Text style={styles.ctaText}>{submitting ? '처리중...' : '결제 및 예약 하기'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // SafeArea 및 화면 기본 레이아웃
  safe: { flex: 1, backgroundColor: '#ffffff' },
  screen: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 130 },

  // 섹션 제목 텍스트
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 10, paddingLeft: 5 },

  // 공통 카드 컨테이너
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingTop: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(10),
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // 행사 정보 카드
  eventName: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#232323',
    marginBottom: moderateScale(10),
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(8) },
  infoText: { marginLeft: moderateScale(8), fontSize: moderateScale(14), color: '#3B3B3B' },

  // 공통 행 정렬 유틸 스타일
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flexOne: { flex: 1 },

  // 선택한 세트 요약 카드
  setTitle: { fontSize: moderateScale(14), fontWeight: '600', color: '#000' },
  setSubText: { marginTop: moderateScale(8), fontSize: moderateScale(13), color: '#6B7280' },
  amountBlock: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end', marginLeft: moderateScale(10) },
  amountLabel: { fontSize: moderateScale(12), color: '#7A7A7A', paddingRight: moderateScale(13) },
  amountValue: { fontSize: moderateScale(14), fontWeight: '700', color: '#232323' },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DADDE1',
    marginHorizontal: moderateScale(-14),
    marginVertical: moderateScale(10),
  },
  accordionToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  accordionToggleText: { fontSize: moderateScale(13), color: '#009798', fontWeight: '600' },
  loadingBox: { paddingVertical: moderateScale(16), alignItems: 'center' },

  // 선택한 세트 메뉴 아이템 행
  setItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: moderateScale(7) },
  setItemImage: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(8),
    backgroundColor: '#ECECEC',
  },
  setItemImagePlaceholder: { backgroundColor: '#F2F2F2' },
  setItemInfo: { flex: 1, marginLeft: moderateScale(10) },
  setItemName: { fontSize: moderateScale(13), fontWeight: '500', color: '#222' },
  setItemPrice: { marginTop: moderateScale(2), fontSize: moderateScale(13), color: '#6B7280' },
  itemDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#ECEFF3' },

  // 수령/행사 상세 정보 카드
  pickupTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pickupInfoWrap: { flex: 1 },
  requestLabel: { fontSize: moderateScale(13), color: '#222', fontWeight: '500' },
  requestInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: moderateScale(13),
    color: '#555',
    paddingVertical: moderateScale(5),
    marginLeft: moderateScale(8),
  },

  // 결제수단 라디오 목록
  radioRow: { flexDirection: 'row', alignItems: 'center', height: 48 },
  brandLabelWrap: { flexDirection: 'row', alignItems: 'center' },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D0D4DA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
    },
  radioOuterActive: {
    borderColor: '#4F9A9A',
    backgroundColor: '#4F9A9A', // 바깥 링/채움 청록
    },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#fff', // 가운데 원 흰색
    },
  radioText: { fontSize: moderateScale(14)},

  // 안내/주의사항 카드
  noticeText: { fontSize: moderateScale(13), color: '#333', lineHeight: moderateScale(18), marginBottom: moderateScale(8) },
  warningRow: { flexDirection: 'row', alignItems: 'center' },
  warningText: { marginLeft: moderateScale(5), fontSize: moderateScale(13), color: '#F05A5A', fontWeight: '500' },

  // 하단 고정 푸터
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
    paddingTop: moderateScale(12),
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
  },
  footerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  footerLabel: { fontSize: moderateScale(15), color: '#009798', fontWeight: '500' },
  footerValue: { fontSize: moderateScale(15), color: '#000', fontWeight: '600' },
  ctaButton: {
    height: moderateScale(50),
    backgroundColor: '#009798',
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: '#c5c5c5',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});
