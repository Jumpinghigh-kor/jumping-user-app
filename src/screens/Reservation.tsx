import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Image, ScrollView, FlatList, Modal, ActivityIndicator, Animated, ToastAndroid, Platform, Alert, RefreshControl} from 'react-native';
import { scale } from '../utils/responsive';
import CommonHeader from '../components/CommonHeader';
import images from '../utils/images';
import { getCenterScheduleList, CenterScheduleInfo, getMemberScheduleList, deleteMemberScheduleApp, updateMemberScheduleApp, insertMemberScheduleApp } from '../api/services/memberScheduleAppService';
import {useAppSelector} from '../store/hooks';
import CommonModal from '../components/CommonModal';
import CommonPopup from '../components/CommonPopup';
import { useFocusEffect } from '@react-navigation/native';
import {getMemberOrdersList, GetMemberOrderResponse} from '../api/services/memberOrdersService';
import Calendar from '../components/Calendar';
import { createModalPanResponder, formatTimeToKorean, getWeekday, formatDateDisplay, formatDateString, calculateDDay, isTimePast, isSchedulePast } from '../utils/commonFunction';
import CustomToast from '../components/CustomToast';

const Reservation: React.FC = () => {
  // 통합된 상태 관리
  const [state, setState] = useState({
    // UI 상태
    activeTab: 'reservation' as 'reservation' | 'history',
    showTimeSelect: false,
    forceUpdateCounter: 0,
    
    // 모달 상태
    modalVisible: false,
    
    // 로딩 및 에러 상태
    reservingLoading: false,
    cancelLoading: false,
    membershipError: false,
    historyRefreshing: false,
    historyPage: 1,
    historyLoadingMore: false,
    
    // 예약 관련 상태
    selectedTime: '',
    selectedDate: '',
    selectedSchAppId: null as number | null,
    isUpdateMode: false,
    
    // 데이터 상태
    timeOptions: [] as CenterScheduleInfo[],
    scheduledDates: [] as string[],
    memberSchedules: [] as any[],
    selectedSchedules: [] as number[],
    orderList: [] as any[]
  });
  
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const scrollViewRef = useRef<ScrollView>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [customToastMessage, setCustomToastMessage] = useState('');
  const [cancelPopupVisible, setCancelPopupVisible] = useState(false);
  const historyLoadLockRef = useRef(false);
  
  // 메모이제이션된 panResponder
  const panResponder = useMemo(() => 
    createModalPanResponder(pan, () => setState(prev => ({...prev, modalVisible: false}))), 
    [pan]
  );

  // pan 애니메이션 초기화
  useEffect(() => {
    if (state.modalVisible) {
      pan.setValue({ x: 0, y: 0 });
    }
  }, [state.modalVisible, pan]);

  // API 호출 함수들을 useCallback으로 메모이제이션
  const fetchScheduleData = useCallback(async (date: string) => {
    try {
      const formattedDate = date.replace(/-/g, '');
      const response = await getCenterScheduleList(
        Number(memberInfo?.center_id), 
        Number(memberInfo?.mem_id),
        formattedDate
      );

      if (response.success && response.data) {
        setState(prev => ({
          ...prev, 
          timeOptions: response.data,
          forceUpdateCounter: prev.forceUpdateCounter + 1
        }));
      }
    } catch (err) {
      console.error('fetchScheduleData error:', err);
    }
  }, [memberInfo?.center_id, memberInfo?.mem_id]);

  // 회원 스케줄 목록 조회
  const fetchMemberSchedules = useCallback(async () => {    
    try {
      const response = await getMemberScheduleList(Number(memberInfo.mem_id));
      console.log('response', response);
      if (response.success && response.data) {
        if (response.data.length === 0) {
          setState(prev => ({...prev, scheduledDates: [], memberSchedules: []}));
          return [];
        }
        
        const formattedDates = response.data.map(schedule => {
          const dt = schedule.sch_dt;
          
          if (!dt) {
            return null;
          }
          
          // 숫자든 문자열이든 문자열로 변환
          const dtString = String(dt);
          
          if (dtString.length !== 8) {
            return null;
          }
          
          const formatted = `${dtString.substring(0, 4)}-${dtString.substring(4, 6)}-${dtString.substring(6, 8)}`;
          return formatted;
        }).filter(date => date !== null);

        setState(prev => ({
          ...prev,
          scheduledDates: formattedDates,
          memberSchedules: response.data
        }));
        return response.data;
      }
      
      setState(prev => ({...prev, scheduledDates: [], memberSchedules: []}));
      return [];
    } catch (err) {
      return [];
    }
  }, [memberInfo?.mem_id]);

  // 회원 주문 목록 조회
  const fetchMemberOrders = useCallback(async () => {
    try {
      if (memberInfo?.mem_id) {
        const response = await getMemberOrdersList({
          mem_id: parseInt(memberInfo?.mem_id, 10)
        }) as GetMemberOrderResponse;

        if (response.success && response.data) {
          setState(prev => ({...prev, orderList: response.data}));
        }
      }
    } catch (error) {
      console.error('fetchMemberOrders error:', error);
    }
  }, [memberInfo?.mem_id]);

  // 통합된 데이터 로딩
  const loadData = useCallback(() => {
    fetchMemberSchedules();
    fetchMemberOrders();
    setState(prev => ({...prev, membershipError: false, selectedTime: '', showTimeSelect: false, selectedDate: ''}));
  }, [fetchMemberSchedules, fetchMemberOrders]);

  // forceUpdateCounter 변경 시 데이터 리로드
  useEffect(() => {
    if (state.forceUpdateCounter > 0 && memberInfo?.mem_id) {
      fetchMemberSchedules().then(result => {
        if (!result || result.length === 0) {
          setState(prev => ({...prev, scheduledDates: []}));
        }
      });
    }
  }, [state.forceUpdateCounter, memberInfo?.mem_id, fetchMemberSchedules]);

  // 화면 포커스 시 데이터 로딩
  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  // 예약 내역 당겨서 새로고침
  const onRefreshHistory = useCallback(async () => {
    setState(prev => ({...prev, historyRefreshing: true}));
    try {
      await fetchMemberSchedules();
    } finally {
      setState(prev => ({...prev, historyRefreshing: false}));
    }
  }, [fetchMemberSchedules]);

  // 예약 내역 데이터 또는 탭 변경 시 페이지 초기화
  useEffect(() => {
    setState(prev => ({...prev, historyPage: 1}));
  }, [state.memberSchedules.length, state.activeTab]);

  // 이벤트 핸들러들을 useCallback으로 메모이제이션
  const handleDateSelect = useCallback((formattedDate: string, isScheduled: boolean) => {
    setState(prev => ({
      ...prev,
      membershipError: false,
      selectedDate: formattedDate,
      selectedTime: '',
      isUpdateMode: isScheduled,
      showTimeSelect: false
    }));
    
    fetchScheduleData(formattedDate);
    
    if (isScheduled) {
      const schDtFormat = formattedDate.replace(/-/g, '');
      const scheduledTimeForDate = state.memberSchedules.find(
        schedule => String(schedule.sch_dt) === schDtFormat
      );
      
      if (scheduledTimeForDate) {
        setState(prev => ({
          ...prev,
          selectedTime: scheduledTimeForDate.sch_time,
          selectedSchAppId: scheduledTimeForDate.sch_app_id
        }));
      }
    } else {
      setState(prev => ({...prev, selectedSchAppId: null}));
    }
  }, [fetchScheduleData, state.memberSchedules]);

  const handleMembershipError = useCallback(() => {
    setState(prev => ({...prev, membershipError: true}));
  }, []);

  const handleReservation = useCallback(() => {
    // 시간과 날짜 유효성 검사
    if (!state.selectedTime) {
      return;
    }
    
    if (!state.selectedDate) {
      return;
    }
    
    // 예약 수정 모드이고 당일인 경우 토스트 메시지 표시
    if (state.scheduledDates.includes(state.selectedDate)) {
      const selectedDateParts = state.selectedDate.split('-');
      const selectedYear = parseInt(selectedDateParts[0]);
      const selectedMonth = parseInt(selectedDateParts[1]) - 1;
      const selectedDay = parseInt(selectedDateParts[2]);
      
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const currentDate = today.getDate();
      
      const isTodaySelected = 
        selectedYear === currentYear && 
        selectedMonth === currentMonth && 
        selectedDay === currentDate;
      
      if (isTodaySelected) {
        setCustomToastMessage('예약당일엔 변경이나 취소를 할 수 없습니다.');
        setShowCustomToast(true);
        return;
      }
    }
    
    setState(prev => ({
      ...prev,
      modalVisible: true
    }));
  }, [state.selectedTime, state.selectedDate, state.scheduledDates]);

  // 모달 닫기 함수들을 useCallback으로 메모이제이션
  const closeModal = useCallback(() => setState(prev => ({...prev, modalVisible: false})), []);
  
  // 예약 처리 함수
  const confirmReservation = async () => {
    try {
      // 예약 전 로딩 상태로 변경
      setState(prev => ({...prev, reservingLoading: true}));

      // 선택한 시간의 sch_id 찾기
      const selectedSchedule = state.timeOptions.find(option => option.sch_time === state.selectedTime);

      // YYYY-MM-DD 형식의 날짜를 YYYYMMDD 형식으로 변환
      const formattedDate = state.selectedDate.replace(/-/g, '');

      // 이미 예약된 날짜인지 확인
      const isUpdateMode = state.scheduledDates.includes(state.selectedDate);
      
      let response;
      
      if (isUpdateMode && state.selectedSchAppId) {
        // 업데이트 API 호출
        response = await updateMemberScheduleApp(
          memberInfo?.mem_id ? Number(memberInfo.mem_id) : 0,
          selectedSchedule.sch_id,
          state.selectedSchAppId,
          memberInfo?.mem_name,
          memberInfo?.center_id ? Number(memberInfo.center_id) : 0,
          formattedDate
        );
      } else {
        // 일반 예약 API 호출
        response = await insertMemberScheduleApp(
          memberInfo?.mem_id ? Number(memberInfo.mem_id) : 0,
          memberInfo?.mem_sch_id ? Number(memberInfo.mem_sch_id) : 0,
          selectedSchedule.sch_id,
          formattedDate,
          memberInfo?.mem_nickname || '',
          memberInfo?.center_id ? Number(memberInfo.center_id) : 0
        );
      }

      // 모달 닫기
      closeModal();

      // 성공 처리
      if (response.success) {
        // 예약 성공 후 예약 목록 새로고침
        fetchMemberSchedules();
        // 선택 초기화
        setState(prev => ({...prev, selectedTime: '', selectedDate: '', selectedSchAppId: null}));
        // 강제 리렌더링
        setState(prev => ({...prev, forceUpdateCounter: prev.forceUpdateCounter + 1}));
      }
    } catch (err: any) {
      console.error('confirmReservation error:', err);
    } finally {
      setState(prev => ({...prev, reservingLoading: false}));
    }
  };

  // 예약 취소 처리
  const handleCancelReservation = async () => {
    try {
      setState(prev => ({...prev, cancelLoading: true}));
      
      if (state.selectedSchedules.length === 0) {
        setState(prev => ({...prev, cancelLoading: false}));
        return;
      }
      
      // 전체 삭제 여부 확인
      const isAllSelected = state.memberSchedules.length === state.selectedSchedules.length;
      
      // API 호출
      const response = await deleteMemberScheduleApp(
        memberInfo?.mem_id ? Number(memberInfo.mem_id) : 0,
        state.selectedSchedules,
        memberInfo?.mem_name,
        memberInfo?.center_id ? Number(memberInfo.center_id) : 0,
        state.selectedDate.replace(/-/g, '')
      );
      
      // 성공 처리
      if (response.success) {
        // 선택 초기화
        setState(prev => ({...prev, selectedSchedules: []}));
        
        // 전체 항목을 삭제한 경우 - 직접 빈 배열로 설정
        if (isAllSelected) {
          setState(prev => ({...prev, memberSchedules: []}));
          // scheduledDates도 함께 비워줌
          setState(prev => ({...prev, scheduledDates: []}));
          // 강제 리렌더링
          setState(prev => ({...prev, forceUpdateCounter: prev.forceUpdateCounter + 1}));
        }
        
        // API에서 목록 새로고침
        fetchMemberSchedules();
      }
    } catch (err: any) {
      
    } finally {
      setState(prev => ({...prev, cancelLoading: false}));
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton]}
            onPress={() => {
              setState(prev => ({...prev, activeTab: 'reservation', forceUpdateCounter: prev.forceUpdateCounter + 1}));
            }}
          >
            <Text style={[styles.tabButtonText, state.activeTab === 'reservation' && styles.activeTabButtonText]}>
              예약하기
            </Text>
            {state.activeTab === 'reservation' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton]}
            onPress={() => {
              setState(prev => ({...prev, activeTab: 'history', forceUpdateCounter: prev.forceUpdateCounter + 1}));
            }}
          >
            <Text style={[styles.tabButtonText, state.activeTab === 'history' && styles.activeTabButtonText]}>
              예약내역
            </Text>
            {state.activeTab === 'history' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>
        
        {state.activeTab === 'reservation' ? (
          <View style={styles.reservationContainer}>
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: scale(110)}}
              keyboardShouldPersistTaps="handled"
              onStartShouldSetResponderCapture={() => false}
              onMoveShouldSetResponderCapture={() => false}
            >
              <Text style={styles.sectionTitle}>안내</Text>
              <Text style={styles.memberSchInfo}>
                '{memberInfo?.mem_nickname}'님의 기본 시간표는
                <Text style={{color: '#42B649'}}> {formatTimeToKorean(memberInfo?.sch_time || '')}</Text>
                입니다.{'\n'}예약이 되어 있지 않으면 기본 시간표로 자동 예약 됩니다.
                <Text>{'\n'}{'\n'}- 예약이 접수되면, 가맹점은 해당 예약을 수락 또는 거부합니다.</Text>
                <Text>{'\n'}- 예약 내역에서 예약 상태를 확인할 수 있습니다.</Text>
                <Text>{'\n'}- 응답이 없을 경우, 해당 가맹점에 문의해 주세요.</Text>
                <Text>{'\n'}- 예약이 수락되면 방문해주세요:)</Text>
              </Text>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>날짜 선택</Text>
                <Calendar
                  selectedDate={state.selectedDate}
                  scheduledDates={state.scheduledDates}
                  orderList={state.orderList}
                  onDateSelect={handleDateSelect}
                  onMembershipError={handleMembershipError}
                />
              </View>

              {state.membershipError && (
                <View>
                  <Text style={styles.membershipErrorText}>
                    센터에서 회원권을 구매 후 예약을 진행해주세요
                  </Text>
                </View>
              )}

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>시간표 선택</Text>
                <View style={styles.selectBoxContainer}>
                  <TouchableOpacity 
                    style={styles.selectBox}
                    onPress={() => setState(prev => ({...prev, showTimeSelect: !prev.showTimeSelect}))}
                    disabled={!state.selectedDate}
                  >
                    <Text style={[
                      styles.selectBoxText,
                      state.selectedTime ? styles.selectedTimeText : null
                    ]}>
                      {!state.selectedDate ? '날짜를 먼저 선택해주세요' : (state.selectedTime ? formatTimeToKorean(state.selectedTime) : '시간을 선택해주세요')}
                    </Text>
                    <Image 
                      source={state.showTimeSelect ? images.icons.arrowUpGray : images.icons.arrowDownGray} 
                      style={styles.selectArrow} 
                    />
                  </TouchableOpacity>
                </View>
                
                {state.showTimeSelect && (
                  <View style={styles.optionsContainer}>
                    {
                      <ScrollView 
                        style={{maxHeight: scale(130)}}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                        scrollEventThrottle={16}
                        onScrollBeginDrag={() => {
                          if (scrollViewRef.current) {
                            scrollViewRef.current.setNativeProps({ scrollEnabled: false });
                          }
                        }}
                        onScrollEndDrag={() => {
                          if (scrollViewRef.current) {
                            scrollViewRef.current.setNativeProps({ scrollEnabled: true });
                          }
                        }}
                        onMomentumScrollEnd={() => {
                          if (scrollViewRef.current) {
                            scrollViewRef.current.setNativeProps({ scrollEnabled: true });
                          }
                        }}
                      >
                        {state.timeOptions.map((timeOption) => {
                          const isPastTime = isTimePast(timeOption.sch_time, state.selectedDate);
                          return (
                            <TouchableOpacity
                              key={timeOption.sch_id}
                              style={[
                                styles.optionItem,
                                memberInfo?.mem_sch_id === timeOption.sch_id && styles.disabledOptionItem,
                                isPastTime && styles.disabledOptionItem,
                                state.selectedTime === timeOption.sch_time && styles.selectedOptionItemBackground
                              ]}
                              disabled={memberInfo?.mem_sch_id === timeOption.sch_id || isPastTime}
                              onPress={() => {
                                setState(prev => ({...prev, selectedTime: timeOption.sch_time}));
                                setState(prev => ({...prev, showTimeSelect: false}));
                              }}
                            >
                              <View style={styles.optionTextContainer}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                  <Text style={[
                                    styles.optionText,
                                    state.selectedTime === timeOption.sch_time && styles.selectedOptionItemText,
                                    (memberInfo?.mem_sch_id === timeOption.sch_id || isPastTime) && styles.disabledOptionText
                                  ]}>
                                    {formatTimeToKorean(timeOption.sch_time)} {timeOption.sch_time === memberInfo?.sch_time && <Text style={{color: '#43B546', fontSize: scale(12), fontFamily: 'Pretendard-Medium'}}> 기본 시간표</Text>}
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    }
                  </View>
                )}
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.reserveButton,
                    (!state.selectedDate || !state.selectedTime) && { backgroundColor: '#848484' }
                  ]}
                  onPress={handleReservation}
                  disabled={!state.selectedDate || !state.selectedTime}
                >
                  <Text style={styles.reserveButtonText}>
                    {state.scheduledDates.includes(state.selectedDate) ? '예약 신청 변경' : '예약 신청'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.historyContainer} key={state.forceUpdateCounter}>
            {state.memberSchedules.length === 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: scale(80), alignItems: 'center', justifyContent: 'center', flexGrow: 1}}
                refreshControl={
                  <RefreshControl
                    refreshing={state.historyRefreshing}
                    onRefresh={onRefreshHistory}
                    tintColor="#FFFFFF"
                    colors={["#40B649"]}
                    progressBackgroundColor="#202020"
                  />
                }
                bounces={true}
                alwaysBounceVertical={true}
              >
                <View style={styles.emptyContainer}>
                  <Image source={images.icons.speechGray} style={styles.speechIcon} />
                  <Text style={styles.emptyText}>예약 내역이 없어요</Text>
                </View>
              </ScrollView>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: scale(120)}}
                refreshControl={
                  <RefreshControl
                    refreshing={state.historyRefreshing}
                    onRefresh={onRefreshHistory}
                    tintColor="#FFFFFF"
                    colors={["#40B649"]}
                    progressBackgroundColor="#202020"
                  />
                }
                bounces={true}
                alwaysBounceVertical={true}
                onMomentumScrollEnd={(e) => {
                  try {
                    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent || {};
                    const paddingToBottom = 50;
                    const displayedLen = Math.min(state.memberSchedules.length, state.historyPage * 5);
                    if (layoutMeasurement && contentOffset && contentSize) {
                      const isNearEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
                      if (contentOffset.y > 0 && isNearEnd && !state.historyLoadingMore && displayedLen < state.memberSchedules.length && !historyLoadLockRef.current) {
                        historyLoadLockRef.current = true;
                        setState(prev => ({...prev, historyLoadingMore: true}));
                        setTimeout(() => {
                          setState(prev => ({...prev, historyPage: prev.historyPage + 1, historyLoadingMore: false}));
                          historyLoadLockRef.current = false;
                        }, 300);
                      }
                    }
                  } catch {}
                }}
              >
                {state.memberSchedules.slice(0, state.historyPage * 5).map((schedule, index) => {
                  const dDay = calculateDDay(String(schedule.sch_dt));
                  const isPast = isSchedulePast(String(schedule.sch_dt), schedule.sch_time);
                  
                  // 날짜 포맷팅
                  const formattedDate = formatDateString(String(schedule.sch_dt));
                  
                  // 시간 포맷팅
                  const formattedTime = formatTimeToKorean(schedule.sch_time);
                  
                  // 요일 구하기
                  const weekday = getWeekday(`${String(schedule.sch_dt).substring(0, 4)}-${String(schedule.sch_dt).substring(4, 6)}-${String(schedule.sch_dt).substring(6, 8)}`);

                  // 상태 배지 텍스트/색상 정리
                  const isRejected = schedule.agree_yn === 'N' || (!schedule.agree_yn && isPast);
                  const statusText = schedule.agree_yn === 'Y'
                    ? '예약 수락'
                    : isRejected
                    ? '예약 거부'
                    : '확인 중';
                  const statusBg = schedule.agree_yn === 'Y'
                    ? '#43B546'
                    : isRejected
                    ? '#F04D4D'
                    : '#F9CB42';

                  return (
                    <View key={schedule.sch_app_id} style={styles.scheduleItem}>
                      <TouchableOpacity 
                        onPress={() => {
                          if (dDay !== 0 && !isPast) {
                            const id = schedule.sch_app_id;
                            const isAlreadySelected = state.selectedSchedules.includes(id);
                            if (isAlreadySelected) {
                              setState(prev => ({...prev, selectedSchedules: state.selectedSchedules.filter(item => item !== id)}));
                            } else {
                              setState(prev => ({...prev, selectedSchedules: [...state.selectedSchedules, id]}));
                            }
                          }
                        }}
                        disabled={dDay === 0 || isPast}
                        style={{width: '100%'}}
                      >
                        <View style={styles.scheduleHeader}>
                          <View style={[
                            styles.dDayBadge,
                            dDay === 0 && styles.todayBadge,
                            isPast && styles.pastBadge
                          ]}>
                            <Text style={styles.dDayText}>
                              {dDay === 0 ? '예약당일' : isPast ? '예약마감' : `D-${Math.abs(dDay)}`}
                            </Text>
                          </View>
                          
                          <View style={[
                            styles.checkCircle,
                            // 체크 여부에 따른 스타일
                            state.selectedSchedules.includes(schedule.sch_app_id) 
                              ? {borderColor: '#43B546', backgroundColor: '#43B546'}
                              : {backgroundColor: '#D9D9D9'}
                          ]}>
                            <Image source={images.icons.checkWhite} style={{width: scale(12), height: scale(12)}} />
                          </View>
                        </View>
                        
                        <View style={styles.scheduleContent}>
                          <Text style={styles.centerName}>
                            {memberInfo?.center_name}
                          </Text>
                          <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={styles.scheduleDateTime}>일시</Text>
                            <Text style={[styles.scheduleDateTime, {color: '#FFFFFF', marginLeft: scale(14)}]}>{formattedDate} {weekday} {formattedTime}</Text>
                          </View>
                          <View style={[{backgroundColor: statusBg, borderRadius: scale(5), alignSelf: 'flex-end', paddingHorizontal: scale(12), paddingVertical: scale(4), marginTop: scale(8)}]}>
                            <Text style={[{color: '#FFFFFF', fontSize: scale(12), fontFamily: 'Pretendard-Medium'}]}>{statusText}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {(state.historyLoadingMore && (state.historyPage * 5) < state.memberSchedules.length) && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </ScrollView>
            )}
            {/* Floating cancel (X) button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: scale(20),
                bottom: scale(80),
                width: scale(56),
                height: scale(56),
                opacity: state.selectedSchedules.length === 0 ? 0.5 : 1,
                borderRadius: scale(28),
                backgroundColor: state.selectedSchedules.length === 0 ? '#848484' : '#F04D4D',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              }}
              onPress={() => {
                if (state.selectedSchedules.length > 0) {
                  setCancelPopupVisible(true);
                }
              }}
              disabled={state.selectedSchedules.length === 0}
            >
              <Image source={images.icons.xWhite} style={{ width: scale(22), height: scale(22), resizeMode: 'contain' }} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <CommonPopup
        visible={cancelPopupVisible}
        type="warning"
        message="정말 예약을 취소하시겠습니까?"
        onConfirm={() => {
          setCancelPopupVisible(false);
          handleCancelReservation();
        }}
        onCancel={() => setCancelPopupVisible(false)}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={state.modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: pan.y }]
              }
            ]}
          >
            <View
              {...panResponder.panHandlers}
              style={styles.dragArea}
            >
              <View style={styles.modalBarContainer}>
                <Image source={images.icons.smallBarGray} style={styles.modalBar} />
              </View>
            </View>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>예약 확인</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>예약 내용을 다시 한 번 확인해 주세요.</Text>
              <Text style={styles.modalWarningText}>예약 당일 또는 확정일에는 취소 및 변경이 불가능합니다.</Text>
              
              <View style={styles.reservationDetailContainer}>
                <View style={styles.detailItem}>
                  <Image source={images.icons.calendarGreen} style={styles.detailIcon} />
                  <View>
                    <Text style={styles.detailValue}>
                      {formatDateDisplay(state.selectedDate)} ({getWeekday(state.selectedDate)})
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailItem}>
                  <Image source={images.icons.clockGreen} style={styles.detailIcon} />
                  <View>
                    <Text style={styles.detailValue}>{formatTimeToKorean(state.selectedTime)}</Text>
                  </View>
                </View>
              </View>
            
              {/* <View>
                <Text style={styles.lateText}>늦지 않게 출석해 주세요:)</Text>
              </View> */}
            
              <View style={styles.modalFooter}>
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton} 
                    onPress={closeModal}
                    disabled={state.reservingLoading}
                    >
                    <Text style={styles.modalCancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalConfirmButton} 
                    onPress={confirmReservation}
                    disabled={state.reservingLoading}
                    >
                    <Text style={styles.modalConfirmButtonText}>확인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* 커스텀 토스트 */}
      <CustomToast
        visible={showCustomToast}
        message={customToastMessage}
        onHide={() => setShowCustomToast(false)}
        position="center"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  text: {
    fontSize: scale(24),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#717171',
    backgroundColor: '#202020',
  },
  tabButton: {
    flex: 1,
    paddingVertical: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonText: {
    color: '#717171',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reservationContainer: {
    flex: 1,
    paddingHorizontal: scale(16),
  },
  sectionContainer: {
    marginBottom: scale(10),
  },
  memberSchInfo: {
    color: '#FFFFFF',
    fontSize: scale(12),
    // marginTop: scale(20),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: scale(12),
    padding: scale(12),
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: 'Pretendard-SemiBold',
    marginTop: scale(20),
    marginBottom: scale(12),
  },
  selectBoxContainer: {
    zIndex: 1,
  },
  selectBox: {
    backgroundColor: '#373737',
    borderRadius: scale(14),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9'
  },
  selectBoxText: {
    color: '#717171',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  selectArrow: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain',
  },
  optionsContainer: {
    marginTop: scale(18),
    backgroundColor: '#373737',
    borderRadius: scale(14),
    maxHeight: scale(150),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingVertical: scale(12),
    paddingHorizontal: scale(12),
  },
  optionItem: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  optionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionText: {
    color: '#ACACAC',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  optionInfoText: {
    color: '#717171',
    fontSize: scale(12),
    marginLeft: scale(8),
    fontFamily: 'Pretendard-Medium',
  },
  personText: {
    color: '#717171',
    fontSize: scale(12),
    marginLeft: scale(8),
    fontFamily: 'Pretendard-Medium',
  },
  buttonContainer: {
    marginTop: scale(20),
  },
  reserveButton: {
    backgroundColor: '#40B649',
    borderRadius: scale(8),
    paddingVertical: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  loadingContainer: {
    padding: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    marginTop: scale(8),
  },
  disabledOptionItem: {
    backgroundColor: 'rgba(55, 55, 55, 0.5)',
    opacity: 0.6,
  },
  disabledOptionText: {
    color: '#717171',
  },
  selectedTimeText: {
    color: '#FFFFFF',
  },
  selectedOptionItemBackground: {
    backgroundColor: '#656565',
    borderRadius: scale(8),
    // marginHorizontal: scale(8),
  },
  selectedOptionItemText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#333333',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    width: '100%',
    minHeight: '45%',
    maxHeight: '60%',
    padding: scale(20),
    display: 'flex',
    flexDirection: 'column',
  },
  dragArea: {
    width: '100%',
    height: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  modalBarContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: scale(10),
  },
  modalBar: {
    width: scale(40),
    height: scale(4),
    resizeMode: 'contain',
  },
  modalHeader: {
    marginBottom: scale(5),
    marginTop: scale(20),
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontFamily: 'Pretendard-SemiBold',
  },
  modalBody: {
    flex: 1,
  },
  modalText: {
    color: '#D9D9D9',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  modalWarningText: {
    color: '#F04D4D',
    fontSize: scale(12),
    marginBottom: scale(20),
    fontFamily: 'Pretendard-Medium',
  },
  reservationDetailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderRadius: scale(12),
    padding: scale(15),
    marginBottom: scale(10),
  },
  detailItem: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  detailIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
    marginBottom: scale(10),
    tintColor: '#FFFFFF',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '500',
    fontFamily: 'Pretendard-Medium',
  },
  modalFooter: {
    marginTop: scale(20),
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#717171',
    borderRadius: scale(8),
    paddingVertical: scale(12),
    alignItems: 'center',
    marginRight: scale(8),
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#40B649',
    borderRadius: scale(8),
    paddingVertical: scale(12),
    alignItems: 'center',
    marginLeft: scale(8),
  },
  modalCancelButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  lateText: {
    color: '#D9D9D9',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: scale(20),
  },
  emptyContainer: {
    marginTop: scale(100),
    alignItems: 'center',
  },
  emptyText: {
    color: '#848484',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  scheduleItem: {
    backgroundColor: '#373737',
    borderRadius: scale(12),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    overflow: 'hidden',
    paddingVertical: scale(10),
    paddingHorizontal: scale(5),
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    paddingVertical: scale(12),
  },
  dDayBadge: {
    backgroundColor: '#40B649',
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(6),
  },
  todayBadge: {
    backgroundColor: '#40B649',
  },
  pastBadge: {
    backgroundColor: '#848484',
  },
  dDayText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    paddingVertical: Platform.OS === 'ios' ? scale(3) : scale(2),
    fontFamily: 'Pretendard-Medium',
  },
  checkCircle: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    borderWidth: 2,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInner: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#43B546',
  },
  scheduleContent: {
    paddingHorizontal: scale(15),
    paddingBottom: scale(15),
  },
  centerName: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: scale(8),
  },
  scheduleDateTime: {
    color: '#D9D9D9',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
  },
  speechIcon: {
    width: scale(40),
    height: scale(40),
    marginBottom: scale(15),
    resizeMode: 'contain',
  },
  membershipErrorText: {
    color: '#F04D4D',
    fontSize: scale(12),
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
  },
});

export default Reservation; 