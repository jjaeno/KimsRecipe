// 홈파티 메뉴 화면
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchHomePartyCategories, fetchHomePartyMenus } from '../../api/homeParty';
import type { RootStackParamList } from '../../navigation/StackNavigator';
import {
  buildHomePartySelectionStorageKey,
  type HomePartyCategory,
  type HomePartyMenu,
  type SelectedItem,
} from '../../types/homeParty';

const buildSelectedMap = (items?: SelectedItem[]) => {
  const map: Record<string, number> = {};
  (items || []).forEach((item) => {
    const key = String(item.hpMenuId);
    map[key] = (map[key] || 0) + Number(item.quantity || 0);
  });
  return map;
};

const mapToItems = (itemsMap: Record<string, number>): SelectedItem[] => {
  return Object.entries(itemsMap)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([hpMenuId, quantity]) => ({ hpMenuId, quantity: Number(quantity) }));
};

type Props = NativeStackScreenProps<RootStackParamList, 'HomePartyMenu'>;

type MenuMap = Record<string, HomePartyMenu>;
type SelectionState = {
  baseItems: Record<string, number>;
  addOnItems: Record<string, number>;
};

export default function HomePartyMenuScreen({ navigation, route }: Props) {
  const {
    mode,
    storeId,
    eventType,
    eventDateTime,
    headcount,
    budgetMin,
    budgetMax,
    baseItems: routeBaseItems,
    addOnItems: routeAddOnItems,
    existingSetConfig,
    initialSelectedItems,
    userDisplayName,
  } = route.params;

  const baseItemsMap = useMemo(() => {
    return buildSelectedMap(routeBaseItems || existingSetConfig?.items || []);
  }, [routeBaseItems, existingSetConfig?.items]);

  const initialAddOnMap = useMemo(() => {
    return buildSelectedMap(routeAddOnItems || initialSelectedItems);
  }, [routeAddOnItems, initialSelectedItems]);

  const [categories, setCategories] = useState<HomePartyCategory[]>([]);
  const [menus, setMenus] = useState<HomePartyMenu[]>([]);
  const [menuMap, setMenuMap] = useState<MenuMap>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('ALL');
  const [selectionState, setSelectionState] = useState<SelectionState>(() => {
    return {
      baseItems: baseItemsMap,
      addOnItems: initialAddOnMap,
    };
  });
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [hasShownFirstAddModal, setHasShownFirstAddModal] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'AUTO' | 'CONFIRM'>('CONFIRM');
  const [confirmItems, setConfirmItems] = useState<Record<string, number>>({});
  const [selectionHydrated, setSelectionHydrated] = useState(false);

  const menuSelectionStorageKey = useMemo(() => {
    return buildHomePartySelectionStorageKey({
      storeId,
      eventType,
      eventDateTime,
      mode,
    });
  }, [storeId, eventType, eventDateTime, mode]);

  useEffect(() => {
    setSelectionState({
      baseItems: baseItemsMap,
      addOnItems: initialAddOnMap,
    });
  }, [baseItemsMap, initialAddOnMap]);

  useEffect(() => {
    let active = true;
    setSelectionHydrated(false);
    const restoreSelectedItems = async () => {
      try {
        const raw = await AsyncStorage.getItem(menuSelectionStorageKey);
        if (!active || !raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // 이전 버전 데이터 호환: base 메뉴는 add-on에서 제거
          const nextAddOnItems = Object.entries(parsed as Record<string, number>).reduce<Record<string, number>>(
            (acc, [hpMenuId, qty]) => {
              const normalizedQty = Number(qty || 0);
              if (baseItemsMap[hpMenuId] || normalizedQty <= 0) return acc;
              acc[hpMenuId] = normalizedQty;
              return acc;
            },
            {},
          );
          setSelectionState((prev) => ({
            ...prev,
            addOnItems: nextAddOnItems,
          }));
        }
      } catch (err) {
        console.warn('failed to restore menu selection', err);
      } finally {
        if (active) setSelectionHydrated(true);
      }
    };
    restoreSelectedItems();
    return () => {
      active = false;
    };
  }, [menuSelectionStorageKey, baseItemsMap]);

  useEffect(() => {
    if (!selectionHydrated) return;
    AsyncStorage.setItem(menuSelectionStorageKey, JSON.stringify(selectionState.addOnItems)).catch((err) => {
      console.warn('failed to persist menu selection', err);
    });
  }, [menuSelectionStorageKey, selectionState.addOnItems, selectionHydrated]);

  useEffect(() => {
    let active = true;
    setError(null);
    setLoadingCategories(true);
    fetchHomePartyCategories({ storeId })
      .then((data) => {
        if (!active) return;
        setError(null);
        setCategories([{ hpCategoryId: 'ALL', categoryName: '전체 메뉴' } as HomePartyCategory, ...data]);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || '카테고리를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!active) return;
        setLoadingCategories(false);
      });
    return () => {
      active = false;
    };
  }, [storeId]);

  useEffect(() => {
    if (!selectedCategoryId) return;
    let active = true;
    setError(null);
    setMenus([]);
    setLoadingMenus(true);
    const params = selectedCategoryId === 'ALL'
      ? { storeId }
      : { storeId, hpCategoryId: selectedCategoryId };
    fetchHomePartyMenus(params)
      .then((data) => {
        if (!active) return;
        setError(null);
        setMenus(data);
        setMenuMap((prev) => {
          const next = { ...prev };
          data.forEach((menu) => {
            next[String(menu.hpMenuId)] = menu;
          });
          return next;
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || '메뉴를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!active) return;
        setLoadingMenus(false);
      });
    return () => {
      active = false;
    };
  }, [storeId, selectedCategoryId]);

  const totalSelected = useMemo(() => {
    return Object.values(selectionState.addOnItems).reduce((sum, qty) => sum + qty, 0);
  }, [selectionState.addOnItems]);

  const totalAmount = useMemo(() => {
    return Object.entries(selectionState.addOnItems).reduce((sum, [hpMenuId, qty]) => {
      const menu = menuMap[hpMenuId];
      if (!menu || menu.menuStatus !== 'ON_SALE') return sum;
      return sum + menu.price * qty;
    }, 0);
  }, [selectionState.addOnItems, menuMap]);

  const openConfirmModal = (modeOverride?: 'AUTO' | 'CONFIRM') => {
    setModalMode(modeOverride || 'CONFIRM');
    setConfirmItems({ ...selectionState.addOnItems });
    setConfirmModalVisible(true);
  };

  const closeConfirmModal = () => {
    // Persist quantity/delete changes made in modal when user dismisses it.
    setSelectionState((prev) => ({ ...prev, addOnItems: { ...confirmItems } }));
    setConfirmModalVisible(false);
  };

  const updateConfirmQty = (hpMenuId: string, delta: number) => {
    setConfirmItems((prev) => {
      const next = { ...prev };
      const current = next[hpMenuId] || 1;
      const nextValue = Math.min(99, Math.max(1, current + delta));
      next[hpMenuId] = nextValue;
      return next;
    });
  };

  const removeConfirmItem = (hpMenuId: string) => {
    setConfirmItems((prev) => {
      const next = { ...prev };
      delete next[hpMenuId];
      return next;
    });
  };

  const goToSetConfig = (finalItems: Record<string, number>) => {
    const selectedArray = mapToItems(finalItems);
    const baseItems = mapToItems(selectionState.baseItems);

    const setConfigParams = mode === 'CREATE'
      ? {
          mode: 'CREATE' as const,
          storeId,
          eventType,
          eventDateTime,
          headcount,
          budgetMin,
          budgetMax,
          baseItems,
          addOnItems: selectedArray,
          initialSelectedItems: selectedArray,
          userDisplayName,
        }
      : {
          mode: 'EDIT' as const,
          storeId,
          eventType,
          eventDateTime,
          headcount,
          budgetMin,
          budgetMax,
          existingSetConfig: existingSetConfig
            ? {
                setId: existingSetConfig.setId,
                title: existingSetConfig.title,
                items: baseItems,
                recommendedMinHeadcount: existingSetConfig.recommendedMinHeadcount,
                recommendedMaxHeadcount: existingSetConfig.recommendedMaxHeadcount,
              }
            : { items: [] },
          baseItems,
          addOnItems: selectedArray,
          initialSelectedItems: selectedArray,
          userDisplayName,
        };

    // 이전 SetConfig/HomePartyMenu 스택을 버리고 새 SetConfig만 유지
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Tab' },
        { name: 'SetConfig', params: setConfigParams },
      ],
    });
  };

  const finalizeAndGo = () => {
    setSelectionState((prev) => ({ ...prev, addOnItems: { ...confirmItems } }));
    setConfirmModalVisible(false);
    if (modalMode === 'CONFIRM') {
      goToSetConfig(confirmItems);
    }
  };

  const renderCategory = ({ item }: { item: HomePartyCategory }) => {
    const isSelected = String(item.hpCategoryId) === String(selectedCategoryId);
    return (
      <TouchableOpacity
        style={styles.categoryTab}
        onPress={() => setSelectedCategoryId(String(item.hpCategoryId))}
      >
        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>{item.categoryName}</Text>
        {isSelected ? <View style={styles.categoryUnderline} /> : <View style={styles.categoryUnderlineGhost} />}
      </TouchableOpacity>
    );
  };

  const renderMenu = ({ item }: { item: HomePartyMenu }) => {
    const hpMenuId = String(item.hpMenuId);
    const isBaseIncluded = Boolean(selectionState.baseItems[hpMenuId]);
    const isSelected = Boolean(selectionState.addOnItems[hpMenuId]);
    const isSoldOut = item.menuStatus === 'SOLD_OUT';
    const canAdd = !isBaseIncluded && !isSelected && !isSoldOut;

    return (
      <View>
        <View style={styles.divider}/>
        <View style={styles.menuRow}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
          ) : (
            <View style={[styles.menuImage, styles.menuImagePlaceholder]} />
          )}
          <View style={styles.menuInfo}>
            <Text style={styles.menuName}>{item.menuName}{item.amount ? ` (${item.amount})` : ''}</Text>
            <Text style={styles.menuMeta}>{item.price.toLocaleString()}원</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.addButton,
              !canAdd && styles.addButtonDisabled,
              isSelected && styles.addButtonSelected,
            ]}
            disabled={!canAdd}
            onPress={() => {
              if (!canAdd) return;
              const nextSelected = {
                ...selectionState.addOnItems,
                [hpMenuId]: (selectionState.addOnItems[hpMenuId] || 0) + 1,
              };
              setSelectionState((prev) => ({ ...prev, addOnItems: nextSelected }));
              if (!hasShownFirstAddModal) {
                setHasShownFirstAddModal(true);
                setConfirmItems(nextSelected);
                setModalMode('AUTO');
                setConfirmModalVisible(true);
              }
            }}
          >
            <Text style={styles.addButtonText}>
              {isSoldOut ? '품절' : isBaseIncluded ? '담김' : isSelected ? '담김' : '+담기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderConfirmItem = ({ item }: { item: [string, number] }) => {
    const hpMenuId = item[0];
    const qty = item[1];
    const menu = menuMap[hpMenuId];
    return (
      <View>
        <View style={styles.confirmRow}>
          {menu?.imageUrl ? (
            <Image source={{ uri: menu.imageUrl }} style={styles.confirmImage} />
          ) : (
            <View style={[styles.confirmImage, styles.menuImagePlaceholder]} />
          )}
          <View style={styles.confirmInfo}>
            <Text style={styles.confirmName}>{menu?.menuName || '메뉴 정보 없음'}{menu?.amount ? ` (${menu.amount})` : ''}</Text>
            <Text style={styles.confirmMeta}>{menu ? menu.price.toLocaleString() : '-'}원</Text>
          </View>
          
          <View style={{justifyContent: 'space-between'}}>
            <TouchableOpacity onPress={() => removeConfirmItem(hpMenuId)} style={styles.deleteButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
            <View style={styles.confirmStepper}>
              <TouchableOpacity onPress={() => updateConfirmQty(hpMenuId, -1)} style={styles.stepperButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={[styles.stepperText, {fontSize: moderateScale(20), marginBottom: moderateScale(2)}]}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{qty}</Text>
              <TouchableOpacity onPress={() => updateConfirmQty(hpMenuId, 1)} style={styles.stepperButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.divider} />
      </View>
    );
  };

  const filteredMenus = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return menus;
    return menus.filter((menu) => {
      const name = menu.menuName?.toLowerCase() || '';
      const amount = menu.amount?.toLowerCase() || '';
      return name.includes(keyword) || amount.includes(keyword);
    });
  }, [menus, query]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-ios" size={18} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerSearch}>
          <Icon name="search" size={20} color="#009798" />
          <TextInput
            style={styles.headerSearchInput}
            placeholder="메뉴 검색..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      {loadingCategories ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.categoryList}>
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.hpCategoryId)}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderCategory}
            />
          </View>
          {Object.keys(selectionState.baseItems).length > 0 ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>현재 구성</Text>
              <Text style={styles.summaryText}>
                {Object.keys(selectionState.baseItems).length}개 메뉴가 유지됩니다. 추가할 메뉴를 선택해주세요.
              </Text>
            </View>
          ) : null}
          {loadingMenus ? (
            <View style={styles.centered}>
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              data={filteredMenus}
              keyExtractor={(item) => String(item.hpMenuId)}
              renderItem={renderMenu}
              contentContainerStyle={styles.menuList}
            />
          )}
        </>
      )}

      <View style={styles.footer}>
        <View style={styles.footerTopRow}>
          <Text style={styles.footerCount}>{totalSelected}개 담김</Text>
          <TouchableOpacity onPress={() => openConfirmModal('CONFIRM')}>
            <Text style={styles.footerLink}>담은 메뉴 보기 &gt;</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.totalLabel}>총액</Text>
          <Text style={styles.totalValue}>{totalAmount.toLocaleString()}원</Text>
        </View>
        <TouchableOpacity
          style={[styles.footerButton, totalSelected === 0 && styles.footerButtonDisabled]}
          onPress={() => openConfirmModal('CONFIRM')}
          disabled={totalSelected === 0}
        >
          <Text style={styles.footerButtonText}>선택한 메뉴 추가하기</Text>
        </TouchableOpacity>
      </View>

      <Modal
        isVisible={confirmModalVisible}
        onBackdropPress={closeConfirmModal}
        onBackButtonPress={closeConfirmModal}
        backdropOpacity={0.4}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriver
        style={styles.modalContainer}
      >
        <View style={styles.confirmSheet}>
          <FlatList
            style={{marginHorizontal: -moderateScale(16)}}
            data={Object.entries(confirmItems)}
            keyExtractor={(item) => item[0]}
            renderItem={renderConfirmItem}
            contentContainerStyle={[styles.confirmList, {paddingHorizontal: moderateScale(16)}]}
          />
          <View style={styles.confirmTotalRow}>
            <Text style={styles.totalLabel}>총액</Text>
            <Text style={styles.totalValue}>
              {Object.entries(confirmItems)
                .reduce((sum, [hpMenuId, qty]) => {
                  const menu = menuMap[hpMenuId];
                  if (!menu || menu.menuStatus !== 'ON_SALE') return sum;
                  return sum + menu.price * qty;
                }, 0)
                .toLocaleString()}원
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.footerButton, Object.keys(confirmItems).length === 0 && styles.footerButtonDisabled]}
            disabled={Object.keys(confirmItems).length === 0}
            onPress={finalizeAndGo}
          >
            <Text style={styles.footerButtonText}>{modalMode === 'AUTO' ? '확인' : '선택한 메뉴 추가하기'}</Text>
          </TouchableOpacity>
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
  header: {
    height: moderateScale(56),
    backgroundColor: '#009798',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
  },
  backButton: {
    marginRight: moderateScale(8),
  },
  headerSearch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    height: moderateScale(40),
    borderRadius: moderateScale(8),
    backgroundColor: '#ffffff',
  },
  headerSearchInput: {
    marginLeft: moderateScale(6),
    color: '#333333',
    flex: 1,
  },
  categoryList: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
  },
  categoryTab: {
    marginTop: moderateScale(10),
    marginRight: moderateScale(26),
    alignItems: 'center',
    
  },
  categoryText: {
    fontSize: moderateScale(13),
    color: '#9c9c9c',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#009798',
    fontWeight: '700',
  },
  categoryUnderline: {
    marginTop: moderateScale(3),
    width: '110%',
    height: moderateScale(1.5),
    backgroundColor: '#009798',
    borderRadius: moderateScale(2),
  },
  categoryUnderlineGhost: {
    marginTop: moderateScale(6),
    width: '100%',
    height: moderateScale(2),
    backgroundColor: 'transparent',
  },
  summaryBox: {
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(8),
    padding: moderateScale(12),
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(10),
  },
  summaryTitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#009798',
    marginBottom: moderateScale(4),
  },
  summaryText: {
    fontSize: moderateScale(12),
    color: '#444444',
  },
  menuList: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(140),
  },
  divider: { 
    height: StyleSheet.hairlineWidth, 
    backgroundColor: '#a6a6a6',
    marginHorizontal: moderateScale(-16),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: moderateScale(12),
    marginVertical: moderateScale(8),
  },
  menuImage: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(12),
    backgroundColor: '#eeeeee',
  },
  menuImagePlaceholder: {
    backgroundColor: '#f2f2f2',
  },
  menuInfo: {
    flex: 1,
    marginLeft: moderateScale(12),
    paddingTop: moderateScale(6),
  },
  menuName: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#000',
  },
  menuMeta: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#727272',
    marginTop: moderateScale(4),
  },
  addButton: {
    minWidth: moderateScale(80),
    height: moderateScale(30),
    borderRadius: moderateScale(6),
    backgroundColor: '#009798',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(10),
    alignSelf: 'flex-end',
  },
  addButtonDisabled: {
    backgroundColor: '#c5c5c5',
  },
  addButtonSelected: {
    backgroundColor: '#c5c5c5',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(13),


    
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
    paddingTop: moderateScale(13),
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  footerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  footerCount: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#222222',
  },
  footerLink: {
    fontSize: moderateScale(13),
    color: '#009798',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(14),
  },
  totalLabel: {
    fontSize: moderateScale(14),
    color: '#555555',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#009798',
  },
  footerButton: {
    height: moderateScale(48),
    backgroundColor: '#009798',
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonDisabled: {
    backgroundColor: '#c5c5c5',
  },
  footerButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
  },
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  confirmSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(16),
    maxHeight: '60%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  modalTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#222222',
  },
  confirmList: {
    paddingBottom: moderateScale(16),
  },
  confirmRow: {
    flexDirection: 'row',
    paddingVertical: moderateScale(10),
    marginVertical: moderateScale(6),
  },
  confirmImage: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(10),
    backgroundColor: '#eeeeee',
  },
  confirmInfo: {
    flex: 1,
    alignSelf: 'flex-start',
    paddingTop: moderateScale(6),
    marginLeft: moderateScale(10),
  },
  confirmName: {
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  confirmMeta: {
    fontSize: moderateScale(13),
    color: '#777777',
    fontWeight: '600',
    marginTop: moderateScale(4),
  },
  confirmStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#727272',
    borderRadius: moderateScale(5),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(1),
    marginLeft: moderateScale(6),
    gap: moderateScale(18), 
  },
  stepperButton: {
    paddingHorizontal: moderateScale(6),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  stepperText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#333333',
  },
  stepperValue: {
    minWidth: moderateScale(18),
    textAlign: 'center',
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#333333',
  },
  deleteButton: {
    marginLeft: moderateScale(6),
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  deleteText: {
    fontSize: moderateScale(12),
    color: '#E26B2C',
    fontWeight: '600',
  },
  confirmTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  emptyText: {
    fontSize: moderateScale(12),
    color: '#888888',
    textAlign: 'center',
    paddingVertical: moderateScale(20),
  },
});
