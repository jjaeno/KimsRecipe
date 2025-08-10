//전역으로 호점 상태 저장(storeId로 저장함)
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo
} from 'react';
import { API_AUTH_DEVICE } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

//백엔드에서 받을 데이터의 타입 정의
type Store = {
    storeId: string; //호점 고유 id
    storeName: string; //호점 이름
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

//id 하나로 전체 데이터에 접근 가능하게 평탄화
type FlatItem = StoreItem & {
    storeId: string;
    categoryId: string;
};

type StoreContextType = {
    //DB에서 가져온 전체 데이터
    stores: Store[];
    //선택된 호점 아이디(모달)
    selectedStoreId: string;
    setSelectedStoreId: (id: string) => void;
    //검색 문자열
    searchText: string;
    setSearchText: (text: string) => void;

    flatItems: FlatItem[];
};

//Context 생성
const StoreContext = createContext<StoreContextType | null>(null);
const SELECTED_STORE_KEY = 'selectedStoreId' //AsyncStarage 키
//Provider 컴포넌트
export const StoreProvider: React.FC<{children: ReactNode}> = ({children}) => {
    //DB에서 받아온 전체 데이터
    const [stores, setStores] = useState<Store[]>([]);
    //현재 선택된 호점 id
    const [selectedStoreId, _setSelectedStoreId] = useState('');
    const [searchText, setSearchText] = useState('');
    
    //외부에 제공할 setter : 상태 변경 + 스토리지 저장
    // (_setSelectedStoreId는 상태만 변경, setSelectedStoreid는 상태 + 스토리지에 저장 -> 사용자가 선택할 때 사용)
    const setSelectedStoreId = async (id: string) => {
        _setSelectedStoreId(id);
        await AsyncStorage.setItem(SELECTED_STORE_KEY, id);
    };
    // 앱 시작 시 호점 목록, 카테고리, 메뉴 데이터를 받아옴
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await fetch('http://172.30.1.35:3000/api/stores/getAll',{
                    method: 'GET',
                    headers: {
                        'Content-Type':'application/json'
                    },
                });
                //HTTP 상태 코드 검사
                if(!res.ok) {
                    const errText = await res.text().catch(() => '');
                    throw new Error(`서버 응답 오류: ${res.status} ${errText}`)
                }
                
                const data: Store[] = await res.json();
                //방어 코드
                if (!Array.isArray(data)) {
                    throw new Error('서버 응담 형식이 배열이 아닙니다.');
                }

                setStores(data);
                //앱 시작 시 저장되어있던 호점으로 복원
                const savedId = await AsyncStorage.getItem(SELECTED_STORE_KEY);
                if (savedId && data.some(s=> s.storeId === savedId)) {
                    _setSelectedStoreId(savedId);
                } else if (data.length > 0) {
                    //저장된 id 가 없는 경우 서버에서 받아온 첫번째 값을 기본값으로 선택 -> 상태변경 + 스토리지에 저장
                    await setSelectedStoreId(data[0].storeId);
                }
            } catch (err) {
                console.error('호점 목록 불러오기 실패:', err);
            }
        };
        fetchStores();

       
    }, []);
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