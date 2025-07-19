//전역으로 호점 상태 저장(storeId로 저장함)
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';

type StoreContextType = {
    selectedStoreId: string;
    setSelectedStoreId: (id: string) => void;
};

//Context 생성
const StoreContext = createContext<StoreContextType | null>(null);

//Provider 컴포넌트
export const StoreProvider: React.FC<{children: ReactNode}> = ({children}) => {
    const [selectedStoreId, setSelectedStoreId] = useState('store1');

    return (
        <StoreContext.Provider value={{selectedStoreId, setSelectedStoreId}}>
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