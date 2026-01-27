import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Image } from 'react-native';

import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import type { CartItem } from '../../types/cart';
import { Checkbox } from 'react-native-paper';
import { moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * FlatList에 들어가는 "행(row)" 타입 정의
 */
type Row =
  | { type: 'item'; item: CartItem }
  | { type: 'addMenu' }
  | { type: 'spacer' };

export default function CartScreen() {
  const navigation = useNavigation<any>();

  /**
   * CartContext에서 내려오는 상태/액션
   */
  const {
    cartItems,
    summary,
    loading,
    error,
    fromCache,
    loadCartFromServer,
    updateQuantity,
    removeSelected,
    clearCart,
    validateBeforeCheckout,
  } = useCart();

  /**
   * uiItems: 화면에 뿌릴 로컬 상태 (낙관적 업데이트 + 롤백을 위해 cartItems와 분리)
   * selectedIds: 선택 삭제를 위해 체크된 storeMenuId들을 Set으로 관리
   * isOnline: NetInfo 기반 온라인 여부
   * localLoading: 삭제/비우기 등 UI 액션 처리 중 로딩 표시용
   * selectionReady: 선택 상태 복원 완료 여부 (AsyncStorage는 비동기라서 딜레이 발생하는걸 막기 위함)
   */
  const [uiItems, setUiItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [selectionReady, setSelectionReady] = useState(false);

  /**
   * footerH: footer 실제 높이(onLayout) 측정값
   */
  const [footerH, setFooterH] = useState(moderateScale(100)); // footer height fallback

  /**
   * inFlightRef: 동일 key 요청의 중복 실행 방지(락)
   * debounceRef: 수량 변경 디바운스 타이머 저장
   * pendingQtyRef: 디바운스 동안 마지막으로 입력된 수량 저장
   * lastStableRef: 서버 동기화 실패 시 롤백하기 위한 마지막 안정 상태
   * orderLockRef: 주문 버튼 중복 클릭 방지(락)
   */
  const inFlightRef = useRef<Map<string, boolean>>(new Map());
  const debounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const pendingQtyRef = useRef<Map<string, number>>(new Map());
  const lastStableRef = useRef<CartItem[]>([]);
  const orderLockRef = useRef(false);
  
  // 메뉴 선택 상태 로컬 스토리지 키
  const SELECTED_KEY = 'cart_selected_ids_v1';
  // 이전 장바구니 상태 기억용 키
  const CART_IDS_KEY = 'cart_ids_v1';
  /**
   * 최초 진입 시 서버에서 장바구니 로드
   */
  useEffect(() => {
    loadCartFromServer();
  }, [loadCartFromServer]);

  /**
   * cartItems가 갱신되면 UI 상태 동기화 + 롤백 기준 갱신
   */
  useEffect(() => {
    setUiItems(cartItems);
    lastStableRef.current = cartItems;
  }, [cartItems]);

  /**
   * 선택 상태 복원
    * - selectedIds + lastCartIds Key를 조합해서 복원
    * - 해제 상태 유지 + 새로 담긴 아이템만 
   */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rawSelected = await AsyncStorage.getItem(SELECTED_KEY);
        const rawCartIds = await AsyncStorage.getItem(CART_IDS_KEY);
        if (cancelled) return;

        const savedSelected = rawSelected ? (JSON.parse(rawSelected) as string[]) : [];
        const savedCartIds = rawCartIds ? (JSON.parse(rawCartIds) as string[]) : [];

        const currentIds = cartItems.map((it) => it.storeMenuId);
        const currentIdSet = new Set(currentIds);

        // 기존 선택 유지 (현재 카트에 있는 것만)
        const next = new Set(savedSelected.filter((id) => currentIdSet.has(id)));

        // 새로 담긴 아이템만 자동 선택
        const newIds = currentIds.filter((id) => !savedCartIds.includes(id));
        newIds.forEach((id) => next.add(id));

        // 저장된 선택이 전혀 없고 카트가 있다면 전체 선택 (최초 진입용)
        if (savedSelected.length === 0 && currentIds.length > 0) {
          currentIds.forEach((id) => next.add(id));
        }

        setSelectedIds(next);
        setSelectionReady(true);
      } catch {
        setSelectedIds(new Set(cartItems.map((it) => it.storeMenuId)));
        setSelectionReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [cartItems]);

  /**
   * 선택 상태 저장
   */
  useEffect(() => {
    if (!selectionReady) return;
    const ids = Array.from(selectedIds);
    AsyncStorage.setItem(SELECTED_KEY, JSON.stringify(ids));
    AsyncStorage.setItem(CART_IDS_KEY, JSON.stringify(cartItems.map((it) => it.storeMenuId)));
  }, [selectedIds, selectionReady, cartItems]);

  /**
   * NetInfo 구독으로 온라인 상태 추적
   */
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected));
    });
    return () => unsub();
  }, []);

  /**
   * 총 금액 (서버 summary 기반)
   */

  const selectedItems = useMemo(
    () => uiItems.filter((it) => selectedIds.has(it.storeMenuId)),
    [uiItems, selectedIds]
  );

  const selectedTotalPrice = useMemo(
    () => selectedItems.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0),
    [selectedItems]
  );



  /**
   * 품절/숨김 상품이 하나라도 포함되어 있으면 true
   * - 주문 버튼 비활성화 조건에 사용
   */
  const hasBlockedItems = useMemo(() => {
    return selectedItems.some((it) => it.menuStatus === 'SOLD_OUT' || it.menuStatus === 'HIDDEN');
  }, [uiItems]);

  /**
   * 최소 주문 금액 충족 여부
   */
  const isMinOrderMet = useMemo(() => {
    return selectedTotalPrice >= (summary.minOrderAmount || 0);
  }, [selectedTotalPrice, summary.minOrderAmount]);

  /**
   * 주문 버튼 비활성 조건
   */
  const isOrderDisabled = useMemo(() => {
    return !isOnline || selectedItems.length === 0 || hasBlockedItems || !isMinOrderMet;
  }, [isOnline, selectedItems.length, hasBlockedItems, isMinOrderMet]);

  /**
   * 전체 선택 토글
   * - 현재 선택 개수가 전체 아이템 개수와 다르면 전체 선택
   * - 같으면 전체 해제(빈 Set)
   */
  const toggleSelectAll = () => {
    const next = new Set<string>();
    if (selectedIds.size !== uiItems.length) {
      uiItems.forEach((it) => next.add(it.storeMenuId));
    }
    setSelectedIds(next);
  };

  /**
   * 단일 아이템 선택 토글
   */
  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  /**
   * 동일 key의 비동기 작업이 겹쳐 실행되지 않도록 락을 거는 유틸
   * - 예: qty:storeMenuId, bulkDelete, clear 등
   */
  const runWithLock = async (key: string, fn: () => Promise<void>) => {
    if (inFlightRef.current.get(key)) return;
    inFlightRef.current.set(key, true);
    try {
      await fn();
    } finally {
      inFlightRef.current.delete(key);
    }
  };

  /**
   * 수량 변경을 바로 서버에 쏘지 않고 디바운스(400ms)로 묶어서 처리
   * - pendingQtyRef에 마지막 수량을 저장
   * - 기존 타이머가 있으면 취소하고 새 타이머로 갱신
   * - 타이머 만료 시 최종 수량으로 updateQuantity 호출
   * - 실패하면 lastStableRef로 UI 롤백
   */
  const scheduleQuantityUpdate = (storeMenuId: string, quantity: number) => {
    pendingQtyRef.current.set(storeMenuId, quantity);

    const prev = debounceRef.current.get(storeMenuId);
    if (prev) clearTimeout(prev);

    const timer = setTimeout(async () => {
      const targetQty = pendingQtyRef.current.get(storeMenuId);
      if (targetQty == null) return;

      await runWithLock(`qty:${storeMenuId}`, async () => {
        try {
          await updateQuantity(storeMenuId, targetQty);
        } catch {
          setUiItems(lastStableRef.current);
        }
      });

      pendingQtyRef.current.delete(storeMenuId);
    }, 400);

    debounceRef.current.set(storeMenuId, timer);
  };

  /**
   * UI에서 수량 증감 처리
   * - 오프라인이면 차단
   * - 판매중(ON_SALE)만 변경 허용
   * - UI는 즉시 반영(낙관적 업데이트) 후 scheduleQuantityUpdate로 서버 반영 예약
   */
  const changeQuantity = (item: CartItem, delta: number) => {
    if (!isOnline) {
      Alert.alert('오프라인', '오프라인에서는 수량을 변경할 수 없습니다.');
      return;
    }
    if (item.menuStatus !== 'ON_SALE') return;

    const nextQty = Math.max(1, Math.min(99, item.quantity + delta));

    setUiItems((prev) =>
      prev.map((it) => (it.storeMenuId === item.storeMenuId ? { ...it, quantity: nextQty } : it))
    );

    scheduleQuantityUpdate(item.storeMenuId, nextQty);
  };

  /**
   * 선택 삭제
   * - 오프라인이면 차단
   * - 선택이 없으면 아무 것도 안 함
   * - removeSelected 성공 후 선택 Set 초기화
   */
  const onRemoveSelected = async () => {
    if (!isOnline) {
      Alert.alert('오프라인', '오프라인에서는 삭제할 수 없습니다.');
      return;
    }
    if (selectedIds.size === 0) return;

    setLocalLoading(true);
    await runWithLock('bulkDelete', async () => {
      try {
        await removeSelected(Array.from(selectedIds));
        setSelectedIds(new Set());
      } finally {
        setLocalLoading(false);
      }
    });
  };

  /**
   * 전체 삭제(장바구니 비우기)
   * - 오프라인이면 차단
   * - Alert로 한번 더 확인
   * - clearCart 성공 후 선택 Set 초기화
   */
  const onClear = () => {
    if (!isOnline) {
      Alert.alert('오프라인', '오프라인에서는 삭제할 수 없습니다.');
      return;
    }
    Alert.alert('장바구니 비우기', '전체 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setLocalLoading(true);
          await runWithLock('clear', async () => {
            try {
              await clearCart();
              setSelectedIds(new Set());
            } finally {
              setLocalLoading(false);
            }
          });
        },
      },
    ]);
  };

  /**
   * 주문하기(Checkout) 진입
   * - 오프라인이면 차단
   * - 중복 클릭 방지(orderLockRef)
   * - 로컬 총합과 서버 요약 금액이 다르면 재동기화
   * - 현재 uiItems의 가격 스냅샷(priceMap)을 만들어 validateBeforeCheckout에 전달
   * - 검증 통과 시 Checkout으로 이동
   * - 401: 로그인 화면 이동, 409: 품절/숨김/가격 변경 등으로 재로드 유도
   */
  const onCheckout = async () => {
    if (!isOnline) {
      Alert.alert('오프라인', '오프라인에서는 주문할 수 없습니다.');
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert('선택 상품 없음', '선택된 상품이 없습니다.');
      return;
    }
    if (orderLockRef.current) return;

    orderLockRef.current = true;
    try {
      const isPartialSelection = selectedItems.length !== uiItems.length;
      const localTotal = selectedItems.reduce(
        (sum, it) => sum + Number(it.price) * Number(it.quantity),
        0,
      );

      if (!isPartialSelection && Number(summary?.totalPrice || 0) !== localTotal) {
        Alert.alert('동기화 중', '장바구니 금액을 다시 확인합니다.');
        await loadCartFromServer();
        return;
      }

      const priceMap = selectedItems.reduce<Record<string, number>>((acc, it) => {
        acc[it.storeMenuId] = it.price;
        return acc;
      }, {});

      await validateBeforeCheckout(priceMap, Array.from(selectedIds));
      navigation.navigate('Checkout', { selectedIds: Array.from(selectedIds) });
    } catch (err: any) {
      if (err?.status === 401) {
        Alert.alert('로그인이 필요합니다', '다시 로그인해 주세요.');
        navigation.navigate('Login');
        return;
      }
      if (err?.status === 409 && err?.data?.items) {
        Alert.alert('주문 불가', '품절/숨김/가격 변경 항목이 있습니다.');
        await loadCartFromServer();
        return;
      }
      Alert.alert('오류', err?.message || '주문 검증 실패');
    } finally {
      orderLockRef.current = false;
    }
  };


  /**
   * FlatList에 실제로 넣는 rows 구성
   * - uiItems를 item row로 매핑
   * - 그 다음 addMenu row를 붙여 "테두리 박스의 마지막"을 만들고
   * - 마지막에 spacer row를 붙여 footer 높이만큼 아래 여백을 확보
   *   (spacer는 테두리 없이, footer에 가려지지 않게만 하는 목적)
   */
  const rows: Row[] = useMemo(() => {
    return [
      ...uiItems.map((it) => ({ type: 'item', item: it } as const)),
      { type: 'addMenu' } as const,
      { type: 'spacer' } as const, // 이건 테두리 없는 여백
    ];
  }, [uiItems]);

  /**
   * Row 렌더러
   * - boxRowBase/boxFirst/boxLast 스타일을 조합해서
   *   item + remember addMenu까지는 "하나의 테두리 박스"처럼 보이게 만든다.
   * - spacer는 height만 가진 View로 footer 가림을 해결한다.
   */
  const renderRow = ({ item, index }: { item: Row; index: number }) => {
    // 현재 row가 테두리 박스의 첫 번째인지 여부
    const isFirstBoxRow = index === 0;

    // spacer: footer 높이만큼 실제 스크롤 가능한 빈 공간을 추가
    if (item.type === 'spacer') {
      return <View style={{ height: footerH + 16 }} />;
    }

    // addMenu: 테두리 박스의 마지막 행 역할(하단 radius 적용)
    if (item.type === 'addMenu') {
      return (
        <TouchableOpacity
          style={[s.boxRowBase, isFirstBoxRow && s.boxFirst, s.boxLast]}
          onPress={() => navigation.goBack()}
        >
          <Text style={s.addMenuText}>+ 메뉴 추가</Text>
        </TouchableOpacity>
      );
    }

    // item: 실제 장바구니 아이템 행
    const cartItem = item.item;
    const isSoldOut = cartItem.menuStatus === 'SOLD_OUT' || cartItem.menuStatus === 'HIDDEN';

    return (
      <View style={[s.boxRowBase, isFirstBoxRow && s.boxFirst]}>
        <View style={s.cardTop}>
          <Checkbox.Android
            status={selectedIds.has(cartItem.storeMenuId) ? 'checked' : 'unchecked'}
            onPress={() => toggleSelectOne(cartItem.storeMenuId)}
            color="#009798"
            uncheckedColor="#999"
            rippleColor="transparent"
          />
        </View>

        <View style={s.cardContent}>
          <View style={s.cardBody}>
            <Text style={s.itemName}>{cartItem.name}</Text>
            <Text style={s.itemPrice}>
              가격: {cartItem.price.toLocaleString()}원 ({cartItem.amount})
            </Text>
            <Text style={s.totalItemPrice}>
              {(Number(cartItem.price) * Number(cartItem.quantity)).toLocaleString()}원
            </Text>

            <View style={s.qtyRow}>
              <TouchableOpacity
                style={[s.qtyBtn, isSoldOut && s.btnDisabled]}
                disabled={isSoldOut || !isOnline}
                onPress={() => changeQuantity(cartItem, -1)}
              >
                <Text style={s.qtyMinusText}>-</Text>
              </TouchableOpacity>

              <Text style={s.qtyText}>{cartItem.quantity}</Text>

              <TouchableOpacity
                style={[s.qtyBtn, isSoldOut && s.btnDisabled]}
                disabled={isSoldOut || !isOnline}
                onPress={() => changeQuantity(cartItem, 1)}
              >
                <Text style={s.qtyPlusText}>+</Text>
              </TouchableOpacity>

              {isSoldOut ? <Text style={s.badge}>품절</Text> : null}
            </View>
          </View>

          <Image source={{ uri: cartItem.image }} style={s.thumb} />
        </View>
      </View>
    );
  };

  /**
   * Row별 key 생성
   * - item: storeMenuId 기반 고유 key
   * - addMenu/spacer: 고정 key
   */
  const keyExtractor = (row: Row, index: number) => {
    if (row.type === 'item') return `item:${row.item.storeMenuId}`;
    if (row.type === 'addMenu') return 'addMenu';
    return 'spacer';
  };

  /**
   * 로딩/에러/빈 장바구니 분기 UI
   */
  if (loading || localLoading || !selectionReady) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
        <Text style={s.subText}>불러오는 중...</Text>
      </View>
    );
  }

  if (error && uiItems.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={loadCartFromServer}>
          <Text style={s.retryText}>재시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (uiItems.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.emptyText}>장바구니가 비어 있어요.</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={s.primaryBtnText}>메뉴 담으러 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * 최종 화면 레이아웃
   * - actionBar / divider / cacheNote / storeNameText 는 상단 고정
   * - FlatList가 본문 스크롤 담당
   * - footer는 absolute 고정이며, onLayout으로 높이를 측정해서 spacer row 높이에 반영
   */
  return (
    <View style={s.container}>
      <View style={s.actionBar}>
        <View style={s.selectAll}>
          <Checkbox.Android
            status={selectedIds.size === uiItems.length && uiItems.length > 0 ? 'checked' : 'unchecked'}
            onPress={toggleSelectAll}
            color="#009798"
            uncheckedColor="#999"
            rippleColor="transparent"
          />
          <Text style={s.selectAllText}>전체 선택</Text>
        </View>

        <TouchableOpacity style={[s.actionBtn, !isOnline && s.btnDisabled]} onPress={onRemoveSelected} disabled={!isOnline}>
          <Text style={s.actionBtnText}>선택 삭제</Text>
        </TouchableOpacity>
      </View>

      <View style={s.divider} />

      {fromCache ? <Text style={s.cacheNote}>오프라인 캐시 데이터를 표시 중입니다.</Text> : null}

      <Text style={s.storeNameText}>{summary?.storeName ?? 'N/A'}</Text>

      <FlatList
        style={{ flex: 1 }}
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        contentContainerStyle={s.listArea}
      />

      <View
        style={s.footer}
        onLayout={(e) => setFooterH(e.nativeEvent.layout.height)} // 실제 높이 측정
      >
        {!isMinOrderMet ? (
          <Text style={s.minOrderText}>최소 주문 금액은 {summary.minOrderAmount.toLocaleString()}원 입니다.</Text>
        ) : null}
        <View style={s.footerRow}>
          <Text style={s.footerLabel}>결제 예정 금액</Text>
          <Text style={s.footerPrice}>{selectedTotalPrice.toLocaleString()}원</Text>
        </View>
        <TouchableOpacity style={[s.orderBtn, isOrderDisabled && s.btnDisabled]} onPress={onCheckout} disabled={isOrderDisabled}>
          <Text style={s.orderBtnText}>주문하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  // 상단 액션 바(전체 선택 / 선택 삭제)
  actionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#fff' },
  selectAll: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  selectAllText: { fontSize: 13, fontWeight: '700', color: '#272727' },
  actionBtn: { paddingHorizontal: 3, paddingVertical: 6, backgroundColor: '#ffffff', borderRadius: 8 },
  actionBtnText: { fontSize: 12, color: '#272727', fontWeight: '600' },

  // 구분선 / 캐시 안내 / 가게명
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#a6a6a6' },
  cacheNote: { paddingHorizontal: 12, paddingBottom: 6, color: '#666' },
  storeNameText: { fontSize: 14, fontWeight: '700', padding: 16, color: '#111' },

  // FlatList contentContainerStyle: 리스트 좌우 바깥 여백(테두리 아님)
  listArea: { paddingHorizontal: 12, paddingBottom: 12 },

  /**
   * 테두리 "박스"를 row 단위로 이어붙이기 위한 기본 스타일
   * - item row들과 addMenu row에 적용
   * - borderLeft/right/bottom을 기본으로 두고,
   * - 첫 row에서만 borderTop + 상단 radius를 추가(boxFirst)
   * - addMenu row에서만 하단 radius를 추가(boxLast)
   */
  boxRowBase: {
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E2E2',
    padding: 5,
    paddingBottom: 20,
  },
  boxFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginTop: 0,
  },
  boxLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingBottom: 14,
    paddingTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // item row 내부 레이아웃
  cardTop: { alignItems: 'flex-start' },
  cardContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7 },
  cardBody: { flex: 1 },

  // 텍스트/가격
  itemName: { fontSize: 15, fontWeight: '700', color: '#111' },
  itemPrice: { fontSize: 12, color: '#a3a3a3', marginTop: 10, marginBottom: 3 },
  totalItemPrice: { marginTop: 4, color: '#111', fontWeight: '700' },

  // 수량 조절 영역
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  qtyMinusText: { fontSize: 20, fontWeight: '700' },
  qtyPlusText: { fontSize: 16, fontWeight: '700' },
  qtyText: { minWidth: 24, textAlign: 'center' },
  badge: { marginLeft: 8, color: '#ef4444', fontWeight: '700' },

  // 썸네일 이미지
  thumb: { width: 100, height: 100, borderRadius: 10, backgroundColor: '#eee' },

  // addMenu row 텍스트 스타일
  addMenuText: { color: '#009798', fontWeight: '700' },

  /**
   * footer 고정 영역
   * - position: absolute로 화면 하단 고정
   * - FlatList는 footer에 가려질 수 있으므로, spacer row로 높이만큼 여백을 확보
   * - onLayout으로 실제 footer 높이를 측정하여 spacer row에 반영
   */
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  footerRow: { paddingTop: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLabel: { color: '#111' },
  footerPrice: { fontSize: 18, fontWeight: '800' },
  minOrderText: { fontSize: 12,marginTop: 6, color: '#ef4444' },
  orderBtn: { marginTop: 12, backgroundColor: '#009798', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  orderBtnText: { color: '#fff', fontWeight: '700' },

  // 공통 상태 스타일들
  btnDisabled: { opacity: 0.4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  subText: { marginTop: 8, color: '#666' },
  emptyText: { color: '#111', fontSize: 16, marginBottom: 12 },
  primaryBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#111', borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  errorText: { color: '#ef4444', marginBottom: 10 },
  retryBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#111', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
});
