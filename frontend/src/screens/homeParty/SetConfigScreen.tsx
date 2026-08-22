import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../../navigation/StackNavigator';
import {
  buildHomePartySelectionStorageKey,
  type HomePartyMenu,
  type SelectedItem,
} from '../../types/homeParty';
import { fetchHomePartyMenusByIds } from '../../api/homeParty';

const mergeItems = (base: SelectedItem[], added: SelectedItem[]) => {
  const map = new Map<string, number>();
  base.forEach((item) => {
    map.set(String(item.hpMenuId), (map.get(String(item.hpMenuId)) || 0) + Number(item.quantity || 0));
  });
  added.forEach((item) => {
    map.set(String(item.hpMenuId), (map.get(String(item.hpMenuId)) || 0) + Number(item.quantity || 0));
  });
  return Array.from(map.entries())
    .filter(([, qty]) => qty > 0)
    .map(([hpMenuId, quantity]) => ({ hpMenuId, quantity }));
};

type Props = NativeStackScreenProps<RootStackParamList, 'SetConfig'>;
type MenuMap = Record<string, HomePartyMenu>;
type SelectedMap = Record<string, number>;

const buildSelectedMap = (items: SelectedItem[]): SelectedMap => {
  const map: SelectedMap = {};
  items.forEach((item) => {
    const key = String(item.hpMenuId);
    map[key] = (map[key] || 0) + Number(item.quantity || 0);
  });
  return map;
};

const buildItemsSignature = (items: SelectedItem[]) => {
  return items
    .map((item) => `${String(item.hpMenuId)}:${Number(item.quantity || 0)}`)
    .sort()
    .join('|');
};

const extractAddOnItems = (combined: SelectedItem[], base: SelectedItem[]) => {
  const baseMap = buildSelectedMap(base);
  return combined
    .map((item) => {
      const hpMenuId = String(item.hpMenuId);
      const qty = Number(item.quantity || 0);
      const baseQty = Number(baseMap[hpMenuId] || 0);
      return { hpMenuId, quantity: Math.max(0, qty - baseQty) };
    })
    .filter((item) => item.quantity > 0);
};

export default function SetConfigScreen({ navigation, route }: Props) {
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
    initialSelectedItems,
    existingSetConfig,
    userDisplayName,
  } = route.params;

  const baseItems = useMemo(() => {
    return mergeItems([], routeBaseItems || (mode === 'EDIT' ? existingSetConfig?.items || [] : []));
  }, [mode, routeBaseItems, existingSetConfig?.items]);

  const initialAddOnItems = useMemo(() => {
    return mergeItems([], routeAddOnItems || initialSelectedItems || []);
  }, [routeAddOnItems, initialSelectedItems]);

  const initialItems = useMemo(() => {
    return mergeItems(baseItems, initialAddOnItems);
  }, [baseItems, initialAddOnItems]);

  const [items, setItems] = useState<SelectedItem[]>(initialItems);
  const [menuMap, setMenuMap] = useState<MenuMap>({});
  const [loadingMenus, setLoadingMenus] = useState(false);
  const initialItemsSignature = useMemo(() => buildItemsSignature(initialItems), [initialItems]);
  const lastAppliedInitialSignatureRef = useRef(initialItemsSignature);
  const menuIdsKey = useMemo(() => {
    return Array.from(new Set(items.map((item) => String(item.hpMenuId))))
      .sort()
      .join(',');
  }, [items]);

  const menuSelectionStorageKey = useMemo(() => {
    return buildHomePartySelectionStorageKey({
      storeId,
      eventType,
      eventDateTime,
      mode,
    });
  }, [storeId, eventType, eventDateTime, mode]);

  const addOnItems = useMemo(() => {
    if (baseItems.length === 0) return items;
    // base를 제외한 추가 메뉴만 add-on으로 관리
    return extractAddOnItems(items, baseItems);
  }, [items, baseItems]);

  useEffect(() => {
    if (lastAppliedInitialSignatureRef.current === initialItemsSignature) return;
    lastAppliedInitialSignatureRef.current = initialItemsSignature;
    setItems(initialItems);
  }, [initialItemsSignature, initialItems]);

  useEffect(() => {
    AsyncStorage.setItem(menuSelectionStorageKey, JSON.stringify(buildSelectedMap(addOnItems))).catch((err) => {
      console.warn('failed to persist menu selection from set config', err);
    });
  }, [addOnItems, menuSelectionStorageKey]);

  const setTitle = useMemo(() => {
    if (mode === 'EDIT') {
      return existingSetConfig?.title || '세트 구성';
    }
    return `${userDisplayName}님의 세트 구성`;
  }, [mode, existingSetConfig?.title, userDisplayName]);

  useEffect(() => {
    const ids = menuIdsKey ? menuIdsKey.split(',') : [];
    if (ids.length === 0) {
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
      .finally(() => {
        if (!active) return;
        setLoadingMenus(false);
      });

    return () => {
      active = false;
    };
  }, [menuIdsKey]);

  const updateQuantity = (hpMenuId: string, delta: number) => {
    setItems((prev) => {
      const next = prev.map((item) => ({ ...item }));
      const idx = next.findIndex((item) => String(item.hpMenuId) === hpMenuId);
      if (idx === -1) return prev;
      const target = next[idx];
      const nextQty = Math.min(99, Math.max(1, target.quantity + delta));
      target.quantity = nextQty;
      return [...next];
    });
  };

  const removeItem = (hpMenuId: string) => {
    setItems((prev) => prev.filter((item) => String(item.hpMenuId) !== hpMenuId));
  };

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const menu = menuMap[String(item.hpMenuId)];
      if (!menu || menu.menuStatus !== 'ON_SALE') return sum;
      return sum + menu.price * item.quantity;
    }, 0);
  }, [items, menuMap]);

  const warningText = useMemo(() => {
    if (totalQuantity < headcount) {
      return '현재 구성은 1인분 정도 부족할 수 있어요.';
    }
    return '';
  }, [totalQuantity, headcount]);

  const goToMenuAdd = () => {
    const state = navigation.getState();
    const previousRoute = state.routes[state.index - 1];

    if (previousRoute?.name === 'HomePartyMenu') {
      navigation.goBack();
      return;
    }

    navigation.navigate('HomePartyMenu', {
      mode,
      storeId,
      eventType,
      eventDateTime,
      headcount,
      budgetMin,
      budgetMax,
      existingSetConfig: {
        setId: existingSetConfig?.setId,
        title: setTitle,
        items: mode === 'EDIT' ? baseItems : existingSetConfig?.items || [],
        recommendedMinHeadcount: existingSetConfig?.recommendedMinHeadcount,
        recommendedMaxHeadcount: existingSetConfig?.recommendedMaxHeadcount,
      },
      // 메뉴 추가 화면에서는 현재 구성 전체를 base로 고정하고 신규 추가만 받는다.
      baseItems: items,
      addOnItems: [],
      initialSelectedItems: [],
      userDisplayName,
    });
  };

  const goToCheckout = () => {
    if (items.length === 0) return;
    navigation.navigate('Payment', {
      mode,
      storeId,
      eventType,
      eventDateTime,
      headcount,
      budgetMin,
      budgetMax,
      selectedItems: items,
      setConfigTitle: setTitle,
      setId: existingSetConfig?.setId,
      recommendedMinHeadcount: existingSetConfig?.recommendedMinHeadcount,
      recommendedMaxHeadcount: existingSetConfig?.recommendedMaxHeadcount,
      userDisplayName,
    });
  };

  const eventDateDisplay = useMemo(() => {
    if (!eventDateTime) return '';
    const d = new Date(eventDateTime);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  }, [eventDateTime]);

  const budgetDisplay = useMemo(() => {
    const formatBudget = (value?: number) => {
      if (!value) return '미정';
      if (value >= 10000 && value % 10000 === 0) {
        return `${value / 10000}만원`;
      }
      return `${value.toLocaleString()}원`;
    };
    if (!budgetMin && !budgetMax) return '';
    return `${formatBudget(budgetMin)}~${formatBudget(budgetMax)}`;
  }, [budgetMin, budgetMax]);

  const servingRangeText = useMemo(() => {
    const min = existingSetConfig?.recommendedMinHeadcount;
    const max = existingSetConfig?.recommendedMaxHeadcount;
    if (Number.isFinite(min) && Number.isFinite(max) && min && max) {
      return `${min}~${max}인용`;
    }
    return `${Math.max(1, headcount - 1)}~${headcount + 2}인용`;
  }, [existingSetConfig?.recommendedMinHeadcount, existingSetConfig?.recommendedMaxHeadcount, headcount]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back-ios" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contextCard}>
          <Text style={styles.contextTitle}>{eventType}</Text>
          <View style={styles.contextRow}>
            <Icon name="event" size={20} color="#009798" />
            <Text style={styles.contextText}>{eventDateDisplay}</Text>
          </View>
          <View style={styles.contextRow}>
            <Icon name="people" size={20} color="#009798" />
            <Text style={styles.contextText}>{headcount}명</Text>
          </View>
          {budgetDisplay ? (
            <View style={styles.contextRow}>
              <Icon name="payments" size={18} color="#009798" />
              <Text style={styles.contextText}>{budgetDisplay}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.listCard}>
          <View style={styles.setHeader}>
            <Text style={styles.setTitle}>{setTitle}</Text>
            <Text style={styles.setMeta}>{servingRangeText}</Text>
          </View>

          {loadingMenus ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator />
            </View>
          ) : (
            items.map((item) => {
              const menu = menuMap[String(item.hpMenuId)];
              return (
                <View key={String(item.hpMenuId)}>
                  <View style={styles.itemRow}>
                    {menu?.imageUrl ? (
                      <Image source={{ uri: menu.imageUrl }} style={styles.itemImage} />
                    ) : (
                      <View style={[styles.itemImage, styles.itemImagePlaceholder]} />
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{menu?.menuName || '메뉴 정보 없음'}{menu?.amount ? ` (${menu.amount})` : ''}</Text>
                      <Text style={styles.itemMeta}>
                        {menu ? menu.price.toLocaleString() : '-'}원
                      </Text>
                    </View>
                    <View style={styles.itemControlColumn}>
                      <TouchableOpacity onPress={() => removeItem(String(item.hpMenuId))} style={styles.deleteButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.deleteText}>삭제</Text>
                      </TouchableOpacity>
                      <View style={styles.stepper}>
                        <TouchableOpacity onPress={() => updateQuantity(String(item.hpMenuId), -1)} style={styles.stepperButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                          <Text style={[styles.stepperText, styles.stepperMinus]}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => updateQuantity(String(item.hpMenuId), 1)} style={styles.stepperButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                          <Text style={styles.stepperText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  <View style={styles.itemDivider} />
                </View>
              );
            })
          )}

          <TouchableOpacity onPress={goToMenuAdd} style={styles.addMenuButton}>
            <Icon name="add" size={16} color="#4F9B99" />
            <Text style={styles.addMenuButtonText}>메뉴 추가</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.totalLabel}>총 금액</Text>
          <Text style={styles.totalValue}>{totalAmount.toLocaleString()}원</Text>
        </View>
        <TouchableOpacity
          style={[styles.ctaButton, items.length === 0 && styles.ctaButtonDisabled]}
          onPress={goToCheckout}
          disabled={items.length === 0}
        >
          <Text style={styles.ctaText}>예약/결제로 이동</Text>
        </TouchableOpacity>
      </View>
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
    paddingLeft: moderateScale(12),
  },
  backButton: {
    paddingRight: moderateScale(6),
  },
  content: {
    paddingHorizontal: moderateScale(12),
    paddingBottom: moderateScale(160),
  },
  contextCard: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(12),
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  contextTitle: {
    fontSize: moderateScale(15),
    fontWeight: '500',
    marginBottom: moderateScale(12),
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  contextText: {
    marginLeft: moderateScale(8),
    fontSize: moderateScale(14),
    color: '#333333',
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    elevation: 1,
  },
  setHeader: {
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderColor: '#E4E4E4',
  },
  setTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  setMeta: {
    fontSize: moderateScale(14),
    color: '#777777',
    marginTop: moderateScale(3),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    marginVertical: moderateScale(6),
  },
  itemImage: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(10),
    backgroundColor: '#eeeeee',
  },
  itemImagePlaceholder: {
    backgroundColor: '#f2f2f2',
  },
  itemInfo: {
    flex: 1,
    marginLeft: moderateScale(10),
    alignSelf: 'flex-start',
    paddingTop: moderateScale(6),
  },
  itemName: {
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: moderateScale(13),
    color: '#777777',
    fontWeight: '600',
    marginTop: moderateScale(4),
  },
  itemControlColumn: {
    justifyContent: 'space-between',
    minHeight: moderateScale(70),
  },
  stepper: {
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
  stepperMinus: {
    fontSize: moderateScale(20),
    marginBottom: moderateScale(2),
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
    color: '#E26B2C',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#a6a6a6',
  },
  loadingBox: {
    paddingVertical: moderateScale(20),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: moderateScale(12),
    color: '#888888',
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    alignSelf: 'center',
  },
  addMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(40),
  },
  addMenuButtonText: {
    marginLeft: moderateScale(4),
    color: '#4F9B99',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
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
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    fontSize: moderateScale(11),
    color: '#E26B2C',
    marginBottom: moderateScale(8),
    marginLeft: moderateScale(4),
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  totalLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  totalValue: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#009798',
  },
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
