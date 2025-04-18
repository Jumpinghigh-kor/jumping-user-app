import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Image, ScrollView, FlatList, Modal, ActivityIndicator, PanResponder, Animated, ToastAndroid, Platform, Alert} from 'react-native';
import { scale } from '../utils/responsive';
import CommonHeader from '../components/CommonHeader';
import images from '../utils/images';
import { getCenterScheduleList, CenterScheduleInfo, insertMemberSchedule, getMemberScheduleList } from '../api/services/memberScheduleAppService';
import {useAppSelector} from '../store/hooks';
import CommonModal from '../components/CommonModal';
import CommonPopup from '../components/CommonPopup';
import { useFocusEffect } from '@react-navigation/native';

const Reservation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reservation' | 'history'>('reservation');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showTimeSelect, setShowTimeSelect] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentViewMonth, setCurrentViewMonth] = useState<number>(new Date().getMonth());
  const [currentViewYear, setCurrentViewYear] = useState<number>(new Date().getFullYear());
  const [timeOptions, setTimeOptions] = useState<CenterScheduleInfo[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [warningPopupVisible, setWarningPopupVisible] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [reservingLoading, setReservingLoading] = useState<boolean>(false);
  const [successPopupVisible, setSuccessPopupVisible] = useState<boolean>(false);
  const [reserveErrorPopupVisible, setReserveErrorPopupVisible] = useState<boolean>(false);
  const [reserveErrorMessage, setReserveErrorMessage] = useState<string>('');
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [memberSchedules, setMemberSchedules] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const memberInfo = useAppSelector(state => state.member.memberInfo);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 모달 드래그 관련 상태와 핸들러
  const pan = useRef(new Animated.ValueXY()).current;
  
  const panResponder = useRef(
    PanResponder.create({
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
    })
  ).current;

  useEffect(() => {
    if (modalVisible) {
      pan.setValue({ x: 0, y: 0 });
    }
  }, [modalVisible, pan]);

  // AM/PM을 오전/오후로 변환하는 함수
  const formatTimeToKorean = (timeString: string): string => {
    if (!timeString) {
      return '';
    }
    
    // "4:00 PM", "7:00 AM" 등의 형식에서 AM/PM을 추출하고 오전/오후로 변환
    if (timeString.includes('AM')) {
      // "7:00 AM" -> "오전 7:00"로 변환
      const timePart = timeString.replace('AM', '').trim();
      return `오전 ${timePart}`;
    } else if (timeString.includes('PM')) {
      // "4:00 PM" -> "오후 4:00"로 변환
      const timePart = timeString.replace('PM', '').trim();
      return `오후 ${timePart}`;
    }
    
    // 이미 변환되었거나 다른 형식인 경우 그대로 반환
    return timeString;
  };

  // API에서 시간표 데이터 가져오기
  useFocusEffect(
    useCallback(() => {
      const fetchScheduleData = async () => {
        try {
          const response = await getCenterScheduleList(memberInfo?.center_id);
          if (response.success && response.data) {
            setTimeOptions(response.data);
          } else {
          }
        } catch (err) {
          console.error('시간표 로딩 오류:', err);
        } finally {
        }
      };

      fetchScheduleData();
    }, [])
  );

  // 회원의 예약된 스케줄 목록 가져오기
  useFocusEffect(
    useCallback(() => {
      const fetchMemberSchedules = async () => {
        if (!memberInfo?.mem_id) return;
        
        try {
          setHistoryLoading(true);
          const response = await getMemberScheduleList(Number(memberInfo.mem_id));

          if (response.success && response.data) {
            // sch_dt 형식이 YYYYMMDD 이므로 YYYY-MM-DD 형식으로 변환
            const formattedDates = response.data.map(schedule => {
              const dt = schedule.sch_dt;
              if (dt.length === 8) {
                return `${dt.substring(0, 4)}-${dt.substring(4, 6)}-${dt.substring(6, 8)}`;
              }
              return dt;
            });


            setScheduledDates(formattedDates);
            
            // API에서 이미 정렬된 데이터를 사용
            setMemberSchedules(response.data);

          }
        } catch (err) {
          console.error('회원 스케줄 조회 오류:', err);
        } finally {
          setHistoryLoading(false);
        }
      };

      fetchMemberSchedules();
    }, [])
  );

  // 현재 날짜 정보 가져오기
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  
  // 표시 중인 월의 마지막 날짜 가져오기
  const lastDayOfMonth = new Date(currentViewYear, currentViewMonth + 1, 0).getDate();
  
  // 표시 중인 월의 1일이 무슨 요일인지 가져오기 (0: 일요일, 1: 월요일, ...)
  const firstDayOfMonth = new Date(currentViewYear, currentViewMonth, 1).getDay();
  
  // 달력에 표시할 날짜 배열 생성
  const calendarDays = [];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  
  // 빈 칸 채우기 (이전 달의 날짜)
  for (let i = 0; i < firstDayOfMonth; i++) {
    // 이전 달의 마지막 날짜부터 역순으로 계산
    const prevMonthLastDate = new Date(currentViewYear, currentViewMonth, 0).getDate();
    const prevMonthDate = prevMonthLastDate - (firstDayOfMonth - 1) + i;
    calendarDays.push({day: prevMonthDate, isPrevMonth: true});
  }
  
  // 이번 달 날짜 채우기
  for (let i = 1; i <= lastDayOfMonth; i++) {
    calendarDays.push({day: i, isCurrentMonth: true});
  }
  
  // 다음 달 날짜 채우기 (달력의 마지막 줄을 채우기 위해)
  const remainingDays = 7 - (calendarDays.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({day: i, isNextMonth: true});
    }
  }
  
  const handleDateSelect = (day: number, isCurrentMonth: boolean, isPrevMonth: boolean, isNextMonth: boolean) => {
    let year = currentViewYear;
    let month = currentViewMonth;
    
    if (isPrevMonth) {
      if (month === 0) {
        month = 11;
        year = year - 1;
      } else {
        month = month - 1;
      }
    } else if (isNextMonth) {
      if (month === 11) {
        month = 0;
        year = year + 1;
      } else {
        month = month + 1;
      }
    }
    
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 이미 예약된 날짜인지 확인
    if (scheduledDates.includes(formattedDate)) {
      // 토스트 메시지 표시
      if (Platform.OS === 'android') {
        ToastAndroid.show('이미 예약이 된 날짜입니다', ToastAndroid.SHORT);
      } else {
        // iOS의 경우 Alert로 대체
        Alert.alert('알림', '이미 예약이 된 날짜입니다');
      }
      return; // 이미 예약된 날짜는 선택하지 않음
    }
    
    setSelectedDate(formattedDate);
    setValidationError(null);
  };

  const goToPreviousMonth = () => {
    if (currentViewMonth === 0) {
      setCurrentViewMonth(11);
      setCurrentViewYear(currentViewYear - 1);
    } else {
      setCurrentViewMonth(currentViewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentViewMonth === 11) {
      setCurrentViewMonth(0);
      setCurrentViewYear(currentViewYear + 1);
    } else {
      setCurrentViewMonth(currentViewMonth + 1);
    }
  };

  const handleReservation = () => {
    // 시간과 날짜 유효성 검사
    if (!selectedTime) {
      setValidationError('시간을 선택해주세요.');
      setWarningPopupVisible(true);
      return;
    }
    
    if (!selectedDate) {
      setValidationError('날짜를 선택해주세요.');
      setWarningPopupVisible(true);
      return;
    }
    
    // 모든 유효성 검사를 통과하면 모달 표시
    setValidationError(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const closeWarningPopup = () => {
    setWarningPopupVisible(false);
  };

  const closeSuccessPopup = () => {
    setSuccessPopupVisible(false);
  };

  const closeReserveErrorPopup = () => {
    setReserveErrorPopupVisible(false);
  };

  const confirmReservation = async () => {
    try {
      // 예약 전 로딩 상태로 변경
      setReservingLoading(true);

      // 선택한 시간의 sch_id 찾기
      const selectedSchedule = timeOptions.find(option => option.sch_time === selectedTime);
      if (!selectedSchedule) {
        throw new Error('선택한 시간의 스케줄 정보를 찾을 수 없습니다.');
      }

      // YYYY-MM-DD 형식의 날짜를 YYYYMMDD 형식으로 변환
      const formattedDate = selectedDate.replace(/-/g, '');

      // API 호출
      const response = await insertMemberSchedule(
        memberInfo?.mem_id ? Number(memberInfo.mem_id) : 0,
        selectedSchedule.sch_id,
        formattedDate
      );

      // 모달 닫기
      setModalVisible(false);

      // 성공 처리
      if (response.success) {
        setSuccessPopupVisible(true);
        // 예약 성공 후 선택 초기화
        setSelectedTime('');
        setSelectedDate('');
      } else {
        // 서버에서 오류 메시지가 있는 경우
        setReserveErrorMessage(response.message || '예약 처리 중 오류가 발생했습니다.');
        setReserveErrorPopupVisible(true);
      }
    } catch (err: any) {
      console.error('예약 오류:', err);
      setReserveErrorMessage(err.message || '예약 중 오류가 발생했습니다.');
      setReserveErrorPopupVisible(true);
    } finally {
      setReservingLoading(false);
    }
  };

  // 날짜에서 요일 추출
  const getWeekday = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekdayIndex = date.getDay();
    
    return weekdays[weekdayIndex];
  };

  // 날짜 표시 형식 변환 (YYYY-MM-DD -> MM.DD)
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    
    // YYYY-MM-DD에서 연도를 제외하고 MM.DD 형식으로 변환
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[1]}.${parts[2]}`;
    }
    
    return dateString.replace(/-/g, '.');
  };

  // 날짜 계산 관련 함수들
  const calculateDDay = (dateString: string) => {
    if (!dateString) return 0;
    
    // YYYYMMDD 형식을 Date 객체로 변환
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1; // 월은 0부터 시작
    const day = parseInt(dateString.substring(6, 8));
    
    const scheduleDate = new Date(year, month, day);
    const today = new Date();
    
    // 시간 부분은 무시하기 위해 날짜만 설정
    today.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);
    
    // 날짜 차이 계산 (밀리초 -> 일)
    const diffTime = scheduleDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const isSchedulePast = (dateString: string, timeString: string) => {
    if (!dateString || !timeString) return false;
    
    // 현재 시간
    const now = new Date();
    
    // 예약 날짜 및 시간 생성
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1;
    const day = parseInt(dateString.substring(6, 8));
    
    // 시간 파싱 (예: "7:00 PM" -> 시간:19, 분:0)
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
    
    // 예약 시간이 현재 시간보다 이전인지 확인
    return scheduleDateTime < now;
  };

  // YYYYMMDD 형식의 날짜를 YYYY.MM.DD 형식으로 변환
  const formatDateString = (dateString: string): string => {
    if (!dateString || dateString.length !== 8) return dateString;
    
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    
    return `${year}.${month}.${day}`;
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton]}
            onPress={() => setActiveTab('reservation')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'reservation' && styles.activeTabButtonText]}>
              예약하기
            </Text>
            {activeTab === 'reservation' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'history' && styles.activeTabButtonText]}>
              예약내역
            </Text>
            {activeTab === 'history' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>
        
        {activeTab === 'reservation' ? (
          <View style={styles.reservationContainer}>
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: scale(110)}}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>시간표 선택</Text>
                <View style={styles.selectBoxContainer}>
                  <TouchableOpacity 
                    style={styles.selectBox}
                    onPress={() => setShowTimeSelect(!showTimeSelect)}
                  >
                    <Text style={[
                      styles.selectBoxText,
                      selectedTime ? styles.selectedTimeText : null
                    ]}>
                      {selectedTime ? formatTimeToKorean(selectedTime) : '시간을 선택해주세요'}
                    </Text>
                    <Image 
                      source={showTimeSelect ? images.icons.arrowUpGray : images.icons.arrowDownGray} 
                      style={styles.selectArrow} 
                    />
                  </TouchableOpacity>
                </View>
                
                {showTimeSelect && (
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
                        {timeOptions.map((timeOption) => (
                          <TouchableOpacity
                            key={timeOption.sch_id}
                            style={[
                              styles.optionItem,
                              timeOption.sch_max_cap === 0 && styles.disabledOptionItem,
                              selectedTime === timeOption.sch_time && styles.selectedOptionItemBackground
                            ]}
                            disabled={timeOption.sch_max_cap === 0}
                            onPress={() => {
                              setSelectedTime(timeOption.sch_time);
                              setShowTimeSelect(false);
                              setValidationError(null);
                            }}
                          >
                            <View style={styles.optionTextContainer}>
                              <Text style={[
                                styles.optionText,
                                selectedTime === timeOption.sch_time && styles.selectedOptionItemText,
                                timeOption.sch_max_cap === 0 && styles.disabledOptionText
                              ]}>
                                {formatTimeToKorean(timeOption.sch_time)}
                              </Text>
                              {timeOption.sch_info && timeOption.sch_info.includes('키즈') && (
                                <Text style={[
                                  styles.optionInfoText,
                                  selectedTime === timeOption.sch_time && styles.selectedOptionItemText,
                                  timeOption.sch_max_cap === 0 && styles.disabledOptionText
                                ]}>
                                  키즈반
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    }
                  </View>
                )}
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>날짜 선택</Text>
                <View style={styles.calendarContainer}>
                  <View style={styles.calendarHeader}>
                    <Text style={styles.calendarHeaderText}>
                      {currentViewYear}년 {currentViewMonth + 1}월
                    </Text>
                    <View style={styles.calendarNavigation}>
                      <TouchableOpacity onPress={goToPreviousMonth}>
                        <Image 
                          source={images.icons.arrowLeftWhite} 
                          style={styles.navigationArrow} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={goToNextMonth}>
                        <Image source={images.icons.arrowRightWhite} style={styles.navigationArrow} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.calendarDayNames}>
                    {dayNames.map((day, index) => (
                      <Text 
                        key={index} 
                        style={[
                          styles.calendarDayNameText, 
                          index === 0 && styles.sundayText
                        ]}
                      >
                        {day}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.calendarDays}>
                    
                    {calendarDays.map((dayObj, index) => {
                      // 현재 월의 날짜인지 확인
                      const isCurrentMonth = dayObj.isCurrentMonth;
                      const isPrevMonth = dayObj.isPrevMonth;
                      const isNextMonth = dayObj.isNextMonth;
                      const day = dayObj.day;
                      
                      // 오늘 날짜인지 확인
                      const isToday = isCurrentMonth && day === currentDate && 
                                     currentViewMonth === currentMonth && 
                                     currentViewYear === currentYear;
                      
                      // 과거 날짜인지 확인
                      let checkPastYear = currentViewYear;
                      let checkPastMonth = currentViewMonth;
                      
                      if (isPrevMonth) {
                        if (checkPastMonth === 0) {
                          checkPastMonth = 11;
                          checkPastYear -= 1;
                        } else {
                          checkPastMonth -= 1;
                        }
                      } else if (isNextMonth) {
                        if (checkPastMonth === 11) {
                          checkPastMonth = 0;
                          checkPastYear += 1;
                        } else {
                          checkPastMonth += 1;
                        }
                      }
                      
                      const isPastDate = 
                        (checkPastYear < currentYear) || 
                        (checkPastYear === currentYear && checkPastMonth < currentMonth) || 
                        (checkPastYear === currentYear && checkPastMonth === currentMonth && day < currentDate);
                      
                      // 선택된 날짜인지 확인
                      let checkMonth = currentViewMonth;
                      let checkYear = currentViewYear;
                      
                      if (isPrevMonth) {
                        if (checkMonth === 0) {
                          checkMonth = 11;
                          checkYear = checkYear - 1;
                        } else {
                          checkMonth = checkMonth - 1;
                        }
                      } else if (isNextMonth) {
                        if (checkMonth === 11) {
                          checkMonth = 0;
                          checkYear = checkYear + 1;
                        } else {
                          checkMonth = checkMonth + 1;
                        }
                      }
                      
                      const checkDate = `${checkYear}-${String(checkMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelectedDate = selectedDate === checkDate;
                      
                      // 예약된 날짜인지 확인
                      const isScheduledDate = scheduledDates.includes(checkDate);
                      
                      return (
                        <TouchableOpacity 
                          key={index}
                          style={[styles.calendarDay]}
                          disabled={isPastDate || isNextMonth}
                          onPress={() => handleDateSelect(day, isCurrentMonth, isPrevMonth, isNextMonth)}
                        >
                          <View style={[
                            styles.calendarDaysScale, 
                            isSelectedDate && styles.selectedDayBackground,
                            isScheduledDate && styles.scheduledDayBackground
                          ]}>
                          <Text 
                            style={[
                              styles.calendarDayText,
                              (index % 7 === 0) && styles.sundayText,
                              isPastDate && styles.pastDayText,
                              (!isCurrentMonth) && styles.otherMonthText,
                              isSelectedDate && {color: '#FFFFFF', fontWeight: 'bold'}
                            ]}
                          >
                            {day}
                          </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.reserveButton} onPress={handleReservation}>
                  <Text style={styles.reserveButtonText}>예약하기</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.historyContainer}>
            {memberSchedules.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>예약 내역이 없습니다.</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: scale(20)}}
              >
                {memberSchedules.map((schedule, index) => {
                  const dDay = calculateDDay(schedule.sch_dt);
                  const isPast = isSchedulePast(schedule.sch_dt, schedule.sch_time);
                  
                  // 날짜 포맷팅
                  const formattedDate = formatDateString(schedule.sch_dt);
                  
                  // 시간 포맷팅
                  const formattedTime = formatTimeToKorean(schedule.sch_time);
                  
                  return (
                    <View key={index} style={styles.scheduleItem}>
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
                        
                        <View style={styles.checkCircle}>
                          {!isPast && <View style={styles.checkInner} />}
                        </View>
                      </View>
                      
                      <View style={styles.scheduleContent}>
                        <Text style={styles.centerName}>
                          {memberInfo?.center_name || '점핑 센터'}
                        </Text>
                        <Text style={styles.scheduleDateTime}>
                          일시: {formattedDate} {formattedTime}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
      </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
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
              
              <View style={styles.reservationDetailContainer}>
                <View style={styles.detailItem}>
                  <Image source={images.icons.calendarGreen} style={styles.detailIcon} />
                  <View>
                    <Text style={styles.detailValue}>
                      {formatDateDisplay(selectedDate)} ({getWeekday(selectedDate)})
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailItem}>
                  <Image source={images.icons.clockGreen} style={styles.detailIcon} />
                  <View>
                    <Text style={styles.detailValue}>{formatTimeToKorean(selectedTime)}</Text>
                  </View>
                </View>
              </View>
            
              <View style={{marginBottom: scale(10)}}>
                <Text style={styles.lateText}>늦지 않게 출석해 주세요:)</Text>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={styles.modalCancelButton} 
                  onPress={closeModal}
                  disabled={reservingLoading}
                >
                  <Text style={styles.modalCancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalConfirmButton} 
                  onPress={confirmReservation}
                  disabled={reservingLoading}
                >
                  {reservingLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>확인</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <CommonPopup
        visible={warningPopupVisible}
        message={validationError || ''}
        type="warning"
        onConfirm={closeWarningPopup}
      />

      <CommonPopup
        visible={successPopupVisible}
        message="예약이 완료되었습니다."
        type="default"
        onConfirm={closeSuccessPopup}
      />

      <CommonPopup
        visible={reserveErrorPopupVisible}
        message={reserveErrorMessage}
        type="warning"
        onConfirm={closeReserveErrorPopup}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    paddingTop: scale(30),
  },
  text: {
    fontSize: scale(24),
    fontWeight: 'bold',
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
    fontWeight: '500',
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
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
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
    color: '#717171',
    fontSize: scale(14),
  },
  optionInfoText: {
    color: '#717171',
    fontSize: scale(12),
    marginLeft: scale(8),
  },
  calendarContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(15),
    borderWidth: 1,
    borderColor: '#D9D9D9'
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
    marginLeft: scale(12),
  },
  calendarHeaderText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '500',
    textAlign: 'left',
  },
  calendarNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationArrow: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain',
    marginHorizontal: scale(8),
  },
  calendarDayNames: {
    flexDirection: 'row',
    marginBottom: scale(8),
  },
  calendarDayNameText: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: scale(12),
  },
  sundayText: {
    color: '#FF6B6B',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: `${100 / 7}%`,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: scale(12),
  },
  calendarDaysScale: {
    width: scale(25),
    height: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    color: '#F6F6F6',
    fontSize: scale(12),
  },
  pastDayText: {
    color: '#717171',
  },
  selectedDayBackground: {
    backgroundColor: '#656565',
    borderRadius: scale(50),
  },
  otherMonthText: {
    color: '#717171'
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
    fontWeight: '500',
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
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
  },
  modalText: {
    color: '#D9D9D9',
    fontSize: scale(14),
    marginBottom: scale(20),
  },
  reservationDetailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderRadius: scale(12),
    padding: scale(15),
    marginBottom: scale(20),
  },
  detailItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  detailIcon: {
    width: scale(20),
    height: scale(20),
    marginRight: scale(10),
    tintColor: '#FFFFFF',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '500',
  },
  modalFooter: {
    marginTop: 'auto',
    paddingTop: scale(10),
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
    fontWeight: '500',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '500',
  },
  lateText: {
    color: '#D9D9D9',
    fontSize: scale(12),
    fontWeight: '500',
    textAlign: 'center',
  },
  scheduledDayBackground: {
    backgroundColor: '#40B649',
    borderRadius: scale(50),
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: scale(16),
    paddingTop: scale(20),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: scale(16),
  },
  scheduleItem: {
    backgroundColor: '#373737',
    borderRadius: scale(12),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: '#D9D9D9',
    overflow: 'hidden',
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
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(4),
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
    fontWeight: 'bold',
  },
  checkCircle: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    borderWidth: 2,
    borderColor: '#40B649',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInner: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#40B649',
  },
  scheduleContent: {
    paddingHorizontal: scale(15),
    paddingBottom: scale(15),
  },
  centerName: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
    marginBottom: scale(8),
  },
  scheduleDateTime: {
    color: '#D9D9D9',
    fontSize: scale(14),
  },
});

export default Reservation; 