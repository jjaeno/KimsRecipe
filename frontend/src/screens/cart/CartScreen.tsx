import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';

export default function CartScreen() {
  const { cartItems, loadCartFromServer, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const {selectedStoreId} = useStore();
  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadCartFromServer();
      setLoading(false);
      console.log('로컬 카트 아이템: ',cartItems)
    })();
  }, []);

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0),
    [cartItems]
  );

  const onRemove = async (storeMenuId: string) => {
    setLoading(true);
    await removeFromCart(storeMenuId);
    setLoading(false);
  };

  const onClear = () => {
    Alert.alert('장바구니 비우기', '전부 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { setLoading(true); await clearCart(); setLoading(false); } },
    ]);
  };

  const renderItem = ({ item }: any) => (
    <View style={s.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.itemName}>{item.name}</Text>
        <Text style={s.itemSubGray}>{`storeId: ${item.storeId}  /  menuId: ${item.storeMenuId} / 수량: ${item.quantity}`}</Text>
      </View>
      <TouchableOpacity style={s.removeBtn} onPress={() => onRemove(item.storeMenuId)}>
        <Text style={s.removeText}>삭제</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.title}>장바구니</Text>
        <TouchableOpacity onPress={onClear} style={s.clearBtn}>
          <Text style={s.clearText}>전체 삭제</Text>
        </TouchableOpacity>
      </View>

      {/* 로딩 */}
      {loading && (
        <View style={s.loading}>
          <ActivityIndicator />
          <Text style={{ marginTop: 6 }}>동기화 중…</Text>
        </View>
      )}

      {/* 목록 */}
      <FlatList
        data={cartItems}
        keyExtractor={(it) => `${it.storeMenuId}`}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        ListEmptyComponent={!loading ? <Text style={s.empty}>장바구니가 비어 있어요.</Text> : null}
      />
      <View>
        <Text>로컬 호점 정보: {selectedStoreId}</Text>
      </View>

      {/* 푸터 */}
      <View style={s.footer}>
        <Text style={s.total}>합계: ₩{totalPrice.toLocaleString()}</Text>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: '#222' }]}
          onPress={async () => { setLoading(true); await loadCartFromServer(); setLoading(false); }}
        >
          <Text style={[s.addText, { color: '#fff' }]}>서버 재동기화</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#eee',
  },
  title: { fontSize: 20, fontWeight: '700' },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fee2e2', borderRadius: 8 },
  clearText: { color: '#b91c1c', fontWeight: '600' },

  loading: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  empty: { textAlign: 'center', color: '#666', marginTop: 24 },

  itemRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff'
  },
  itemName: { fontSize: 16, fontWeight: '700' },
  itemSub: { marginTop: 2, color: '#111' },
  itemSubGray: { marginTop: 2, color: '#6b7280', fontSize: 12 },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 8, marginLeft: 8 },
  removeText: { color: '#111', fontWeight: '600' },

  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#eee', gap: 12 },
  total: { fontSize: 18, fontWeight: '800' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#111827', borderRadius: 10 },
  addText: { color: '#fff', fontWeight: '700' },
});
