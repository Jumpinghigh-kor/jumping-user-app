import React, {useEffect, useMemo, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  FlatList,
  ToastAndroid,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../hooks/useAuth';
import {scale} from '../utils/responsive';
import {getCheckinLogList} from '../api/services/checkinService';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/AuthStackNavigator';
import CommonPopup from '../components/CommonPopup';
import LinearGradient from 'react-native-linear-gradient';
import {getMemberExerciseAppInfo, getMemberExerciseAppList} from '../api/services/memberExerciseAppService';
import {insertMemberExerciseGoal, updateMemberExerciseGoal, getMemberExerciseGoal} from '../api/services/memberExerciseGoalService';
import IMAGES from '../utils/images';
import { useProfileImage } from '../hooks/useProfileImage';
import ProfileImagePicker from '../components/ProfileImagePicker';
import HomeBannerImgPicker from '../components/HomeBannerImgPicker';
import ExerciseGraph from '../components/ExerciseGraph';
import ExerciseInfoPopup from '../components/ExerciseInfoPopup';
import WaveAnimation from '../components/WaveAnimation';
import { commonStyle } from '../assets/styles/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getNoticesAppList} from '../api/services/noticesAppService';
import {getInquiryList} from '../api/services/inquiryService';
import { updatePushToken, updateRecentDt } from '../api/services/membersService';
import pushNotificationService from '../api/services/pushNotificationService';
import CustomToast from '../components/CustomToast';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// 배너 아이템 인터페이스 정의
interface BannerItem {
  imageUrl: string;
  linkUrl: string;
}

type Period = '일' | '주' | '월' | '연';

const Home = () => {
  const insets = useSafeAreaInsets();
  const {memberInfo, loadMemberInfo} = useAuth();
  const { profileImageUrl, loadProfileImage } = useProfileImage(memberInfo?.mem_id);
  const [checkinLogs, setCheckinLogs] = useState<string[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('일');
  const [activeCategory, setActiveCategory] = useState<'칼로리' | '심박수'>('칼로리');
  const [accumulatedData, setAccumulatedData] = useState({
    totalCalories: 0,
    averageHeartRate: 0,
  });
  const [todayExerciseData, setTodayExerciseData] = useState({
    todayCalories: 0,
    todayJumpingCalories: 0,
    todayOtherCalories: 0,
    todayHeartRate: 0,
  });
  const [showExerciseGoalPopup, setShowExerciseGoalPopup] = useState(false);
  const [goalCalories, setGoalCalories] = useState('');
  const [goalErrorMessage, setGoalErrorMessage] = useState('');
  const [currentGoalCalories, setCurrentGoalCalories] = useState<number>(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const ref = useRef<ScrollView>(null);
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [customToastMessage, setCustomToastMessage] = useState('');
  const [bannerKey, setBannerKey] = useState(0);

  // 푸시 토큰 가져와서 서버에 전송
  const initializePushToken = async () => {
    try {
      if (!memberInfo?.mem_id) {
        return false;
      }

      const token = await pushNotificationService.getFCMToken();
      if (!token) {
        console.log('FCM 토큰을 가져올 수 없습니다.');
        return false;
      }

      // 토큰을 AsyncStorage에 저장
      await AsyncStorage.setItem('fcm_token', token);

      // updatePushToken API 호출
      const response = await updatePushToken({
        mem_id: memberInfo.mem_id,
        push_token: token,
      });

      if (response.success) {
        console.log('서버로 토큰 전송 성공:', { token, userId: memberInfo.mem_id, platform: Platform.OS });
        return true;
      } else {
        console.error('서버로 토큰 전송 실패:', response.message);
        return false;
      }
    } catch (error) {
      console.error('푸시 토큰 초기화 실패:', error);
      return false;
    }
  };

  const updateRecentDtFn = async () => {
    try {
      // memberInfo.mem_id가 유효한지 확인
      if (!memberInfo?.mem_id) {
        console.log('회원 정보가 없어 최근 접속일 업데이트를 건너뜁니다.');
        return;
      }

      const response = await updateRecentDt(Number(memberInfo.mem_id));
      console.log(response);
    } catch (error) {
      console.error('최근 접속일 업데이트 중 문제가 발생했습니다.', error);
    }
  };

  // 읽지 않은 알림이 있는지 체크
  const checkUnreadNotifications = async () => {
    try {
      // memberInfo.mem_id가 유효한지 확인
      if (!memberInfo?.mem_id) {
        console.log('회원 정보가 없어 알림 체크를 건너뜁니다.');
        return;
      }

      // 읽은 공지사항 가져오기
      const readNoticesStr = await AsyncStorage.getItem('readNotices');
      const readNotices = readNoticesStr ? JSON.parse(readNoticesStr) : [];
      
      // 읽은 문의 가져오기
      const readInquiriesStr = await AsyncStorage.getItem('readInquiries');
      const readInquiries = readInquiriesStr ? JSON.parse(readInquiriesStr) : [];
      
      // 공지사항 목록 가져오기
      const noticesResponse = await getNoticesAppList();
      let hasUnreadNotice = false;
      if (noticesResponse.success && noticesResponse.data) {
        hasUnreadNotice = noticesResponse.data.some(notice => 
          !readNotices.includes(notice.notices_app_id)
        );
      }
      
      // 문의 목록 가져오기
      const inquiriesResponse = await getInquiryList({mem_id: parseInt(memberInfo.mem_id, 10)});
      let hasUnreadInquiry = false;
      if (inquiriesResponse.success && inquiriesResponse.data) {
        hasUnreadInquiry = inquiriesResponse.data.some(inquiry => 
          inquiry.answer && !readInquiries.includes(inquiry.inquiry_app_id)
        );
      }
      
      // 하나라도 읽지 않은 알림이 있으면 true로 설정
      setHasUnreadNotifications(hasUnreadNotice || hasUnreadInquiry);
    } catch (error) {
      console.error('알림 체크 실패:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // memberInfo.mem_id가 유효할 때만 실행
      if (memberInfo?.mem_id) {
        loadProfileImage();
        checkUnreadNotifications();
        setBannerKey(prev => prev + 1);  // HomeBannerImgPicker 재렌더링 강제
        updateRecentDtFn();
      }
    }, [memberInfo?.mem_id]),
  );

  useEffect(() => {
    // AsyncStorage에서 회원 ID를 불러와 회원 정보 조회
    loadMemberInfo();
  }, []);

  // 푸시 알림 초기화 (회원 정보 로드 후 한 번만 실행)
  useEffect(() => {
    if (memberInfo?.mem_id) {
      // FCM 토큰이 이미 있는지 확인
      const checkAndInitializePushToken = async () => {
        try {
          const existingToken = await AsyncStorage.getItem('fcm_token');
          if (!existingToken) {
            initializePushToken();
          }
        } catch (error) {
          console.log('FCM 토큰 확인 중 오류:', error);
        }
      };
      
      checkAndInitializePushToken();
    }
  }, [memberInfo?.mem_id]);

  // 출석 기록 가져오기
  useFocusEffect(
    React.useCallback(() => {
      const fetchCheckinLogs = async () => {
        if (memberInfo?.mem_id) {
          try {
            const today = new Date();
            const response = await getCheckinLogList({
              year: today.getFullYear(),
              month: today.getMonth() + 1,
              mem_id: Number(memberInfo.mem_id),
            });

            if (response.success) {
              // 출석 날짜만 추출 (YYYY-MM-DD 형식에서 DD만 추출)
              const checkinDates = response.data ? response.data.map(log => {
                const dateParts = log.ci_date_only.split('-');
                return dateParts[2]; // 일자만 반환
              }) : [];
              setCheckinLogs(checkinDates);
            }
          } catch (error) {
            console.error('출석 기록 조회 실패:', error);
          }
        }
      };

      fetchCheckinLogs();
    }, [memberInfo]),
  );

  // 7일 출석 데이터 생성 (출석 캘린더용)
  const sevenDaysData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const currentDate = today.getDate();

    // 이번 달의 마지막 날짜 구하기
    const lastDay = new Date(year, month + 1, 0).getDate();

    // 이번 달 전체 날짜 배열 생성
    const currentMonthDates = Array.from({length: lastDay}, (_, i) => {
      const date = i + 1;
      const dateObj = new Date(year, month, date);
      const day = dateObj.getDay();
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dateStr = date < 10 ? `0${date}` : `${date}`;
      const isCheckedIn = checkinLogs.includes(dateStr);

      return {
        id: String(date),
        date,
        day: dayNames[day],
        isToday: date === currentDate,
        isPast: date < currentDate,
        isCheckedIn: isCheckedIn,
      };
    });

    // 오늘 날짜의 인덱스 찾기
    const todayIndex = currentMonthDates.findIndex(item => item.isToday);
    
    // 시작 인덱스 계산 (오늘 날짜 - 3, 최소 0)
    let startIndex = Math.max(0, todayIndex - 3);
    
    // 만약 남은 날짜가 7일보다 적다면 시작 인덱스 조정
    if (startIndex + 7 > currentMonthDates.length) {
      startIndex = Math.max(0, currentMonthDates.length - 7);
    }
    
    // 7일 데이터 추출
    return currentMonthDates.slice(startIndex, startIndex + 7);
  }, [checkinLogs]);

  // 현재 년월 문자열 생성
  const currentYearMonth = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth()는 0부터 시작하므로 1을 더함
    return `${year}년 ${month < 10 ? '0' + month : month}월`;
  }, []);


  const getTodayExerciseData = async () => {
    if (!memberInfo?.mem_id) return;
    
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const yearMonthDay = `${year}${month < 10 ? '0' + month : month}${day < 10 ? '0' + day : day}`;
      
      const response = await getMemberExerciseAppInfo(Number(memberInfo.mem_id), yearMonthDay);

      if (response.success && response.data) {
        const dataArray = Array.isArray(response.data) ? response.data : [response.data];
        const data = dataArray.length > 0 ? dataArray[0] : null;
        
        if (data) {
          let todayJumpingCalories = 0;
          let todayOtherCalories = 0;
          let todayTotalHeartRate = 0;
          let todayHeartRateCount = 0;
          
          // 실제 운동 데이터가 있는지 확인
          const hasJumpingExercise = data.jumping_exercise_time && data.jumping_exercise_time !== '0000';
          const hasOtherExercise = data.other_exercise_calory && data.other_exercise_calory > 0;
          
          // 오늘 점핑 칼로리 계산 - 실제 운동 시간이 있을 때만
          if (hasJumpingExercise) {
            let baseCalories = 0;
            switch (data.jumping_intensity_level) {
              case 'LOW':
                baseCalories = 300;
                break;
              case 'MODERATE':
                baseCalories = 400;
                break;
              case 'HIGH':
                baseCalories = 500;
                break;
              default:
                baseCalories = 0;
            }
            
            const hours = parseInt(data.jumping_exercise_time.substring(0, 2), 10);
            const minutes = parseInt(data.jumping_exercise_time.substring(2, 4), 10);
            const totalMinutes = hours * 60 + minutes;
            const timeRatio = totalMinutes / 60;
            todayJumpingCalories = Math.round(baseCalories * timeRatio);
          }
          
          // 오늘 기타 운동 칼로리 계산 - 기타 운동 칼로리가 있을 때만
          if (hasOtherExercise) {
            todayOtherCalories = data.other_exercise_calory || 0;
          }
          
          // 오늘 심박수 계산 - 실제 운동한 경우에만
          if (hasJumpingExercise) {
            let heartRate = 0;
            if (data.jumping_heart_rate && parseInt(data.jumping_heart_rate, 10) > 0) {
              heartRate = parseInt(data.jumping_heart_rate, 10);
            } else {
              switch (data.jumping_intensity_level) {
                case 'LOW':
                  heartRate = 110;
                  break;
                case 'MODERATE':
                  heartRate = 135;
                  break;
                case 'HIGH':
                  heartRate = 165;
                  break;
                default:
                  heartRate = 0;
              }
            }
            
            if (heartRate > 0) {
              todayTotalHeartRate = heartRate;
              todayHeartRateCount = 1;
            }
          }
          
          const todayAverageHeartRate = todayHeartRateCount > 0 ? Math.round(todayTotalHeartRate / todayHeartRateCount) : 0;
          const todayTotalCalories = todayJumpingCalories + todayOtherCalories;
          
          setTodayExerciseData({
            todayCalories: todayTotalCalories,
            todayJumpingCalories,
            todayOtherCalories,
            todayHeartRate: todayAverageHeartRate,
          });
        }
      }
    } catch (error) {
    }
  }

  // 운동 데이터 조회 함수를 별도로 정의
  const fetchExerciseData = async () => {
    if (memberInfo?.mem_id) {
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const yearMonth = `${year}${month < 10 ? '0' + month : month}`;
        
        const response = await getMemberExerciseAppList(Number(memberInfo.mem_id), yearMonth, 'day');

        if (response.success) {
          setExerciseData(Array.isArray(response.data) ? response.data || [] : [response.data || {}]);
        }

        // 누적 운동량 데이터 가져오기
        const allDataResponse = await getMemberExerciseAppList(Number(memberInfo.mem_id), 'all_date');
        
        if (allDataResponse.success) {
          const allExerciseData = Array.isArray(allDataResponse.data) ? allDataResponse.data || [] : [allDataResponse.data || {}];
          
          // 누적 데이터 계산
          let totalCalories = 0;
          let totalHeartRate = 0;
          let heartRateCount = 0;
          
          allExerciseData.forEach(data => {
            // 칼로리 계산
            let baseCalories = 0;
            switch (data.jumping_intensity_level) {
              case 'LOW':
                baseCalories = 300;
                break;
              case 'MODERATE':
                baseCalories = 400;
                break;
              case 'HIGH':
                baseCalories = 500;
                break;
              default:
                baseCalories = 0;
            }
            
            if (data.jumping_exercise_time) {
              const hours = parseInt(data.jumping_exercise_time.substring(0, 2), 10);
              const minutes = parseInt(data.jumping_exercise_time.substring(2, 4), 10);
              const totalMinutes = hours * 60 + minutes;
              const timeRatio = totalMinutes / 60;
              totalCalories += Math.round(baseCalories * timeRatio);
            } else {
              totalCalories += baseCalories;
            }
            
            // 심박수 계산
            let heartRate = 0;
            if (data.jumping_heart_rate && parseInt(data.jumping_heart_rate, 10) > 0) {
              heartRate = parseInt(data.jumping_heart_rate, 10);
            } else {
              switch (data.jumping_intensity_level) {
                case 'LOW':
                  heartRate = 110;
                  break;
                case 'MODERATE':
                  heartRate = 135;
                  break;
                case 'HIGH':
                  heartRate = 165;
                  break;
                default:
                  heartRate = 0;
              }
            }
            
            if (heartRate > 0) {
              totalHeartRate += heartRate;
              heartRateCount++;
            }
          });
          
          const averageHeartRate = heartRateCount > 0 ? Math.round(totalHeartRate / heartRateCount) : 0;
          
          setAccumulatedData({
            totalCalories,
            averageHeartRate,
          });
        }
      } catch (error) {
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchExerciseData();
      getTodayExerciseData();
    }, [memberInfo]),
  );

  // 목표 칼로리 팝업이 열릴 때 기존 데이터 조회
  useEffect(() => {
    const fetchExistingGoal = async () => {
      if (showExerciseGoalPopup && memberInfo?.mem_id) {
        try {
          const goalPeriod = selectedPeriod === '일' ? 'DAY' : 
                             selectedPeriod === '주' ? 'WEEK' : 
                             selectedPeriod === '월' ? 'MONTH' : 'YEAR';
          
          const existingGoal = await getMemberExerciseGoal(Number(memberInfo.mem_id), goalPeriod);
          
          if (existingGoal.success && existingGoal.data) {
            setGoalCalories(existingGoal.data.goal_calory);
          } else {
            setGoalCalories('');
          }
        } catch (error) {
          console.error('기존 목표 데이터 조회 실패:', error);
          setGoalCalories('');
        }
      }
    };

    fetchExistingGoal();
  }, [showExerciseGoalPopup, selectedPeriod, memberInfo?.mem_id]);

  // 선택된 기간에 따른 목표 칼로리 조회
  useEffect(() => {
    const fetchCurrentGoal = async () => {
      if (memberInfo?.mem_id) {
        try {
          const goalPeriod = selectedPeriod === '일' ? 'DAY' : 
                             selectedPeriod === '주' ? 'WEEK' : 
                             selectedPeriod === '월' ? 'MONTH' : 'YEAR';
          
          const existingGoal = await getMemberExerciseGoal(Number(memberInfo.mem_id), goalPeriod);
          
          if (existingGoal.success && existingGoal.data) {
            setCurrentGoalCalories(Number(existingGoal.data.goal_calory));
          } else {
            setCurrentGoalCalories(0);
          }
        } catch (error) {
          console.error('현재 목표 데이터 조회 실패:', error);
          setCurrentGoalCalories(0);
        }
      }
    };

    fetchCurrentGoal();
  }, [selectedPeriod, memberInfo?.mem_id]);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollViewContent, {flexGrow: 1, paddingBottom: scale(80)}]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        overScrollMode="always"
        scrollEnabled={true}
        bounces={true}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled">
        {/* 헤더 부분 */}

        {/* <View style={styles.gradientGreenContainer}>
          <Image 
            source={IMAGES.gradient.circleGreen}
            style={styles.gradientGreen}
            />
        </View> */}

        <View
          style={[
            styles.header,
            {paddingTop: Platform.OS === 'ios' ? insets.top : scale(16)},
          ]}>
          <View style={styles.emptySpace} />
          <View style={styles.profileSection}>
            <View pointerEvents="none">
              <ProfileImagePicker
                memId={memberInfo?.mem_id}
                currentImageUrl={profileImageUrl}
                onImageUpdate={loadProfileImage}
                showEditIcon={false}
              />
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('NoticesAppList')}
          >
            <Image 
              source={IMAGES.icons.bellWhite}
              style={styles.bellIcon}
            />
            {hasUnreadNotifications && (
              <Image 
                source={IMAGES.icons.exclamationMarkRed}
                style={styles.notificationDot}
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.contentSection}>
          <HomeBannerImgPicker key={bannerKey} />
        </View>

        <View style={styles.contentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>출석</Text>
              <Text style={styles.yearMonthText}>{currentYearMonth}</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('AttendanceRecord')}>
              <Text style={styles.viewAllText}>전체보기</Text>
              <Image 
                source={IMAGES.icons.arrowRightWhite} 
                style={styles.arrowRightIcon}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarContent}>
            {sevenDaysData.map(item => (
              <View key={`date-${item.date}`} style={styles.gradientOuterWrapper}>
                <View style={styles.gradientInnerWrapper}>
                  <LinearGradient
                    colors={['#43b546', '#43b546']}
                    start={{x: 0, y: 0}}
                    end={{x: 0, y: 1}}
                    style={styles.linearGradientDateWrapper}>
                    <TouchableOpacity
                      style={[styles.dateItem, item.isToday && styles.todayItem]}
                      onPress={() => {
                        if (item.isToday) {
                          if (item.isCheckedIn) {
                            // 오늘 날짜이고 출석한 경우 AttendancePopup 표시
                            setSelectedDate(item.date.toString());
                            setShowAttendancePopup(true);
                          } else {
                            // 오늘 날짜이고 출석하지 않은 경우 출석 팝업 표시
                            setShowPopup(true);
                          }
                        } else if (item.isCheckedIn) {
                          // 오늘이 아닌 날짜이고 출석한 경우 AttendancePopup 표시
                          setSelectedDate(item.date.toString());
                          setShowAttendancePopup(true);
                        } else {
                          // 출석하지 않은 날짜 클릭 시 토스트 메시지
                          setCustomToastMessage('출석한 요일을 클릭하면 운동 정보를 입력할 수 있습니다.');
                          setShowCustomToast(true);
                        }
                      }
                    }>
                    <View
                      style={[
                        styles.attendanceMark,
                        {
                          backgroundColor:
                            item.isCheckedIn && !item.isToday
                              ? '#6BC46A'
                              : item.isCheckedIn && item.isToday
                              ? '#A7EB45'
                              : '#5C5C5C',
                        },
                      ]}
                    />
                    <Text
                      style={[styles.dateDay, item.isToday && styles.todayText]}>
                      {item.day}
                    </Text>
                    <Text
                      style={[styles.dateNumber, item.isToday && styles.todayText]}>
                      {item.date}
                    </Text>
                  </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.contentSection]}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>운동 기록</Text>
            <TouchableOpacity onPress={() => setShowExerciseGoalPopup(true)}>
              <Image source={IMAGES.icons.plusCircleWhite} style={styles.plusIcon} />
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {/* 막대그래프 */}
            <ExerciseGraph
              selectedPeriod={selectedPeriod}
              activeCategory={activeCategory}
              onPeriodChange={setSelectedPeriod}
              onCategoryChange={setActiveCategory}
              memId={Number(memberInfo?.mem_id)}
              exerciseData={exerciseData}
              goalCalories={currentGoalCalories}
              onDateClick={(date) => {
                setSelectedDate(date);
                setShowAttendancePopup(true);
              }}
            />
          </View>
        </View>

        {/* 누적 운동량 섹션 */}
        <View style={[styles.contentSection]}>  
          <Text style={styles.sectionTitle}>오늘 운동량</Text>
          <View style={styles.exerciseSummaryContainer}>
            {/* 왼쪽 박스 */}
            <View style={styles.exerciseSummaryBox}>
              <View style={{width: '100%'}}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View>
                    <View style={[styles.iconCircle, {backgroundColor: '#FFFFFF'}]}>
                    <Image 
                        source={IMAGES.icons.heartWhite}
                        style={[styles.exerciseSummaryIcon, {tintColor: '#43B546'}]}
                        />
                    </View>
                  </View>
                  <Text style={styles.exerciseSummaryTitle}>심박수</Text>
                </View>
                <WaveAnimation />
                <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                  <Text style={styles.exerciseSummaryValue}>{todayExerciseData.todayHeartRate}</Text>
                  <Text style={{fontSize: scale(16), color: '#FFFFFF'}}> Bpm</Text>
                </View>
              </View>
            </View>
            
            {/* 오른쪽 컨테이너 */}
            <View style={styles.exerciseSummaryRightContainer}>
              {/* 오른쪽 위 박스 */}

              {/* 필요 휴식 시간 박스 */}
              <View style={styles.exerciseSummaryBoxSmall}>
                <View style={{flexDirection: 'column', justifyContent: 'space-between'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={styles.iconCircle}>
                      <Image 
                        source={IMAGES.icons.plusGreen}
                        style={styles.exerciseSummaryIcon}
                      />
                    </View>
                    <Text style={styles.exerciseSummaryTitle}>필요 휴식 시간</Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                    <Text style={styles.exerciseSummaryValue}>
                      {(() => {
                        const totalMinutes = Math.round(((todayExerciseData.todayCalories / 1000) * 120) * 0.75);
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        
                        if (totalMinutes === 0) return "0분";
                        if (hours === 0) return `${minutes}분`;
                        if (minutes === 0) return `${hours}시간`;
                        return `${hours}시간 ${minutes}분`;
                      })()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 필요 수면 시간 박스 */}
              <View style={styles.exerciseSummaryBoxSmall}>
                <View style={{flexDirection: 'column', justifyContent: 'space-between'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={styles.iconCircle}>
                      <Image 
                        source={IMAGES.icons.moonYellow}
                        style={styles.exerciseSummaryIcon}
                      />
                    </View>
                    <Text style={styles.exerciseSummaryTitle}>필요 수면 시간</Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                    <Text style={styles.exerciseSummaryValue}>
                      {(() => {
                        const totalMinutes = Math.round(8 * 60 + (todayExerciseData.todayCalories / 500) * 20);
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        
                        if (totalMinutes === 0) return "0분";
                        if (hours === 0) return `${minutes}분`;
                        if (minutes === 0) return `${hours}시간`;
                        return `${hours}시간 ${minutes}분`;
                      })()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 총 소모 칼로리 박스 */}
          <View style={[styles.exerciseSummaryBoxSmall, commonStyle.mt15]}>
            <View style={{flexDirection: 'column', justifyContent: 'space-between'}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={styles.iconCircle}>
                <Image 
                  source={IMAGES.icons.fireRed}
                  style={styles.exerciseSummaryIcon}
                />
                </View>
                <Text style={styles.exerciseSummaryTitle}>총 소모 칼로리</Text>

                <View style={{flexDirection: 'row', alignItems: 'center', marginLeft: scale(5)}}>
                  <Text style={[{fontSize: scale(18), color: '#FFFFFF'}]}>{todayExerciseData.todayCalories.toLocaleString()}</Text>
                  <Text style={{fontSize: scale(18), color: '#848484'}}> Kcal</Text>
                </View>
              </View>

              <View style={{flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-evenly', paddingHorizontal: scale(40)}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
                  <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: scale(20)}}>
                    <Image source={IMAGES.icons.trampolineWhite} style={{width: scale(40), height: scale(40), resizeMode: 'contain'}} />
                    <Text style={[commonStyle.mv10, {fontSize: scale(12), color: '#FFFFFF'}]}>점핑 소모칼로리</Text>
                    <Text style={{fontSize: scale(16), color: '#FFFFFF'}}> {todayExerciseData.todayJumpingCalories.toLocaleString()} <Text style={{fontSize: scale(16), color: '#848484'}}>Kcal</Text></Text>
                  </View>
                  <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: scale(20)}}>
                    <Image source={IMAGES.icons.runWhite} style={{width: scale(40), height: scale(40), resizeMode: 'contain'}} />
                    <Text style={[commonStyle.mv10, {fontSize: scale(12), color: '#FFFFFF'}]}>기타 소모칼로리</Text>
                    <Text style={{fontSize: scale(16), color: '#FFFFFF'}}> {todayExerciseData.todayOtherCalories.toLocaleString()} <Text style={{fontSize: scale(16), color: '#848484'}}>Kcal</Text></Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <CommonPopup
        visible={showPopup}
        title="출석"
        message="출석하러 가시겠습니까?"
        confirmText="확인"
        cancelText="닫기"
        onConfirm={() => {
          setShowPopup(false);
          navigation.navigate('Attendance');
        }}
        onCancel={() => setShowPopup(false)}
      />

      <ExerciseInfoPopup
        visible={showAttendancePopup}
        date={selectedDate}
        onClose={() => setShowAttendancePopup(false)}
        onExerciseInfoUpdated={() => {
          fetchExerciseData();
          getTodayExerciseData();
        }}
      />

      {/* 목표 칼로리 입력 팝업 */}
      <Modal
        visible={showExerciseGoalPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExerciseGoalPopup(false)}
      >
        <View style={styles.goalPopupOverlay}>
          <View style={styles.goalPopupContainer}>
            <Text style={styles.goalPopupTitle}>
              {selectedPeriod === '일' ? '일별' : 
               selectedPeriod === '주' ? '주별' : 
               selectedPeriod === '월' ? '월간' : '연간'} 희망 칼로리를 적어주세요
            </Text>
            
            <View style={styles.goalInputContainer}>
              <TextInput
                style={styles.goalInput}
                value={goalCalories}
                onChangeText={(text) => {
                  // 숫자만 입력 가능
                  const numericText = text.replace(/[^0-9]/g, '');
                  
                  // 최대값 제한
                  const maxValue = selectedPeriod === '일' ? 1500 : 
                                   selectedPeriod === '주' ? 6000 : 
                                   selectedPeriod === '월' ? 50000 : 500000;
                  
                  const numericValue = parseInt(numericText) || 0;
                  if (numericValue <= maxValue) {
                    setGoalCalories(numericText);
                    setGoalErrorMessage(''); // 유효한 입력일 때 에러 메시지 제거
                  } else {
                    const periodText = selectedPeriod === '일' ? '일별' : 
                                       selectedPeriod === '주' ? '주별' : 
                                       selectedPeriod === '월' ? '월간' : '연간';
                    const maxText = maxValue.toLocaleString();
                    setGoalErrorMessage(`${periodText}은 ${maxText}까지 입력할 수 있습니다.`);
                  }
                }}
                placeholder="0"
                placeholderTextColor="#999999"
                keyboardType="numeric"
                maxLength={6}
              />
              <Text style={styles.goalUnit}>Kcal</Text>
            </View>
            
            {goalErrorMessage && (
              <Text style={styles.goalErrorMessage}>{goalErrorMessage}</Text>
            )}
            
            <View style={styles.goalPopupButtons}>
              <TouchableOpacity 
                style={[styles.goalPopupButton, styles.goalCancelButton]}
                onPress={() => {
                  setShowExerciseGoalPopup(false);
                  setGoalErrorMessage('');
                }}
              >
                <Text style={styles.goalCancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.goalPopupButton, 
                  styles.goalConfirmButton,
                  !goalCalories && styles.goalDisabledButton
                ]}
                disabled={!goalCalories}
                onPress={async () => {
                  try {
                    const goalPeriod = selectedPeriod === '일' ? 'DAY' : 
                                       selectedPeriod === '주' ? 'WEEK' : 
                                       selectedPeriod === '월' ? 'MONTH' : 'YEAR';
                    
                    // 기존 목표 데이터 조회
                    const existingGoal = await getMemberExerciseGoal(Number(memberInfo?.mem_id), goalPeriod);

                    if (existingGoal.success && existingGoal.data) {
                      // 기존 데이터가 있으면 업데이트
                      await updateMemberExerciseGoal(
                        Number(memberInfo?.mem_id),
                        goalCalories,
                        existingGoal.data.exercise_goal_id
                      );
                    } else {
                      // 기존 데이터가 없으면 새로 등록
                      await insertMemberExerciseGoal(
                        Number(memberInfo?.mem_id),
                        goalCalories,
                        goalPeriod
                      );
                    }
                    
                    setShowExerciseGoalPopup(false);
                    setGoalErrorMessage('');
                    
                    // 현재 목표 칼로리 업데이트
                    setCurrentGoalCalories(Number(goalCalories));
                  } catch (error) {
                    // 에러가 발생해도 팝업은 닫기
                    setShowExerciseGoalPopup(false);
                    setGoalErrorMessage('');
                  }
                }}
              >
                <Text style={[
                  styles.goalConfirmButtonText
                ]}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    position: 'relative',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: scale(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
    marginTop: scale(20),
  },
  emptySpace: {
    width: '33.3%',
  },
  profileSection: {
    alignItems: 'center',
    width: '33.3%',
  },
  notificationButton: {
    width: '33.3%',
    position: 'relative',
  },
  notificationDot: {
    width: scale(8),
    height: scale(8),
    position: 'absolute',
    top: 0,
    right: scale(2),
    resizeMode: 'contain',
  },
  contentSection: {
    marginBottom: scale(24),
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontWeight: 'bold',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  yearMonthText: {
    color: '#999999',
    fontSize: scale(12),
    marginLeft: scale(8),
    alignSelf: 'flex-end',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#999999',
    fontSize: scale(12),
    marginRight: scale(2),
  },
  card: {
    backgroundColor: '#373737',
    borderRadius: scale(15),
    justifyContent: 'center',
    marginTop: scale(20),
  },
  calendarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradientOuterWrapper: {
    borderRadius: scale(50),
    backgroundColor: '#43b546',
  },
  gradientInnerWrapper: {
    borderRadius: scale(50),
    margin: scale(1),
    overflow: 'hidden',
  },
  linearGradientDateWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateItem: {
    backgroundColor: '#333333',
    borderColor: '#6BC46A',
    borderRadius: scale(30),
    paddingVertical: scale(10),
    paddingHorizontal: scale(10),
    alignItems: 'center',
  },
  todayItem: {
    backgroundColor: '#40B649',
  },
  dateDay: {
    color: '#999999',
    fontSize: scale(12),
  },
  dateNumber: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  todayText: {
    color: '#FFFFFF',
  },
  attendanceMark: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(10),
    marginBottom: scale(5),
  },
  categoryButtonsContainer: {
    flexDirection: 'row',
    paddingRight: scale(10),
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(6),
    paddingHorizontal: scale(16),
    borderRadius: scale(20),
    backgroundColor: '#444444',
    marginRight: scale(10),
  },
  categoryButtonActive: {
    backgroundColor: '#43B546',
  },
  categoryButtonText: {
    color: '#FFFFFF',
    fontSize: scale(12),
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  categoryButtonIcon: {
    width: scale(12),
    height: scale(12),
    marginRight: scale(4),
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  totalSummary: {
    flexDirection: 'column',
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontWeight: 'bold',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: scale(14),
  },
  periodSelectorContainer: {
    position: 'relative',
    flexDirection: 'row',
  },
  periodSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodSelectorText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    marginRight: scale(5),
  },
  iconImage: {
    width: scale(8),
    height: scale(8),
  },
  periodDropdown: {
    position: 'absolute',
    top: scale(30),
    right: 0,
    width: scale(80),
    backgroundColor: '#444444',
    borderRadius: scale(10),
    paddingVertical: scale(5),
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  periodDropdownItem: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(10),
  },
  periodDropdownText: {
    color: '#FFFFFF',
    fontSize: scale(12),
  },
  bellIcon: {
    width: scale(24),
    height: scale(24),
    resizeMode: 'contain',
    alignSelf: 'flex-end'
  },
  arrowRightIcon: {
    width: scale(16),
    height: scale(16),
    tintColor: '#999999',
  },
  categoryButtonsScrollView: {
    flexDirection: 'row',
    marginBottom: scale(20),
  },
  exerciseSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(15),
  },
  exerciseSummaryBox: {
    width: '48%',
    backgroundColor: '#43B546',
    borderRadius: scale(15),
    padding: scale(15),
    justifyContent: 'space-between',
    flexDirection: 'row',
    maxHeight: scale(200),
  },
  exerciseSummaryTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  exerciseSummaryValue: {
    color: '#FFFFFF',
    fontSize: scale(18),
    marginTop: scale(14),
  },
  exerciseSummaryIcon: {
    width: scale(12),
    height: scale(12),
    resizeMode: 'contain',
  },
  exerciseSummaryRightContainer: {
    width: '48%', 
    height: scale(150),
    justifyContent: 'space-between',
  },
  exerciseSummaryBoxSmall: {
    marginBottom: scale(10),
    backgroundColor: '#444444',
    borderRadius: scale(15),
    padding: scale(10),
    justifyContent: 'space-between',
    flexDirection: 'row',
    minHeight: scale(95),
    paddingVertical: scale(18),
    paddingHorizontal: scale(15),
  },
  iconCircle: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(20),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  profileImageContainer: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(50),
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientGreenContainer: {
    width: scale(500),
    height: scale(500),
    position: 'absolute',
    top: 50,
    left: 0,
  },
  gradientGreen: {
    width: scale(300),
    height: scale(300),
    resizeMode: 'contain',
  },
  plusIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  goalPopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalPopupContainer: {
    backgroundColor: '#373737',
    borderRadius: scale(10),
    padding: scale(24),
    width: '80%',
    maxWidth: scale(400),
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalPopupTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: scale(14),
    fontWeight: 'bold',
    marginBottom: scale(20),
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalInput: {
    color: '#FFFFFF',
    fontSize: scale(16),
    marginRight: scale(10),
    textAlign: 'right',
  },
  goalUnit: {
    color: '#848484',
    fontSize: scale(16),
  },
  goalPopupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  goalPopupButton: {
    flex: 1,
    padding: scale(10),
    borderRadius: scale(30),
    backgroundColor: '#444444',
    alignItems: 'center',
    marginTop: scale(20),
  },
  goalCancelButton: {
    backgroundColor: '#848484',
  },
  goalCancelButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  goalConfirmButton: {
    backgroundColor: '#43B546',
  },
  goalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  goalErrorMessage: {
    color: '#F04D4D',
    fontSize: scale(12),
    marginTop: scale(10),
  },
  goalDisabledButton: {
    backgroundColor: '#848484',
  },
});

export default Home;

