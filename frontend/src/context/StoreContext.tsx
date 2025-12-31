// Responsibility: 매장/카테고리/메뉴 상태를 전역으로 관리한다. 백엔드 v1 스토어 API(/api/v1/stores)에서 데이터를 받아와 트리 형태와 flat 목록을 제공한다.
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStores } from '../api/store.api';

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

// id 기반으로 접근하기 위해 Flat하게 만든 아이템
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
    loading: boolean;
    error: string | null;
    refreshStores: () => Promise<void>;
};

const StoreContext = createContext<StoreContextType | null>(null);
const SELECTED_STORE_KEY = 'selectedStoreId'; // AsyncStorage 키

// Provider 컴포넌트
/**
 * StoreProvider
 * - stores/selectedStoreId/searchText 상태를 관리하고, 서버로부터 매장 트리를 로드한다.
 * - AsyncStorage에 selectedStoreId를 저장/복원하여 앱 재시작 시 선택 매장을 유지한다.
 * - 제공 값: stores, selectedStoreId, searchText, flatItems, loading, error, refreshStores, setSelectedStoreId
 */
export const StoreProvider: React.FC<{children: ReactNode}> = ({children}) => {
    // 서버에서 받아온 전체 트리 데이터
    const [stores, setStores] = useState<Store[]>([]);
    // 현재 선택된 매장 id
    const [selectedStoreId, _setSelectedStoreId] = useState('');
    const [searchText, setSearchText] = useState('');
    // 로딩/에러 상태
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // setSelectedStoreId 래퍼: 상태 + 스토리지 동기화
    const setSelectedStoreId = async (id: string) => {
        _setSelectedStoreId(id);
        await AsyncStorage.setItem(SELECTED_STORE_KEY, id);
        console.log('변경된 로컬 스토어 ID ', id);
    };

    /**
     * 매장/카테고리/메뉴 데이터를 서버에서 불러온다.
     * - 성공 시: stores 상태 설정, 저장된 selectedStoreId 복원 또는 첫 번째 매장 선택
     * - 실패 시: error 상태에 메시지 저장
     */
    const refreshStores = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getStores();
            setStores(data);
            const savedId = await AsyncStorage.getItem(SELECTED_STORE_KEY);
            if (savedId && data.some(s=> s.storeId === savedId)) {
                _setSelectedStoreId(savedId);
            } else if (data.length > 0) {
                await setSelectedStoreId(data[0].storeId);
            }
        } catch (err: any) {
            const msg = err?.message || '매장 정보를 불러오지 못했습니다.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // 앱 시작 시 매장 목록/카테고리/메뉴 데이터를 받아옴
    useEffect(() => {
        refreshStores();
    }, []);

    // 납작한 아이템 리스트 생성 (카테고리/매장 id 포함)
    const flatItems = useMemo<FlatItem[]>(() => {
        return stores.flatMap(store => 
            store.categories.flatMap(cat =>
                cat.items.map(item => ({
                    ...item,
                    storeId: store.storeId,
                    categoryId: cat.categoryId,
                    categoryName: cat.categoryName,
                }))
            )
        );
    }, [stores]);

    return (
        <StoreContext.Provider value={{
            stores,
            selectedStoreId, setSelectedStoreId,
            searchText, setSearchText,
            loading,
            error,
            refreshStores,
            flatItems,
        }}>
            {children}
        </StoreContext.Provider>
    );
};

/**
 * StoreContext 훅
 * @returns StoreContext 값
 * @throws Error Provider 밖에서 사용 시
 */
export const useStore = () => {
    const ctx = useContext(StoreContext);
    if (!ctx) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return ctx;
}
