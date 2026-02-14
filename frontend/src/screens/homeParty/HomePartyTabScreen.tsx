// 홈파티 메인 화면
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView, FlatList, Image } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fetchRecommendedSet } from '../../api/homeParty';
import type { RecommendedSet } from '../../api/homeParty';
import type { TabParamList } from '../../navigation/TabNavigator';
import type { RootStackParamList } from '../../navigation/StackNavigator';
import { useStore } from '../../context/StoreContext';

// 행사 정보 타입
type EventInfo = {
  eventType: string;
  headcount: number;
  eventDateTime: string;
};
// 화면 Props 타입
type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'HomeParty'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STORAGE_KEY = 'homePartyEventInfo';

export default function HomePartyTabScreen({ navigation }: Props) {
  const { selectedStoreId } = useStore();
  const storeId = String(Number(selectedStoreId) || 1);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [setData, setSetData] = useState<RecommendedSet[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userDisplayName = '김재노';

  useEffect(() => {
    const loadEventInfo = async () => {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) {
        setEventInfo(null);
        setSetData(null);
        return;
      }
      try {
        const info = JSON.parse(json) as EventInfo;
        setEventInfo(info);
      } catch {
        setEventInfo(null);
        setSetData(null);
      }
    };
    loadEventInfo();
    const unsubscribe = navigation.addListener('focus', loadEventInfo);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!eventInfo) return;
    setLoading(true);
    setError(null);
    setSetData(null);

    // 추천 세트 불러오기
    fetchRecommendedSet({
      storeId: Number(storeId),
      eventType: eventInfo.eventType,
      headcount: eventInfo.headcount,
    })
      .then((sets) => {
        setSetData(sets);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventInfo, selectedStoreId]);
  
  const renderSetCard = ({item}: {item: RecommendedSet}) => {
    const thumbnail = item.imageUrl; // 세트 썸네일 이미지 URL
    return (
      <View style={styles.setCard}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.setCardImage} />
        ) : (
          <View style={[styles.setCardImage, styles.setCardPlaceholder]} />
        )}
        <View style={{paddingHorizontal: moderateScale(6), paddingBottom: moderateScale(12)}}>
          <Text style={styles.setCardTitle}>{item.setName}</Text>
          <Text style={styles.setCardSub}>
            {item.recommendedMinHeadcount}~{item.recommendedMaxHeadcount}인용
          </Text>
          <Text style={styles.setCardPrice}>{item.basePrice.toLocaleString()}원</Text>
          <TouchableOpacity
            style={styles.setCardButton}
            onPress={() => {
              if (!eventInfo) return;
              navigation.navigate('SetConfig', {
                mode: 'EDIT',
                storeId,
                eventType: eventInfo.eventType,
                eventDateTime: eventInfo.eventDateTime,
                headcount: eventInfo.headcount,
                existingSetConfig: {
                  setId: item.setId,
                  title: item.setName,
                  recommendedMinHeadcount: item.recommendedMinHeadcount,
                  recommendedMaxHeadcount: item.recommendedMaxHeadcount,
                  items: (item.items || []).map((setItem) => ({
                    hpMenuId: String(setItem.hpMenuId),
                    quantity: Number(setItem.quantity) || 1,
                  })),
                },
                userDisplayName,
              });
            }}
          >
            <Text style={styles.setCardButtonText}>세트 구성 보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const eventDateDisplay = useMemo(() => {
    if (!eventInfo?.eventDateTime) return '';
    const d = new Date(eventInfo.eventDateTime);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const w = days[d.getDay()];
    return `${y}년 ${m}월 ${day}일 (${w})`;
  }, [eventInfo?.eventDateTime]);

  const handleDirectOrder = () => {
    if (!eventInfo) {
      navigation.navigate('EventInfoInput');
      return;
    }
    navigation.navigate('HomePartyMenu', {
      mode: 'CREATE',
      storeId,
      eventType: eventInfo.eventType,
      eventDateTime: eventInfo.eventDateTime,
      headcount: eventInfo.headcount,
      userDisplayName,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{paddingBottom: moderateScale(30) }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>홈파티 예약</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.infoSection}>
            <Text style={styles.infoHeader}>행사 음식, 이렇게 준비해보세요</Text>
            <Text style={styles.infoText}>집들이, 생신/생일상, 가족모임, 제사 상차림 등 행사 음식 메뉴입니다.</Text>
            <Text style={styles.infoText2}>행사 전에 미리 예약해주세요.</Text>
            <Text style={[styles.infoText2, {marginBottom: moderateScale(20)}]}>행사일 3~5일 전까지 예약해주셔야 준비에 차질이 없습니다.</Text>
          </View>

          {!eventInfo ? (
            <View>
              <Text style={styles.cardTitle}>나의 행사 정보</Text>
              <View style={styles.cardNone}>
                <Text style={styles.cardDesc}>아직 행사 정보가 없어요.</Text>
                <Text style={styles.cardDesc}>행사 정보를 입력하면 맞춤 홈파티 세트를 추천해드릴게요.</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('EventInfoInput')}>
                  <Text style={styles.primaryButtonText}>행사 정보 입력하기</Text>
                  <Icon name="arrow-forward-ios" size={moderateScale(12)} color="#009798" style={{marginTop: moderateScale(1), marginLeft: moderateScale(2)}} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View>
                <Text style={styles.cardTitle}>나의 행사 정보</Text>
                <View style={styles.card}>
                  <View style={[styles.row, {justifyContent: 'space-between',}]}>
                    <Text style={styles.eventType}>{eventInfo.eventType}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('EventInfoInput')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Icon name="settings" size={20} color="#009798" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.row}>
                    <Icon name="event" size={20} color="#009798" />
                    <Text style={styles.eventDateTime}>{eventDateDisplay}</Text>
                  </View>
                  <View style={styles.row}>
                    <Icon name="people" size={20} color="#009798" />
                    <Text style={styles.headcount}>{eventInfo.headcount}명</Text>
                  </View>

                </View>
              </View>

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator />
                  <Text style={styles.loadingText}>추천 세트 불러오는 중...</Text>
                </View>
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : setData ? (
                <View>
                  <Text style={styles.cardTitle}>추천 세트</Text>
                  {/* 추천 세트 카드(복수 목록 지원) */}
                  {(() => {
                    const sets = setData || [];
                    return (
                      <FlatList
                        data={sets}
                        keyExtractor={(item) => String(item.setId)}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.setListContent}
                        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                        renderItem={renderSetCard}
                      />
                    );
                  })()}
                  <View>
                    <Text style={styles.infoText3}>원하는 메뉴로 직접 구성해보세요</Text>
                    <TouchableOpacity style={styles.directOrderButton} onPress={handleDirectOrder}>
                      <Text style={styles.directOrderText}>행사 음식 직접 구성하기</Text>
                      <Icon name="arrow-forward-ios" size={moderateScale(12)} color="#009798" style={{marginTop: moderateScale(1)}} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    backgroundColor: '#009798',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  content: {
    paddingHorizontal: moderateScale(16),
  },
  infoSection: {
    marginTop: moderateScale(20),
  },
  infoHeader: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#009798',
    marginBottom: moderateScale(15),
  },
  infoText: {
    fontSize: moderateScale(13),
    fontWeight: '400',
    color: '#5c5c5c',
    marginBottom: moderateScale(15),
  },
  infoText2: {
    fontSize: moderateScale(13),
    fontWeight: '400',
    color: '#254597',
    marginBottom: moderateScale(3),
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginHorizontal: moderateScale(-1),
    marginBottom: moderateScale(16),
    elevation: moderateScale(2),
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginTop: moderateScale(15),
    marginBottom: moderateScale(10),
  },
  cardNone: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(12),
    marginHorizontal: moderateScale(-1),
    marginBottom: moderateScale(16),
    elevation: moderateScale(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDesc: {
    fontSize: moderateScale(12),
    color: '#797979',
    fontWeight: '500',
    marginBottom: moderateScale(5),
  },
  row: {
    flexDirection: 'row',
  },
  eventType: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: '#000',
    marginBottom: moderateScale(13),
  },
  eventDateTime: {
    fontSize: moderateScale(14),
    fontWeight: '400',
    marginLeft: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  headcount: {
    fontSize: moderateScale(14),
    fontWeight: '400',
    marginLeft: moderateScale(8),
  },
  primaryButton: {
    flexDirection: 'row',
    paddingVertical: moderateScale(12),
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#009798',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  loadingBox: {
    paddingVertical: moderateScale(20),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 6,
  },
  errorText: {
    color: 'red',
    padding: 12,
  },
  setListContent: {
  paddingBottom: 8,
  },
  setCard: {
    width: moderateScale(180),
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    marginRight: moderateScale(6),
  },
  setCardImage: {
    width: '100%',
    height: moderateScale(120),
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#eee',
  },
  setCardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  setCardSub: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  setCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  setCardButton: {
    backgroundColor: '#009798',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  setCardButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoText3: {
    fontSize: moderateScale(13),
    fontWeight: '400',
    color: '#3a3a3a',
    marginTop: moderateScale(15),
    marginBottom: moderateScale(8),
  },
  directOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  directOrderText: {
    fontSize: moderateScale(13),
    fontWeight: '400',
    color: '#009798',
    marginRight: moderateScale(2),
  },
});

