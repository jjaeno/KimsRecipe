import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useWishList } from '../../context/WishListContext';
import { useCart } from '../../context/CartContext';
import { useStore } from '../../context/StoreContext';
import type { WishlistItem } from '../../types/wishlist';
import { moderateScale } from 'react-native-size-matters';

const WishListScreen: React.FC = () => {
  const { wishlistItems, loading, error, loadWishlist, toggleWishlist } = useWishList();
  const { addToCart } = useCart();
  const { selectedStoreId } = useStore();
  const filteredItems = wishlistItems.filter(
    (it) => String(it.storeId) === String(selectedStoreId)
  );
  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [loadWishlist]),
  );

  const resolveMenuStatus = (value: string | null | undefined): 'ON_SALE' | 'SOLD_OUT' | 'HIDDEN' => {
    if (value === 'SOLD_OUT' || value === 'HIDDEN') return value;
    return 'ON_SALE';
  };

  const handleAddToCart = async (item: WishlistItem) => {
    const ok = await addToCart({
      storeMenuId: String(item.storeMenuId),
      name: item.menuName,
      description: '',
      price: Number(item.price),
      image: item.imageUrl ?? '',
      amount: item.amount ?? '',
      menuStatus: resolveMenuStatus(item.menuStatus),
      quantity: 1,
      storeId: String(selectedStoreId),
    });

    if (!ok) {
      Alert.alert('추가 실패', '장바구니에 담지 못했습니다.');
    } else {
      Alert.alert('담기 완료', '장바구니에 담았습니다.');
    }
  };

  const remove = (storeMenuId: string | number) => toggleWishlist(storeMenuId);

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <View style={s.card}>
      <TouchableOpacity style={s.heartBtn} onPress={() => remove(item.storeMenuId)}>
        <Icon name="favorite" size={25} color="#E74C3C" />
      </TouchableOpacity>
      <View style={s.bodyRow}>
        <Image source={{ uri: item.imageUrl ?? '' }} style={s.thumb} resizeMode="cover" />
        <View style={s.textArea}>
          <Text style={s.menuName}>
            {`${item.menuName}${item.amount ? ' (' + item.amount + ')' : ''}`}
          </Text>
          <Text style={s.price}>{`${Number(item.price).toLocaleString()}원`}</Text>
          <TouchableOpacity style={s.cartBtn} onPress={() => handleAddToCart(item)}>
            <Text style={s.cartBtnText}>장바구니 담기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>찜</Text>
        <View style={s.headerIcons}>
          <Icon name="search" size={22} color="#FFFFFF" />
          <View style={s.iconGap} />
          <Icon name="shopping-cart" size={22} color="#FFFFFF" />
        </View>
      </View>
      <View style={s.countLine}>
        <Text style={s.countText}>{`총 ${filteredItems.length}개`}</Text>
      </View>
      <View style={s.divider} />
      {loading && filteredItems.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator />
          <Text style={s.subText}>불러오는 중...</Text>
        </View>
      ) : error && filteredItems.length === 0 ? (
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyText}>찜한 메뉴가 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => `wish:${item.storeMenuId}`}
          renderItem={renderItem}
          contentContainerStyle={s.list}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 56,
    backgroundColor: '#009798',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconGap: { width: 16 },
  countLine: { padding: 12 },
  countText: { fontSize: 13, color: '#333333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E5E5E5', marginBottom: 4 },
  list: { paddingBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  heartBtn: { position: 'absolute', top: 16, left: 16 },
  bodyRow: { flexDirection: 'row', marginTop: moderateScale(35) },
  textArea: { flex: 1, marginLeft: moderateScale(10) },
  menuName: { fontSize: 14, color: '#222222' },
  price: { fontSize: 16, fontWeight: '700', marginTop: 6, marginBottom: 6 },
  cartBtn: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: '#009798',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  cartBtnText: { color: '#FFFFFF', fontSize: 13 },
  thumb: { width: 100, height: 100, borderRadius: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  subText: { marginTop: 8, color: '#666' },
  emptyText: { color: '#666' },
  errorText: { color: '#ef4444' },
});

export default WishListScreen;
