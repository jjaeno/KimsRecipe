import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCart } from '../../context/CartContext';
import {
  getAddresses,
  createOrder,
  createPayment,
  confirmPayment,
  Address,
} from '../../api/checkout.api';

const POINT_RATE = 0.01;
const POINT_MIN = 3000;

const makePgTransactionId = () =>
  `pg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

type OrderSnapshot = {
  addressId: number | null;
  deliveryRequest: string;
  pointsUsed: number;
};

export default function CheckoutScreen() {
  const navigation = useNavigation<any>(); // 네비게이션 객체
  const { cartItems, summary, loadCartFromServer } = useCart(); // 장바구니/요약

  const [addresses, setAddresses] = useState<Address[]>([]); // 배송지 목록
  const [deliveryRequest, setDeliveryRequest] = useState(''); // 요청사항
  const [payMethod, setPayMethod] = useState<'CARD' | 'KAKAO' | 'TOSS' | 'OTHER'>('CARD'); // 결제수단
  const [usePoints, setUsePoints] = useState(false); // 포인트 사용 여부
  const [rawPoints, setRawPoints] = useState(''); // 입력 원본
  const [pointsInput, setPointsInput] = useState(''); // 디바운스 적용 값
  const [loading, setLoading] = useState(false); // 로딩
  const [isOnline, setIsOnline] = useState(true); // 온라인 여부
  const [orderId, setOrderId] = useState<number | null>(null); // 주문 ID
  const [paymentId, setPaymentId] = useState<number | null>(null); // 결제 ID

  const orderLockRef = useRef(false); // 주문 생성 락
  const paymentLockRef = useRef(false); // 결제 생성 락
  const confirmLockRef = useRef(false); // 결제 확정 락
  const debounceRef = useRef<NodeJS.Timeout | null>(null); // 포인트 입력 디바운스

  const orderSnapshotRef = useRef<OrderSnapshot | null>(null); // 주문 스냅샷 저장

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected)); // 온라인 상태 반영
    });
    return () => unsub(); // 구독 해제
  }, []);

  useEffect(() => {
    // 배송지 로드
    (async () => {
      setLoading(true); // 로딩 시작
      try {
        const data = await getAddresses(); // 주소 목록 조회
        setAddresses(data?.addresses ?? []); // 상태 반영
      } catch (err: any) {
        Alert.alert('오류', err?.message || '배송지 조회 실패'); // 에러 안내
      } finally {
        setLoading(false); // 로딩 종료
      }
    })();
  }, []);

  useEffect(() => {
    // 포인트 입력 디바운스
    if (debounceRef.current) clearTimeout(debounceRef.current); // 기존 타이머 해제
    debounceRef.current = setTimeout(() => {
      setPointsInput(rawPoints); // 디바운스 반영
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current); // 언마운트 정리
    };
  }, [rawPoints]);

  const defaultAddress = useMemo(() => {
    // 기본 배송지 우선, 없으면 첫 번째
    return addresses.find((a) => a.isDefault === 1) || addresses[0] || null;
  }, [addresses]);

  const subtotal = useMemo(() => {
    // 상품 금액 합계
    return cartItems.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
  }, [cartItems]);

  const deliveryFee = useMemo(() => {
    // 배송비(서버 요약값)
    return Number(summary?.baseDeliveryFee || 0);
  }, [summary]);

  const userPoints = useMemo(() => {
    // userPoints가 없을 수 있어 fallback
    return Number(summary?.userPoints || 0);
  }, [summary]);

  const maxUsablePoints = useMemo(() => {
    // 결제 금액 기준 상한
    return Math.max(0, subtotal + deliveryFee);
  }, [subtotal, deliveryFee]);

  const parsedPoints = useMemo(() => {
    // 숫자만 허용
    const n = Number(pointsInput || 0);
    return Number.isFinite(n) ? n : 0;
  }, [pointsInput]);

  const validPoints = useMemo(() => {
    // 토글 OFF면 0
    if (!usePoints) return 0;
    // 최소 사용 조건
    if (parsedPoints < POINT_MIN) return 0;
    // 상한: 보유포인트 및 결제금액
    return Math.min(parsedPoints, userPoints, maxUsablePoints);
  }, [usePoints, parsedPoints, userPoints, maxUsablePoints]);

  const finalTotal = useMemo(() => {
    // 최종 결제 금액
    return Math.max(0, subtotal + deliveryFee - validPoints);
  }, [subtotal, deliveryFee, validPoints]);

  const expectedPoints = useMemo(() => {
    // 적립 예정 포인트
    return Math.floor(finalTotal * POINT_RATE);
  }, [finalTotal]);

  const isMinOrderMet = useMemo(() => {
    // 최소 주문 금액 체크
    return subtotal >= (summary?.minOrderAmount || 0);
  }, [subtotal, summary]);

  const isPayDisabled = useMemo(() => {
    // 결제 불가 조건
    return !isOnline || !defaultAddress || cartItems.length === 0 || !isMinOrderMet || loading;
  }, [isOnline, defaultAddress, cartItems.length, isMinOrderMet, loading]);

  const handleTogglePoints = () => {
    // 오프라인 차단
    if (!isOnline) {
      Alert.alert('오프라인', '오프라인에서는 포인트를 사용할 수 없습니다.');
      return;
    }
    // 보유 포인트 3000 미만이면 ON 불가
    if (userPoints < POINT_MIN) {
      Alert.alert('포인트 부족', '3000p 이상부터 사용 가능합니다.');
      return;
    }
    setUsePoints((prev) => !prev); // 토글 처리
  };

  const clearOrderIfChanged = (reason: string) => {
    // 주문 스냅샷이 없으면 비교 불가
    if (!orderSnapshotRef.current) return;
    const snap = orderSnapshotRef.current;

    const currentAddressId = defaultAddress?.addressId ?? null; // 현재 배송지
    const currentRequest = deliveryRequest; // 현재 요청사항
    const currentPoints = validPoints; // 현재 포인트 사용

    const changed =
      snap.addressId !== currentAddressId ||
      snap.deliveryRequest !== currentRequest ||
      snap.pointsUsed !== currentPoints;

    if (changed) {
      // 정책: 기존 주문/결제 폐기
      setOrderId(null); // 주문 ID 폐기
      setPaymentId(null); // 결제 ID 폐기
      orderSnapshotRef.current = null; // 스냅샷 폐기
      // 안내(선택)
      console.log(`[checkout] order invalidated: ${reason}`);
    }
  };

  const handleRequestBlur = () => {
    // 입력 완료 시점에 변경 감지
    clearOrderIfChanged('deliveryRequest');
  };

  const handlePointsBlur = () => {
    // 포인트 입력 완료 시점에 변경 감지
    clearOrderIfChanged('pointsUsed');
  };

  const handleAddressManage = () => {
    // 배송지 변경 화면 진입 전 스냅샷 비교
    clearOrderIfChanged('addressId');
    navigation.navigate('AddressManage');
  };

  const handleCheckout = async () => {
    if (!isOnline) {
      Alert.alert('오프라인', '오프라인에서는 결제할 수 없습니다.');
      return;
    }
    if (orderLockRef.current || paymentLockRef.current || confirmLockRef.current) return;

    // 결제 버튼 클릭 시점에 최종 변경 감지
    clearOrderIfChanged('beforeCheckout');

    try {
      let targetOrderId = orderId; // 재결제 대비

      // 주문 생성은 결제 버튼 클릭 시점에만
      if (!targetOrderId) {
        orderLockRef.current = true; // 주문 생성 락
        const order = await createOrder({
          deliveryRequest,
          addressId: defaultAddress?.addressId,
          pointsUsed: validPoints,
        });
        targetOrderId = order.orderId; // 생성된 주문 ID
        setOrderId(targetOrderId); // 상태 저장

        // 주문 스냅샷 저장
        orderSnapshotRef.current = {
          addressId: defaultAddress?.addressId ?? null,
          deliveryRequest,
          pointsUsed: validPoints,
        };
      }

      // orderId 보장 체크
      if (!targetOrderId) {
        Alert.alert('오류', '주문 생성에 실패했습니다.');
        return;
      }

      // 결제 생성 (재결제 시 새 payment 생성)
      paymentLockRef.current = true; // 결제 생성 락
      const payment = await createPayment({ orderId: targetOrderId, method: payMethod });
      setPaymentId(payment.paymentId); // 결제 ID 저장

      // 결제 확정 (mock)
      confirmLockRef.current = true; // 결제 확정 락
      const pgTransactionId = makePgTransactionId(); // PG 트랜잭션 ID
      await confirmPayment(payment.paymentId, { pgTransactionId, paidAmount: payment.amount });

      // 결제 성공 후 장바구니 재동기화
      await loadCartFromServer();

      Alert.alert('결제 완료', '주문이 완료되었습니다.');
      navigation.navigate('Orders');
    } catch (err: any) {
      if (err?.status === 409) {
        Alert.alert('주문 불가', err?.message || '장바구니를 갱신합니다.');
        await loadCartFromServer();
      } else {
        Alert.alert('결제 실패', err?.message || '다시 시도해주세요.');
      }
    } finally {
      orderLockRef.current = false;
      paymentLockRef.current = false;
      confirmLockRef.current = false;
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
        <Text style={s.subText}>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.screen}>
        <View style={s.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.appBarIcon}>
            <Icon name="arrow-back-ios" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.appBarTitle}>주문/결제</Text>
          <View style={s.appBarIcon} />
        </View>

        <ScrollView contentContainerStyle={s.scrollContent}>
          {/* 배송 정보 + 요청사항 (같은 카드) */}
          <Text style={s.sectionTitle}>배송 정보</Text>
          <View style={s.card}>
            <View style={s.rowBetweenTop}>
              <View style={s.addressBlock}>
                {defaultAddress ? (
                  <>
                    <Text style={s.nameText}>{defaultAddress.recipientName}</Text>
                    <Text style={s.subText} numberOfLines={2}>
                      {defaultAddress.addressLine1} {defaultAddress.addressLine2}
                    </Text>
                    <Text style={s.phoneText}>{defaultAddress.phone}</Text>
                  </>
                ) : (
                  <Text style={s.subText}>등록된 배송지가 없습니다.</Text>
                )}
              </View>
              <TouchableOpacity onPress={handleAddressManage} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="settings" size={20} color="#8A8F98" />
              </TouchableOpacity>
            </View>

            <View style={s.cardDivider} />

            <Text style={s.sectionTitleInner}>요청사항</Text>
            <TextInput
              style={s.requestInput}
              placeholder="문앞에 놔주세요."
              placeholderTextColor="#B0B5BC"
              multiline
              value={deliveryRequest}
              onChangeText={setDeliveryRequest}
              onBlur={handleRequestBlur}
              editable={isOnline}
              underlineColorAndroid="transparent"
            />
          </View>

          {/* 결제수단 */}
          <Text style={s.sectionTitle}>결제수단</Text>
          <View style={s.card}>
            {(['CARD', 'KAKAO', 'TOSS', 'OTHER'] as const).map((m) => {
              const checked = payMethod === m;
              return (
                <TouchableOpacity key={m} style={s.radioRow} onPress={() => setPayMethod(m)}>
                  <View style={[s.radioOuter, checked && s.radioOuterActive]}>
                    {checked ? <View style={s.radioDot} /> : null}
                  </View>
                  <View style={s.brandLabelWrap}>
                    {m === 'KAKAO' ? <View style={s.kakaoPill}><Text style={s.kakaoText}>pay</Text></View> : null}
                    {m === 'TOSS' ? <View style={s.tossDot} /> : null}
                    <Text style={s.bodyText}>
                      {m === 'CARD'
                        ? '신용/체크카드'
                        : m === 'KAKAO'
                          ? '카카오페이'
                          : m === 'TOSS'
                            ? '토스페이'
                            : '기타 결제수단'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 회원정보 */}
          <Text style={s.sectionTitle}>회원정보</Text>
          <View style={s.card}>
            <View style={s.rowBetween}>
              <Text style={s.labelText}>회원 번호</Text>
              <Text style={s.valueText}>김재노(7239)</Text>
            </View>
            <View style={s.rowBetween}>
              <Text style={s.labelText}>보유 포인트</Text>
              <Text style={s.pointText}>{userPoints.toLocaleString()}p</Text>
            </View>
            <View style={s.rowBetween}>
              <Text style={s.labelText}>포인트 사용</Text>
              <Switch
                value={usePoints}
                onValueChange={handleTogglePoints}
                trackColor={{ false: '#D0D4DA', true: '#4F9A9A' }}
                thumbColor="#fff"
                disabled={!isOnline}
              />
            </View>
            {usePoints ? (
              <View style={s.pointInputRow}>
                <TextInput
                  style={s.pointInput}
                  placeholder="300p"
                  placeholderTextColor="#B0B5BC"
                  editable={isOnline}
                  value={rawPoints}
                  keyboardType="numeric"
                  onChangeText={(t) => setRawPoints(t.replace(/[^0-9]/g, ''))}
                  onBlur={handlePointsBlur}
                />
                <Text style={s.pointSuffix}>p</Text>
              </View>
            ) : null}
            <View style={s.rowBetween}>
              <Text style={s.labelText}>적립 예정 포인트</Text>
              <Text style={s.valueText}>{expectedPoints.toLocaleString()}p</Text>
            </View>
          </View>

          {/* 결제금액 */}
          <Text style={s.sectionTitle}>결제금액</Text>
          <View style={s.card}>
            <View style={s.rowBetween}><Text style={s.labelText}>상품 금액</Text><Text style={s.valueText}>{subtotal.toLocaleString()}원</Text></View>
            <View style={s.rowBetween}><Text style={s.labelText}>배송비</Text><Text style={s.valueText}>{deliveryFee.toLocaleString()}원</Text></View>
            <View style={s.rowBetween}><Text style={s.redText}>포인트 사용</Text><Text style={s.redText}>-{validPoints.toLocaleString()}원</Text></View>
            <View style={s.divider} />
            <View style={s.rowBetween}><Text style={s.totalLabel}>최종 결제 금액</Text><Text style={s.totalLabel}>{finalTotal.toLocaleString()}원</Text></View>
            <Text style={s.expectedPointText}>적립 예정 포인트 +{expectedPoints.toLocaleString()}p</Text>
          </View>
        </ScrollView>

        {/* 하단 고정 바 */}
        <View style={s.bottomBar}>
          <View>
            <Text style={s.bottomLabel}>택배 최소 주문 금액</Text>
            <Text style={s.bottomValue}>{summary?.minOrderAmount?.toLocaleString() ?? '0'}원</Text>
          </View>
          <TouchableOpacity
            style={[s.payBtn, isPayDisabled && s.btnDisabled]}
            onPress={handleCheckout}
            disabled={isPayDisabled}
          >
            <Text style={s.payBtnText}>{finalTotal.toLocaleString()}원 결제하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7F8' },
  screen: { flex: 1, backgroundColor: '#F6F7F8' },

  appBar: {
    height: 56,
    backgroundColor: '#4F9A9A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  appBarIcon: { width: 24, alignItems: 'center' },
  appBarTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 17, fontWeight: '600' },

  scrollContent: { padding: 16, paddingBottom: 90 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 6 },

  sectionTitleInner: { fontSize: 13, fontWeight: '700', color: '#222', marginBottom: 6 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  rowBetweenTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  addressBlock: { flex: 1, paddingRight: 12 },
  nameText: { fontSize: 16, fontWeight: '700', color: '#222' },
  phoneText: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#222' },

  bodyText: { fontSize: 14, color: '#222' },
  labelText: { fontSize: 14, color: '#222' },
  valueText: { fontSize: 14, color: '#222', fontWeight: '600' },
  subText: { fontSize: 12, color: '#8A8F98' },
  pointText: { fontSize: 14, color: '#4F9A9A', fontWeight: '700' },
  redText: { fontSize: 14, color: '#E44' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#222' },

  requestInput: {
    minHeight: 52,
    fontSize: 14,
    color: '#222',
    paddingVertical: 8,
  },

  cardDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#EAEAEA', marginVertical: 12 },

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


  kakaoPill: {
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 9,
    backgroundColor: '#FEE500',
    marginRight: 6,
    justifyContent: 'center',
  },
  kakaoText: { fontSize: 10, fontWeight: '700', color: '#111' },
  tossDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#4F7DF5', marginRight: 6 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },

  pointInputRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  pointInput: {
    width: 120,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    textAlign: 'right',
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fff',
  },
  pointSuffix: { marginLeft: 6, color: '#8A8F98', fontSize: 12 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#EAEAEA', marginVertical: 8 },
  expectedPointText: { fontSize: 12, color: '#8A8F98', textAlign: 'right' },

  bottomBar: {
    height: 80,
    borderTopWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomLabel: { fontSize: 11, color: '#8A8F98' },
  bottomValue: { fontSize: 12, color: '#222', marginTop: 2 },

  payBtn: {
    minWidth: 180,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#4F9A9A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  payBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.4 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
