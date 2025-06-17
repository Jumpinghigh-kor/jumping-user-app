import {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {fetchMemberInfo} from '../store/slices/memberSlice';

// AsyncStorage 키 상수
export const STORAGE_KEYS = {
  MEM_ID: 'mem_id',
};

/**
 * 회원 인증 및 정보 관리를 위한 훅
 * @returns 회원 정보 관련 상태 및 함수
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const {memberInfo, loading, error} = useAppSelector(state => state.member);

  // 회원 ID 저장
  const saveMemberId = async (mem_id: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MEM_ID, mem_id);
    } catch (error) {
    }
  };

  // 회원 ID 불러오기
  const loadMemberId = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.MEM_ID);
    } catch (error) {
      return null;
    }
  };

  // 회원 정보 불러오기
  const loadMemberInfo = async () => {
    const mem_id = await loadMemberId();
    if (mem_id) {
      dispatch(fetchMemberInfo(mem_id));
    }
  };

  // 로그아웃 (회원 ID 삭제)
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.MEM_ID);
      // 자동로그인 정보는 유지 (의도적으로 로그아웃하는 경우가 아니라면)
      // await AsyncStorage.removeItem('autoLogin');
      // await AsyncStorage.removeItem('savedEmail');
      // await AsyncStorage.removeItem('savedPassword');
      
      // 추가적인 로그아웃 로직 (리덕스 상태 초기화 등)
    } catch (error) {
    }
  };

  return {
    memberInfo,
    loading,
    error,
    saveMemberId,
    loadMemberId,
    loadMemberInfo,
    logout,
  };
}; 