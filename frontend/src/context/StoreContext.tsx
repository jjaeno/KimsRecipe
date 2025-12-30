// Responsibility: 매장/카테고리/메뉴 상태를 전역으로 관리한다. 백엔드 v1 스토어 API(/api/v1/stores)에서 데이터를 받아와 트리 형태와 flat 목록을 제공한다.
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo
} from 'react';
import { API_DEVICE } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 서버에서 내려오는 매장/카테고리/메뉴 타입
type Store = {
    storeId: string; // 매장 고유 id
    storeName: string; // 매장 이름
    categories: StoreCategory[];
};
type StoreCategory = {
    categoryId: string;
    categoryName: string;
    items: StoreItem[];
};
type StoreItem = {
    id: string;
    name: string;
    description: string;
    price: number;
    image: any;
    popularity: number;
    amount: string;
}

// id 기반으로 접근하기 위해 납작하게 만든 아이템
type FlatItem = StoreItem & {
    storeId: string;
    categoryId: string;
};

type StoreContextType = {
    // DB에서 가져온 전체 트리 데이터
    stores: Store[];
    // 현재 선택된 매장 id
    selectedStoreId: string;
    setSelectedStoreId: (id: string) => void;
    // 검색어 상태
    searchText: string;
    setSearchText: (text: string) => void;

    // 카테고리/매장 정보를 포함한 납작한 아이템 목록
    flatItems: FlatItem[];
};

const StoreContext = createContext<StoreContextType | null>(null);
const SELECTED_STORE_KEY = 'selectedStoreId'; // AsyncStorage 키

// Provider 컴포넌트
export const StoreProvider: React.FC<{children: ReactNode}> = ({children}) => {
    // 서버에서 받아온 전체 트리 데이터
    const [stores, setStores] = useState<Store[]>([]);
    // 현재 선택된 매장 id
    const [selectedStoreId, _setSelectedStoreId] = useState('');
    const [searchText, setSearchText] = useState('');
    
    // setSelectedStoreId 래퍼: 상태 + 스토리지 동기화
    const setSelectedStoreId = async (id: string) => {
        _setSelectedStoreId(id);
        await AsyncStorage.setItem(SELECTED_STORE_KEY, id);
        console.log('변경된 로컬 스토어 ID ', id);
    };

    // 앱 시작 시 매장 목록/카테고리/메뉴 데이터를 받아옴
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await fetch(`${API_DEVICE}/v1/stores`,{
                    method: 'GET',
                    headers: {
                        'Content-Type':'application/json'
                    },
                });
                // HTTP 상태 코드 검사
                if(!res.ok) {
                    const errText = await res.text().catch(() => '');
                    throw new Error(`서버 응답 오류: ${res.status} ${errText}`);
                }
                
                const json = await res.json();
                const data: Store[] | undefined = json?.data?.stores;
                // 방어 코드
                if (!Array.isArray(data)) {
                    throw new Error('서버 응답 형식이 올바르지 않습니다.');
                }

                setStores(data);
                // 앱 시작 시 저장된 매장으로 복원
                const savedId = await AsyncStorage.getItem(SELECTED_STORE_KEY);
                console.log('스토어 아이디: ', savedId);
                if (savedId && data.some(s=> s.storeId === savedId)) {
                    _setSelectedStoreId(savedId);
                } else if (data.length > 0) {
                    // 저장된 id 가 없는 경우 서버에서 받아온 첫 번째 값을 기본값으로 선택 -> 상태변경 + 스토리지 반영
                    await setSelectedStoreId(data[0].storeId);
                }
            } catch (err) {
                console.error('메뉴/매장/카테고리 데이터 불러오기 실패:', err);
            }
        };
        fetchStores();
    }, []);

    // 납작한 아이템 리스트 생성 (카테고리/매장 id 포함)
    const flatItems = useMemo<FlatItem[]>(() => {
        return stores.flatMap(store => 
            store.categories.flatMap(cat =>
                cat.items.map(item => ({
                    ...item,
                    storeId: store.storeId,
                    categoryId: cat.categoryId,
                }))
            )
        );
    }, [stores]);

    return (
        <StoreContext.Provider value={{
            stores,
            selectedStoreId, setSelectedStoreId,
            searchText, setSearchText,
            flatItems,
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const ctx = useContext(StoreContext);
    if (!ctx) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return ctx;
}
