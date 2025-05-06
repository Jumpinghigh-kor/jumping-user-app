import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getMemberZzimAppList, MemberZzimItem } from '../api/services/memberZzimAppService';
import { useAppSelector } from '../store/hooks';

type ShoppingContextType = {
  zzimList: MemberZzimItem[];
  refreshZzimList: () => Promise<void>;
};

const defaultContext: ShoppingContextType = {
  zzimList: [],
  refreshZzimList: async () => {},
};

export const ShoppingContext = createContext<ShoppingContextType>(defaultContext);

export const ShoppingProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [zzimList, setZzimList] = useState<MemberZzimItem[]>([]);
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  const refreshZzimList = useCallback(async () => {
    if (!memberInfo?.mem_id) return;
    
    try {
      const response = await getMemberZzimAppList({
        mem_id: memberInfo.mem_id
      });
      
      if (response.success && response.data) {
        setZzimList(response.data);
      }
    } catch (error) {
      console.error('찜 목록 새로고침 오류:', error);
    }
  }, [memberInfo?.mem_id]);

  useEffect(() => {
    refreshZzimList();
  }, [memberInfo?.mem_id]);

  const value = {
    zzimList,
    refreshZzimList,
  };

  return (
    <ShoppingContext.Provider value={value}>
      {children}
    </ShoppingContext.Provider>
  );
}; 