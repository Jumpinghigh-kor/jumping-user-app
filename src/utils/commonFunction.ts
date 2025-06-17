/**
 * 날짜 형식 변환 유틸리티 함수
 */

import { PanResponder, Animated } from 'react-native';

/**
 * YYYYMMDDHHIISS 형식의 문자열을 YYYY-MM-DD 형식으로 변환
 * @param dateStr YYYYMMDDHHIISS 형식의 날짜 문자열
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export const formatDateYYYYMMDD = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 8) return '';
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${year}-${month}-${day}`;
};

/**
 * YYYYMMDDHHIISS 형식의 문자열을 YYYY-MM-DD HH:II 형식으로 변환
 * @param dateStr YYYYMMDDHHIISS 형식의 날짜 문자열
 * @returns YYYY-MM-DD HH:II 형식의 날짜 문자열
 */
export const formatDateYYYYMMDDHHII = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 12) return '';
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const hour = dateStr.substring(8, 10);
  const minute = dateStr.substring(10, 12);
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

// checkbox 관련 유틸리티 함수

// 일반적인 체크박스 토글 함수
export const toggleCheckbox = (currentState, setState) => {
  setState(!currentState);
};

export const toggleSelectAll = (cartList, selectedItems, setSelectedItems, setAllSelected) => {
  // Only consider selectable items (with non-zero quantity) for determining if all are selected
  const selectableItems = cartList.filter(item => item?.product_quantity !== 0);
  const allSelectableItemsSelected = selectableItems.length > 0 && 
    selectableItems.every(item => selectedItems[item.cart_app_id]);
  
  const newSelectedState = !allSelectableItemsSelected;
  setAllSelected(newSelectedState);
  
  const newSelectedItems = {};
  cartList.forEach(item => {
    // Skip setting selection state for items with quantity 0
    if (item?.product_quantity === 0) {
      newSelectedItems[item.cart_app_id] = false;
      return;
    }
    newSelectedItems[item.cart_app_id] = newSelectedState;
  });
  
  setSelectedItems(newSelectedItems);
};

export const toggleSelectItem = (cartAppId, selectedItems, setSelectedItems) => {
  setSelectedItems(prev => ({
    ...prev,
    [cartAppId]: !prev[cartAppId]
  }));
};

export const toggleSelectProductGroup = (productAppId, cartList, selectedItems, setSelectedItems) => {
  // Convert productAppId to number to ensure matching works
  const productIdNum = Number(productAppId);
  const itemsInGroup = cartList.filter(item => Number(item.product_app_id) === productIdNum);
  
  // Only consider selectable items (with non-zero quantity) for determining if all are selected
  const selectableItems = itemsInGroup.filter(item => item?.product_quantity !== 0);
  const allInGroupSelected = selectableItems.every(item => selectedItems[item.cart_app_id]);
  
  const newSelectedItems = {...selectedItems};
  itemsInGroup.forEach(item => {
    // Skip setting selection state for items with quantity 0
    if (item?.product_quantity === 0) return;
    newSelectedItems[item.cart_app_id] = !allInGroupSelected;
  });
  
  setSelectedItems(newSelectedItems);
};

export const getSelectedCount = (cartList, selectedItems) => {
  // 선택된 상품 아이템 수 반환 (브랜드/product_app_id 기준 아님)
  return Object.values(selectedItems).filter(Boolean).length;
};

export const getTotalUniqueProductCount = (cartList) => {
  // 전체 상품 아이템 수 반환 (브랜드/product_app_id 기준 아님)
  return cartList.length;
};

// 수량 증가 함수
export const increaseQuantity = (cartItem, cartList, setCartList) => {
  // 수량 최대값 체크 (product_quantity가 있으면 그 값, 없으면 최대 10개로 제한)
  const maxQuantity = cartItem.product_quantity || 10;
  
  if (cartItem.quantity >= maxQuantity) return;
  
  const updatedCartList = cartList.map(item => {
    if (item.cart_app_id === cartItem.cart_app_id) {
      return { ...item, quantity: item.quantity + 1 };
    }
    return item;
  });
  
  setCartList(updatedCartList);
};

// 수량 감소 함수
export const decreaseQuantity = (cartItem, cartList, setCartList) => {
  if (cartItem.quantity <= 1) return;
  
  const updatedCartList = cartList.map(item => {
    if (item.cart_app_id === cartItem.cart_app_id) {
      return { ...item, quantity: item.quantity - 1 };
    }
    return item;
  });
  
  setCartList(updatedCartList);
};

/**
 * 모달 드래그 제스처를 위한 PanResponder 생성 함수
 * @param pan Animated.ValueXY 객체
 * @param closeModal 모달 닫기 함수
 * @returns PanResponder 객체
 */
export const createModalPanResponder = (pan: Animated.ValueXY, closeModal: () => void) => {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: () => {
      pan.extractOffset();
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        pan.y.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        closeModal();
      } else {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          bounciness: 10,
        }).start();
      }
    },
  });
};

/**
 * 예약 관련 유틸리티 함수들
 */

/**
 * 시간 문자열을 한국어 형식으로 변환
 */
export const formatTimeToKorean = (timeString: string): string => {
  if (!timeString) return '';
  if (timeString.includes('AM')) {
    return `오전 ${timeString.replace('AM', '').trim()}`;
  } else if (timeString.includes('PM')) {
    return `오후 ${timeString.replace('PM', '').trim()}`;
  }
  return timeString;
};

/**
 * 날짜 문자열에서 요일 구하기
 */
export const getWeekday = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return weekdays[date.getDay()];
};

/**
 * 날짜 표시 형식 변환 (YYYY-MM-DD -> MM.DD)
 */
export const formatDateDisplay = (dateString: string) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  return parts.length === 3 ? `${parts[1]}.${parts[2]}` : dateString.replace(/-/g, '.');
};

/**
 * 날짜 문자열 형식 변환 (YYYYMMDD -> YYYY.MM.DD)
 */
export const formatDateString = (dateString: string): string => {
  if (!dateString || dateString.length !== 8) return dateString;
  return `${dateString.substring(0, 4)}.${dateString.substring(4, 6)}.${dateString.substring(6, 8)}`;
};

/**
 * D-Day 계산
 */
export const calculateDDay = (dateString: string) => {
  if (!dateString) return 0;
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1;
  const day = parseInt(dateString.substring(6, 8));
  const scheduleDate = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  scheduleDate.setHours(0, 0, 0, 0);
  const diffTime = scheduleDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 시간이 지났는지 확인
 */
export const isTimePast = (timeString: string, selectedDate: string): boolean => {
  if (!selectedDate) return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (selectedDate !== today) return false;
  
  let hour = 0;
  let minute = 0;
  if (timeString.includes('AM') || timeString.includes('PM')) {
    const timeParts = timeString.replace('AM', '').replace('PM', '').trim().split(':');
    hour = parseInt(timeParts[0]);
    minute = parseInt(timeParts[1]);
    if (timeString.includes('PM') && hour < 12) {
      hour += 12;
    }
  }
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  return hour < currentHour || (hour === currentHour && minute <= currentMinute);
};

/**
 * 스케줄이 지났는지 확인
 */
export const isSchedulePast = (dateString: string, timeString: string) => {
  if (!dateString || !timeString) return false;
  const now = new Date();
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1;
  const day = parseInt(dateString.substring(6, 8));
  
  let hour = 0;
  let minute = 0;
  if (timeString.includes('AM') || timeString.includes('PM')) {
    const timeParts = timeString.replace('AM', '').replace('PM', '').trim().split(':');
    hour = parseInt(timeParts[0]);
    minute = parseInt(timeParts[1]);
    if (timeString.includes('PM') && hour < 12) {
      hour += 12;
    }
  }
  
  const scheduleDateTime = new Date(year, month, day, hour, minute);
  return scheduleDateTime < now;
};