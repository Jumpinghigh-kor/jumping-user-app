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
  Animated,
  Easing,
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
import {getMemberExerciseInfo, getMemberExerciseList} from '../api/services/memberExerciseService';
import IMAGES from '../utils/images';
import { useProfileImage } from '../hooks/useProfileImage';
import ProfileImagePicker from '../components/ProfileImagePicker';
import HomeBannerImgPicker from '../components/HomeBannerImgPicker';
import ExerciseInfoPopup from '../components/ExerciseInfoPopup';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// 배너 아이템 인터페이스 정의
interface BannerItem {
  imageUrl: string;
  linkUrl: string;
}

const Home = () => {
  const insets = useSafeAreaInsets();
  const {memberInfo, loadMemberInfo} = useAuth();
  const { profileImageUrl, loadProfileImage } = useProfileImage(memberInfo?.mem_id);
  const [checkinLogs, setCheckinLogs] = useState<string[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const [showPopup, setShowPopup] = useState(false);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [activeCategory, setActiveCategory] = useState('칼로리');
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'일' | '주' | '월' | '연'>('일');
  const [showPeriodSelect, setShowPeriodSelect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accumulatedData, setAccumulatedData] = useState({
    totalCalories: 0,
    totalDistance: 0,
    averageHeartRate: 0,
  });
  const ref = useRef<ScrollView>(null);

  // 파동 애니메이션 값
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;

  // 운동 정보 새로고침 함수
  const refreshExerciseData = React.useCallback(async () => {
    if (memberInfo?.mem_id) {
      try {
        setIsLoading(true);
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        
        // 현재 월의 yearMonth 포맷 생성 (YYYYMM)
        const yearMonth = `${year}${month < 10 ? '0' + month : month}`;
        
        // 선택된 기간 값을 영어로 변환
        let periodValue = 'day';
        switch (selectedPeriod) {
          case '일':
            periodValue = 'day';
            break;
          case '주':
            periodValue = 'week';
            break;
          case '월':
            periodValue = 'month';
            break;
          case '연':
            periodValue = 'year';
            break;
          default:
            periodValue = 'day';
        }
        
        // 운동 정보 API 호출 (기간 값 전달)
        const response = await getMemberExerciseList(Number(memberInfo.mem_id), yearMonth, periodValue);
        
        if (response.success) {
          setExerciseData(Array.isArray(response.data) ? response.data || [] : [response.data || {}]);
        }

        // 누적 운동량 데이터 가져오기
        const allDataResponse = await getMemberExerciseList(Number(memberInfo.mem_id), 'all_date');
        
        if (allDataResponse.success) {
          
          const allExerciseData = Array.isArray(allDataResponse.data) ? allDataResponse.data || [] : [allDataResponse.data || {}];
          
          // 누적 데이터 계산
          let totalCalories = 0;
          let totalDistance = 0;
          let totalHeartRate = 0;
          let heartRateCount = 0;
          
          allExerciseData.forEach(data => {
            // 칼로리 계산
            let baseCalories = 0;
            switch (data.intensity_level) {
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
            
            // 운동 시간에 따른 칼로리 조정
            if (data.exercise_time) {
              const hours = parseInt(data.exercise_time.substring(0, 2), 10);
              const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
              const totalMinutes = hours * 60 + minutes;
              
              const timeRatio = totalMinutes / 60;
              totalCalories += Math.round(baseCalories * timeRatio);
            } else {
              totalCalories += baseCalories;
            }
            
            // 뛴거리 계산
            let baseDistance = 0;
            switch (data.intensity_level) {
              case 'LOW':
                baseDistance = 1.5;
                break;
              case 'MODERATE':
                baseDistance = 4.5;
                break;
              case 'HIGH':
                baseDistance = 9.5;
                break;
              default:
                baseDistance = 0;
            }
            
            // 운동 시간에 따른 거리 조정
            if (data.exercise_time) {
              const hours = parseInt(data.exercise_time.substring(0, 2), 10);
              const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
              const totalMinutes = hours * 60 + minutes;
              
              const timeRatio = totalMinutes / 60;
              totalDistance += baseDistance * timeRatio;
            } else {
              totalDistance += baseDistance;
            }
            
            // 심박수 계산
            let heartRate = 0;
            if (data.heart_rate && parseInt(data.heart_rate, 10) > 0) {
              heartRate = parseInt(data.heart_rate, 10);
            } else {
              switch (data.intensity_level) {
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
          
          // 평균 심박수 계산
          const averageHeartRate = heartRateCount > 0 ? Math.round(totalHeartRate / heartRateCount) : 0;
          
          // 누적 데이터 설정
          setAccumulatedData({
            totalCalories,
            totalDistance,
            averageHeartRate,
          });
        }
      } catch (error) {
        console.error('운동 정보 조회 실패:', error);
        // 오류 발생 시 사용자에게 알림
        if (Platform.OS === 'android') {
          ToastAndroid.show('운동 정보를 불러오는데 실패했습니다.', ToastAndroid.SHORT);
        } else {
          Alert.alert('알림', '운동 정보를 불러오는데 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [memberInfo, selectedPeriod]);

  // 프로필 이미지 로드
  useFocusEffect(
    React.useCallback(() => {
      loadProfileImage();
    }, [memberInfo?.mem_id]),
  );

  // 이번 달 날짜 데이터 생성
  const currentMonthDates = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const currentDate = today.getDate();

    // 이번 달의 마지막 날짜 구하기
    const lastDay = new Date(year, month + 1, 0).getDate();

    // 날짜 배열 생성
    return Array.from({length: lastDay}, (_, i) => {
      const date = i + 1;
      const dateObj = new Date(year, month, date);
      const day = dateObj.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일

      // 요일 이름
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

      // 출석 여부 확인
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
  }, [checkinLogs]);

  // 현재 년월 문자열 생성
  const currentYearMonth = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth()는 0부터 시작하므로 1을 더함
    return `${year}년 ${month < 10 ? '0' + month : month}월`;
  }, []);

  // 7일 데이터 생성 (오늘 날짜 중심으로 앞뒤 3일씩 또는 주 단위)
  const sevenDaysData = useMemo(() => {
    const today = new Date();
    
    // 오늘 날짜의 인덱스 찾기
    const todayIndex = currentMonthDates.findIndex(item => item.isToday);
    
    // 시작 인덱스 계산 (오늘 날짜 - 3, 최소 0)
    let startIndex = Math.max(0, todayIndex - 3);
    
    // 만약 남은 날짜가 7일보다 적다면 시작 인덱스 조정
    if (startIndex + 7 > currentMonthDates.length) {
      startIndex = Math.max(0, currentMonthDates.length - 7);
    }
    
    // 7일 데이터 추출 (또는 남은 날짜만큼)
    return currentMonthDates.slice(startIndex, startIndex + 7);
  }, [currentMonthDates]);
  
  // 운동 기록용 주 데이터 생성
  const weeklyData = useMemo(() => {
    const today = new Date();
    
    // 선택한 기간이 '주'인 경우 이번달의 모든 주 표시
    if (selectedPeriod === '주') {
      const year = today.getFullYear();
      const month = today.getMonth();
      
      // 이번 달의 첫날과 마지막날 구하기
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // 이번 달의 첫 주 시작일 구하기 (일요일 기준)
      // 이번 달의 첫날보다 앞선 가장 가까운 일요일을 찾음
      const firstSunday = new Date(firstDayOfMonth);
      const dayOfWeek = firstDayOfMonth.getDay(); // 0: 일요일, 1: 월요일, ...
      
      // 첫 날이 일요일이 아니면, 이전 일요일로 조정
      if (dayOfWeek !== 0) {
        firstSunday.setDate(firstDayOfMonth.getDate() - dayOfWeek);
      }
      
      // 주 단위로 데이터 생성
      const weekData = [];
      let currentDate = new Date(firstSunday);
      let weekCounter = 1;
      
      // 주 계산
      while (true) {
        // 각 주의 범위 계산 (일요일 ~ 토요일)
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // 주의 중간 지점 (수요일)
        const weekMiddle = new Date(currentDate);
        weekMiddle.setDate(weekStart.getDate() + 3);
        
        // 이번 주가 현재 월에 포함되는지 확인
        // 1. 주의 중간이 이번 달에 포함되거나
        // 2. 주의 시작이 이번 달에 포함되거나
        // 3. 주의 끝이 이번 달에 포함된다면 이번 달의 주로 간주
        const isWeekInMonth = 
          (weekMiddle.getMonth() === month && weekMiddle.getFullYear() === year) ||
          (weekStart.getMonth() === month && weekStart.getFullYear() === year) ||
          (weekEnd.getMonth() === month && weekEnd.getFullYear() === year);
        
        if (isWeekInMonth) {
          // 주의 표시 이름 포맷팅
          const weekStartText = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
          const weekEndText = `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
          
          weekData.push({
            id: `week-${weekCounter}`,
            date: weekCounter, // 주차
            day: `${weekCounter}주`, // 표시할 텍스트
            weekDate: `${weekStartText}-${weekEndText}`, // 주 날짜 범위 (추가 정보용)
            isToday: false,
            isPast: weekEnd < today,
            isCheckedIn: false,
          });
          
          weekCounter++;
        }
        
        // 다음 주로 이동
        currentDate.setDate(currentDate.getDate() + 7);
        
        // 다음 달로 완전히 넘어간 경우 종료
        if (currentDate > lastDayOfMonth && currentDate.getDate() > 7) {
          break;
        }
      }
      
      return weekData;
    } else if (selectedPeriod === '월') {
      // 올해의 모든 월 표시 (1월 ~ 12월)
      const year = today.getFullYear();
      const monthData = [];
      
      for (let month = 0; month < 12; month++) {
        // 각 월의 첫날 생성
        const monthDate = new Date(year, month, 1);
        
        // 월 이름 배열
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        
        // 현재 월인지 확인
        const isCurrentMonth = today.getMonth() === month;
        
        // 지난 월인지 확인
        const isPastMonth = monthDate < new Date(today.getFullYear(), today.getMonth(), 1);
        
        monthData.push({
          id: `month-${month + 1}`,
          date: month + 1, // 월 (1~12)
          day: monthNames[month], // 월 이름
          isToday: isCurrentMonth,
          isPast: isPastMonth,
          isCheckedIn: false,
        });
      }
      
      return monthData;
    } else if (selectedPeriod === '연') {
      // 현재 연도와 이전 5년 표시 (과거 -> 현재 순서)
      const currentYear = today.getFullYear();
      const yearData = [];
      
      // 5년 전부터 현재까지 (최근 연도가 오른쪽)
      for (let i = 5; i >= 0; i--) {
        const year = currentYear - i;
        
        // 현재 연도인지 확인
        const isCurrentYear = year === currentYear;
        
        // 지난 연도인지 확인
        const isPastYear = year < currentYear;
        
        yearData.push({
          id: `year-${year}`,
          date: year, // 연도
          day: `${year}`, // 표시할 텍스트
          isToday: isCurrentYear,
          isPast: isPastYear,
          isCheckedIn: false,
        });
      }
      
      return yearData;
    } else {
      // 기존 로직: 일별 데이터 그대로 사용
      return sevenDaysData;
    }
  }, [sevenDaysData, selectedPeriod]);

  useEffect(() => {
    // AsyncStorage에서 회원 ID를 불러와 회원 정보 조회
    loadMemberInfo();
  }, []);

  // 운동 정보 가져오기
  useFocusEffect(
    React.useCallback(() => {
      refreshExerciseData();
    }, [refreshExerciseData]),
  );

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

  // 카테고리별 그래프 데이터 설정
  const getCategoryData = () => {
    // 주별 또는 일별 날짜 데이터 선택
    const graphData = selectedPeriod === '주' ? weeklyData : 
                      selectedPeriod === '월' ? weeklyData : 
                      selectedPeriod === '연' ? weeklyData : 
                      selectedPeriod === '일' ? currentMonthDates : sevenDaysData;
    
    const weekDates = graphData.map(item => {
      // '주' 선택 시 각 주차의 첫째 날 날짜 계산
      if (selectedPeriod === '주') {
    const today = new Date();
    const year = today.getFullYear();
        const month = today.getMonth() + 1;
        // 주 번호를 문자열로 반환 (01, 02, ...)
        return `${year}${month < 10 ? '0' + month : month}W${item.date < 10 ? '0' + item.date : item.date}`;
      } else if (selectedPeriod === '월') {
        // '월' 선택 시 각 월의 첫째 날 날짜 계산
        const today = new Date();
        const year = today.getFullYear();
        // 월 번호를 문자열로 반환 (01, 02, ...)
        return `${year}${item.date < 10 ? '0' + item.date : item.date}`;
      } else if (selectedPeriod === '연') {
        // '연' 선택 시 연도 반환
        return `${item.date}`;
      } else {
        // 일별 데이터는 기존 방식대로 처리
        const day = item.date < 10 ? `0${item.date}` : `${item.date}`;
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        return `${year}${month < 10 ? '0' + month : month}${day}`;
      }
    });

    // 주간 데이터를 저장할 배열 초기화
    const weeklyDataValues: (number | {sum: number, count: number})[] = weekDates.map(() => 0);
    
    // exerciseData에서 일치하는 날짜 찾아서 데이터 매핑
    if (selectedPeriod === '주') {
      // 주 선택 시의 데이터 처리
      exerciseData.forEach(data => {
        // exercise_dt에서 주차 정보 추출
        const date = new Date(data.exercise_dt.substring(0, 4) + '-' + 
                             data.exercise_dt.substring(4, 6) + '-' + 
                             data.exercise_dt.substring(6, 8));
        
        // 해당 날짜가 몇 번째 주인지 계산
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const dayOfWeek = firstDayOfMonth.getDay();
        
        // 첫 주의 일요일
        const firstSundayOfMonth = new Date(firstDayOfMonth);
        firstSundayOfMonth.setDate(firstDayOfMonth.getDate() - dayOfWeek);
        
        // 날짜가 첫 번째 일요일로부터 몇 주 지났는지 계산
        const weekNumber = Math.floor((date.getTime() - firstSundayOfMonth.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        
        // weekNumber에 해당하는 인덱스 찾기
        const weekIndex = weeklyData.findIndex(week => week.date === weekNumber);
        
        if (weekIndex !== -1) {
          if (activeCategory === '칼로리') {
            // intensity_level에 따른 기본 칼로리 계산
            let baseCalories = 0;
            switch (data.intensity_level) {
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
            
            // 운동 시간 계산 (HHMM 형식을 분 단위로 변환)
            if (data.exercise_time) {
              const hours = parseInt(data.exercise_time.substring(0, 2), 10);
              const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
              const totalMinutes = hours * 60 + minutes;
              
              // 시간 비율에 따라 칼로리 조정 (기준: 60분)
              const timeRatio = totalMinutes / 60;
              const currentValue = weeklyDataValues[weekIndex] as number;
              weeklyDataValues[weekIndex] = currentValue + Math.round(baseCalories * timeRatio);
            } else {
              const currentValue = weeklyDataValues[weekIndex] as number;
              weeklyDataValues[weekIndex] = currentValue + baseCalories;
            }
          } else if (activeCategory === '뛴거리') {
            // intensity_level에 따른 기본 거리 계산
            let baseDistance = 0;
            switch (data.intensity_level) {
              case 'LOW':
                baseDistance = 1.5;
                break;
              case 'MODERATE':
                baseDistance = 4.5;
                break;
              case 'HIGH':
                baseDistance = 9.5;
                break;
              default:
                baseDistance = 0;
            }
            
            // 운동 시간 계산 (HHMM 형식을 분 단위로 변환)
            if (data.exercise_time) {
              const hours = parseInt(data.exercise_time.substring(0, 2), 10);
              const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
              const totalMinutes = hours * 60 + minutes;
              
              // 시간 비율에 따라 거리 조정 (기준: 60분)
              const timeRatio = totalMinutes / 60;
              const currentValue = weeklyDataValues[weekIndex] as number;
              weeklyDataValues[weekIndex] = currentValue + baseDistance * timeRatio;
            } else {
              const currentValue = weeklyDataValues[weekIndex] as number;
              weeklyDataValues[weekIndex] = currentValue + baseDistance;
            }
          } else if (activeCategory === '심박수') {
            // 심박수는 평균값을 사용하므로 누적 합계와 개수를 저장
            if (typeof weeklyDataValues[weekIndex] !== 'object') {
              weeklyDataValues[weekIndex] = {sum: 0, count: 0};
            }
            
            let heartRate = 0;
            if (data.heart_rate && parseInt(data.heart_rate, 10) > 0) {
              heartRate = parseInt(data.heart_rate, 10);
            } else {
              // intensity_level에 따른 기본 심박수 계산
              switch (data.intensity_level) {
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
            
            const dataObj = weeklyDataValues[weekIndex] as {sum: number, count: number};
            dataObj.sum += heartRate;
            dataObj.count += 1;
          }
        }
      });
      
      // 심박수 평균 계산
      if (activeCategory === '심박수') {
        weeklyDataValues.forEach((data, index) => {
          console.log('data', data);
          if (typeof data === 'object' && data.count > 0) {
            weeklyDataValues[index] = Math.round(data.sum / data.count);
          } else if (typeof data === 'object') {
            weeklyDataValues[index] = 0;
          }
        });
      }
      
      return weeklyDataValues as number[];
    } else if (selectedPeriod === '월') {
      // 월별 데이터 처리
    exerciseData.forEach(data => {
        // exercise_dt에서 월 정보 추출 (YYYYMM 형식에서 MM 추출)
        const monthNumber = parseInt(data.exercise_dt.substring(4, 6), 10);
        
        // 월 번호에 해당하는 인덱스 찾기 (1월 -> 인덱스 0)
        const monthIndex = monthNumber - 1;
        
        if (monthIndex >= 0 && monthIndex < 12) {
        if (activeCategory === '칼로리') {
          // intensity_level에 따른 기본 칼로리 계산
          let baseCalories = 0;
          switch (data.intensity_level) {
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
          
          // 운동 시간 계산 (HHMM 형식을 분 단위로 변환)
          if (data.exercise_time) {
            const hours = parseInt(data.exercise_time.substring(0, 2), 10);
            const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
            const totalMinutes = hours * 60 + minutes;
            
            // 시간 비율에 따라 칼로리 조정 (기준: 60분)
            const timeRatio = totalMinutes / 60;
              const currentValue = weeklyDataValues[monthIndex] as number;
              weeklyDataValues[monthIndex] = currentValue + Math.round(baseCalories * timeRatio);
          } else {
              const currentValue = weeklyDataValues[monthIndex] as number;
              weeklyDataValues[monthIndex] = currentValue + baseCalories;
          }
        } else if (activeCategory === '뛴거리') {
            // intensity_level에 따른 기본 거리 계산
            let baseDistance = 0;
            switch (data.intensity_level) {
              case 'LOW':
                baseDistance = 1.5;
                break;
              case 'MODERATE':
                baseDistance = 4.5;
                break;
              case 'HIGH':
                baseDistance = 9.5;
                break;
              default:
                baseDistance = 0;
            }
            
            // 운동 시간 계산 (HHMM 형식을 분 단위로 변환)
            if (data.exercise_time) {
              const hours = parseInt(data.exercise_time.substring(0, 2), 10);
              const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
              const totalMinutes = hours * 60 + minutes;
              
              // 시간 비율에 따라 거리 조정 (기준: 60분)
              const timeRatio = totalMinutes / 60;
              const currentValue = weeklyDataValues[monthIndex] as number;
              weeklyDataValues[monthIndex] = currentValue + baseDistance * timeRatio;
            } else {
              const currentValue = weeklyDataValues[monthIndex] as number;
              weeklyDataValues[monthIndex] = currentValue + baseDistance;
            }
          } else if (activeCategory === '심박수') {
            // 심박수는 평균값을 사용하므로 누적 합계와 개수를 저장
            if (typeof weeklyDataValues[monthIndex] !== 'object') {
              weeklyDataValues[monthIndex] = {sum: 0, count: 0};
            }
            
            let heartRate = 0;
            if (data.heart_rate && parseInt(data.heart_rate, 10) > 0) {
              heartRate = parseInt(data.heart_rate, 10);
            } else {
              // intensity_level에 따른 기본 심박수 계산
              switch (data.intensity_level) {
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
            
            const dataObj = weeklyDataValues[monthIndex] as {sum: number, count: number};
            dataObj.sum += heartRate;
            dataObj.count += 1;
          }
        }
      });
      
      // 심박수 평균 계산
      if (activeCategory === '심박수') {
        weeklyDataValues.forEach((data, index) => {
          console.log('data::::', data);
          if (typeof data === 'object' && data.count > 0) {
            weeklyDataValues[index] = Math.round(data.sum / data.count);
          } else if (typeof data === 'object') {
            weeklyDataValues[index] = 0;
          }
        });
      }
      
      return weeklyDataValues as number[];
    } else if (selectedPeriod === '연') {
      // 연도별 데이터 처리
      exerciseData.forEach(data => {
        // exercise_dt에서 연도 정보 추출 (YYYYMMDD 형식에서 YYYY 추출)
        const yearNumber = parseInt(data.exercise_dt.substring(0, 4), 10);
        
        // 현재 연도와 이전 5년 내에 있는지 확인
        const today = new Date();
        const currentYear = today.getFullYear();
        if (yearNumber >= currentYear - 5 && yearNumber <= currentYear) {
          // 배열에서의 인덱스 계산 (역순: 5년 전이 0번 인덱스)
          const yearIndex = 5 - (currentYear - yearNumber);
          
          if (yearIndex >= 0 && yearIndex < 6) {
            if (activeCategory === '칼로리') {
              // intensity_level에 따른 기본 칼로리 계산
              let baseCalories = 0;
              switch (data.intensity_level) {
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
              
              // 운동 시간 계산 (HHMM 형식을 분 단위로 변환)
              if (data.exercise_time) {
                const hours = parseInt(data.exercise_time.substring(0, 2), 10);
                const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
                const totalMinutes = hours * 60 + minutes;
                
                // 시간 비율에 따라 칼로리 조정 (기준: 60분)
                const timeRatio = totalMinutes / 60;
                const currentValue = weeklyDataValues[yearIndex] as number;
                weeklyDataValues[yearIndex] = currentValue + Math.round(baseCalories * timeRatio);
              } else {
                const currentValue = weeklyDataValues[yearIndex] as number;
                weeklyDataValues[yearIndex] = currentValue + baseCalories;
              }
            } else if (activeCategory === '뛴거리') {
          // intensity_level에 따른 기본 거리 계산
          let baseDistance = 0;
          switch (data.intensity_level) {
            case 'LOW':
                  baseDistance = 1.5;
              break;
            case 'MODERATE':
                  baseDistance = 4.5;
              break;
            case 'HIGH':
                  baseDistance = 9.5;
              break;
            default:
              baseDistance = 0;
          }
          
          // 운동 시간 계산 (HHMM 형식을 분 단위로 변환)
          if (data.exercise_time) {
            const hours = parseInt(data.exercise_time.substring(0, 2), 10);
            const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
            const totalMinutes = hours * 60 + minutes;
            
            // 시간 비율에 따라 거리 조정 (기준: 60분)
                const timeRatio = totalMinutes / 60;
                const currentValue = weeklyDataValues[yearIndex] as number;
                weeklyDataValues[yearIndex] = currentValue + baseDistance * timeRatio;
              } else {
                const currentValue = weeklyDataValues[yearIndex] as number;
                weeklyDataValues[yearIndex] = currentValue + baseDistance;
              }
            } else if (activeCategory === '심박수') {
              // 심박수는 평균값을 사용하므로 누적 합계와 개수를 저장
              if (typeof weeklyDataValues[yearIndex] !== 'object') {
                weeklyDataValues[yearIndex] = {sum: 0, count: 0};
              }
              
              let heartRate = 0;
              if (data.heart_rate && parseInt(data.heart_rate, 10) > 0) {
                heartRate = parseInt(data.heart_rate, 10);
              } else {
                // intensity_level에 따른 기본 심박수 계산
                switch (data.intensity_level) {
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
              
              const dataObj = weeklyDataValues[yearIndex] as {sum: number, count: number};
              dataObj.sum += heartRate;
              dataObj.count += 1;
            }
          }
        }
      });
      
      // 심박수 평균 계산
      if (activeCategory === '심박수') {
        weeklyDataValues.forEach((data, index) => {
          if (typeof data === 'object' && data.count > 0) {
            weeklyDataValues[index] = Math.round(data.sum / data.count);
          } else if (typeof data === 'object') {
            weeklyDataValues[index] = 0;
          }
        });
      }
      
      return weeklyDataValues as number[];
    } else {
      // 일별 데이터는 기존 로직 그대로 사용
      exerciseData.forEach(data => {
        const dateIndex = weekDates.findIndex(date => date === data.exercise_dt);
        if (dateIndex !== -1) {
          if (activeCategory === '칼로리') {
            // intensity_level에 따른 기본 칼로리 계산
            let baseCalories = 0;
            switch (data.intensity_level) {
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
            
            if (data.exercise_time) {
              const hours = parseInt(data.exercise_time.substring(0, 2), 10);
              const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
              const totalMinutes = hours * 60 + minutes;
              
              const timeRatio = totalMinutes / 60;
              weeklyDataValues[dateIndex] = Math.round(baseCalories * timeRatio);
            } else {
              weeklyDataValues[dateIndex] = baseCalories;
            }
          } else if (activeCategory === '뛴거리') {
            // intensity_level에 따른 기본 거리 계산
            let distanceValue = 0;
            let baseDistance = 0;
            switch (data.intensity_level) {
              case 'LOW':
                baseDistance = 1.5;
                break;
              case 'MODERATE':
                baseDistance = 4.5;
                break;
              case 'HIGH':
                baseDistance = 9.5;
                break;
              default:
                baseDistance = 0;
            }
            
            if (data.exercise_time) {
              const hours = parseInt(data.exercise_time.substring(0, 2), 10);
              const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
              const totalMinutes = hours * 60 + minutes;
              
            const timeRatio = totalMinutes / 60;
            distanceValue = baseDistance * timeRatio;
          } else {
            distanceValue = baseDistance;
          }
          
            weeklyDataValues[dateIndex] = distanceValue;
        } else if (activeCategory === '심박수') {
          // intensity_level에 따른 기본 심박수 계산
          let baseHeartRate = 0;
          switch (data.intensity_level) {
            case 'LOW':
                baseHeartRate = 110;
              break;
            case 'MODERATE':
                baseHeartRate = 135;
              break;
            case 'HIGH':
                baseHeartRate = 165;
              break;
            default:
              baseHeartRate = 0;
          }
          
            if (data.heart_rate && parseInt(data.heart_rate, 10) > 0) {
              weeklyDataValues[dateIndex] = parseInt(data.heart_rate, 10);
          } else {
              weeklyDataValues[dateIndex] = baseHeartRate;
          }
        }
      }
    });

      return weeklyDataValues as number[];
    }
  };

  // 카테고리별 최대값 설정
  const getMaxValue = () => {
    switch (activeCategory) {
      case '칼로리':
        return 1250;
      case '심박수':
        return 200;  // 심박수 최대값을 600에서 200으로 수정
      case '뛴거리':
        return 25;
      default:
        return 1250;
    }
  };

  // 카테고리별 Y축 레이블 설정
  const getYAxisLabels = () => {
    if (activeCategory === '심박수') {
      return ['250', '200', '150', '100', '50', '0'];
    } else if (selectedPeriod === '일' && activeCategory === '뛴거리') {
      return ['20', '16', '12', '8', '4', '0'];
    } else if (selectedPeriod === '주' && activeCategory === '뛴거리') {
      return ['75', '60', '45', '30', '15', '0'];
    } else if (selectedPeriod === '주') {
      return ['5000', '4000', '3000', '2000', '1000', '0'];
    } else if (selectedPeriod === '월' && activeCategory === '칼로리') {
      return ['5만', '4만', '3만', '2만', '1만', '0'];
    } else if (selectedPeriod === '월') {
      return ['500', '400', '300', '200', '100', '0'];
    } else if (selectedPeriod === '연' && activeCategory === '칼로리') {
      return ['50만', '40만', '30만', '20만', '10만', '0'];
    } else if (selectedPeriod === '연') {
      return ['7500', '6000', '4500', '3000', '1500', '0'];
    }
    
    switch (activeCategory) {
      case '칼로리':
        return ['1250', '1000', '750', '500', '250', '0'];
      case '뛴거리':
        return ['25', '20', '15', '10', '5', '0'];
      default:
        return ['1250', '1000', '750', '500', '250', '0'];
    }
  };
  // 카테고리별 총합 계산
  const getCategoryTotal = () => {
    // 현재 데이터에서 선택된 카테고리에 해당하는 총합 계산
    let total = 0;
    
    if (activeCategory === '심박수') {
      // 심박수는 평균값 계산
      let heartRateSum = 0;
      let heartRateCount = 0;
      
      exerciseData.forEach(data => {
        let heartRate = 0;
        
        if (data.heart_rate) {
          // API에서 제공하는 실제 심박수 데이터가 있으면 사용
          heartRate = parseInt(data.heart_rate, 10);
        } else {
          // 없으면 강도에 따른 기본 심박수 사용
          switch (data.intensity_level) {
            case 'LOW':
              heartRate = 110;  // 저강도 평균 심박수 110 bpm
              break;
            case 'MODERATE':
              heartRate = 135;  // 중강도 평균 심박수 135 bpm
              break;
            case 'HIGH':
              heartRate = 165;  // 고강도 평균 심박수 165 bpm
              break;
            default:
              heartRate = 0;
          }
        }
        
        if (heartRate > 0) {
          heartRateSum += heartRate;
          heartRateCount++;
        }
      });
      
      return heartRateCount > 0 ? Math.round(heartRateSum / heartRateCount) : 0;
    }
    
    exerciseData.forEach(data => {
      if (activeCategory === '칼로리') {
        // intensity_level에 따른 기본 칼로리 계산
        let baseCalories = 0;
        switch (data.intensity_level) {
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
        
        // 운동 시간 계산 (HHMM 형식을 분 단위로 변환)
        if (data.exercise_time) {
          const hours = parseInt(data.exercise_time.substring(0, 2), 10);
          const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
          const totalMinutes = hours * 60 + minutes;
          
          // 시간 비율에 따라 칼로리 조정 (기준: 60분)
          const timeRatio = totalMinutes / 60;
          total += Math.round(baseCalories * timeRatio);
        } else {
          total += baseCalories;
        }
      } else if (activeCategory === '뛴거리') {
        // 뛴거리는 강도와 시간에 따라 계산
        let distanceValue = 0;
        
        // intensity_level에 따른 기본 거리 계산
        let baseDistance = 0;
        switch (data.intensity_level) {
          case 'LOW':
            baseDistance = 1.5;  // 저강도 1시간 1.5km
            break;
          case 'MODERATE':
            baseDistance = 4.5;  // 중강도 1시간 4.5km
            break;
          case 'HIGH':
            baseDistance = 9.5;  // 고강도 1시간 9.5km
            break;
          default:
            baseDistance = 0;
        }
        
        // 운동 시간 계산 (HHMM 형식을 분 단위로 변환)
        if (data.exercise_time) {
          const hours = parseInt(data.exercise_time.substring(0, 2), 10);
          const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
          const totalMinutes = hours * 60 + minutes;
          
          // 시간 비율에 따라 거리 조정 (기준: 60분)
          const timeRatio = totalMinutes / 60;
          distanceValue = baseDistance * timeRatio;
        } else {
          distanceValue = baseDistance;
        }
        
        total += distanceValue;
      }
    });
    
    return total;
  };

  // 파동 애니메이션 시작
  useEffect(() => {
    const startPulseAnimation = () => {
      // 모든 애니메이션 값 리셋
      pulseAnim1.setValue(0);
      pulseAnim2.setValue(0);
      pulseAnim3.setValue(0);
      
      // 첫 번째 파동 애니메이션
      Animated.timing(pulseAnim1, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
      
      // 두 번째 파동 애니메이션(약간 지연)
      setTimeout(() => {
        Animated.timing(pulseAnim2, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
      }, 1200);
      
      // 세 번째 파동 애니메이션(더 지연)
      setTimeout(() => {
        Animated.timing(pulseAnim3, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
      }, 2400);
      
      // 애니메이션 주기적 반복
      const animationInterval = setInterval(() => {
        pulseAnim1.setValue(0);
        Animated.timing(pulseAnim1, {
          toValue: 1,
          duration: 3500,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
        
        setTimeout(() => {
          pulseAnim2.setValue(0);
          Animated.timing(pulseAnim2, {
            toValue: 1,
            duration: 3500,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        }, 1200);
        
        setTimeout(() => {
          pulseAnim3.setValue(0);
          Animated.timing(pulseAnim3, {
            toValue: 1,
            duration: 3500,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        }, 2400);
      }, 3600);
      
      // 컴포넌트 언마운트 시 인터벌 정리
      return () => clearInterval(animationInterval);
    };
    
    const animation = startPulseAnimation();
    
    return () => {
      // 클린업 함수
      if (animation) animation();
    };
  }, []);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollViewContent, {flexGrow: 1}]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        overScrollMode="always"
        scrollEnabled={true}
        bounces={true}
        alwaysBounceVertical={true}
        keyboardShouldPersistTaps="handled">
        {/* 헤더 부분 */}

        <View style={styles.gradientGreenContainer}>
          <Image 
            source={IMAGES.gradient.circleGreen}
            style={styles.gradientGreen}
            />
        </View>

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
          <TouchableOpacity style={styles.notificationButton}>
            <Image 
              source={IMAGES.icons.bellWhite}
              style={styles.bellIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.contentSection}>
          <HomeBannerImgPicker />
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
                          if (Platform.OS === 'android') {
                            ToastAndroid.show(
                              '출석한 요일을 클릭하면 운동 정보를 입력할 수 있습니다.',
                              ToastAndroid.SHORT,
                            );
                          } else {
                            // iOS의 경우 Alert 사용
                            Alert.alert(
                              '알림',
                              '출석한 요일을 클릭하면 운동 정보를 입력할 수 있습니다.',
                            );
                          }
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
          <Text style={styles.sectionTitle}>운동 기록</Text>
          <View style={styles.card}>
            {/* 카테고리 버튼 */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.categoryButtonsScrollView}
              contentContainerStyle={styles.categoryButtonsContainer}
            >
              <TouchableOpacity 
                style={[styles.categoryButton, activeCategory === '칼로리' && styles.categoryButtonActive]}
                onPress={() => setActiveCategory('칼로리')}>
                <Image 
                  source={IMAGES.icons.fireWhite}
                  style={styles.categoryButtonIcon}
                />
                <Text style={[styles.categoryButtonText, activeCategory === '칼로리' && styles.categoryButtonTextActive]}>칼로리(kcal)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryButton, activeCategory === '뛴거리' && styles.categoryButtonActive]}
                onPress={() => setActiveCategory('뛴거리')}>
                <Image 
                  source={IMAGES.icons.runWhite}
                  style={styles.categoryButtonIcon}
                />
                <Text style={[styles.categoryButtonText, activeCategory === '뛴거리' && styles.categoryButtonTextActive]}>뛴거리(km)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryButton, activeCategory === '심박수' && styles.categoryButtonActive]}
                onPress={() => setActiveCategory('심박수')}>
                <Image 
                  source={IMAGES.icons.heartWhite}
                  style={styles.categoryButtonIcon}
                />
                <Text style={[styles.categoryButtonText, activeCategory === '심박수' && styles.categoryButtonTextActive]}>심박수(bpm)</Text>
              </TouchableOpacity>
            </ScrollView>
            
            {/* 총합 정보와 기간 선택 */}
            <View style={styles.summaryContainer}>
              <View style={styles.totalSummary}>
                <Text style={styles.summaryValue}>
                  {activeCategory === '칼로리' ? 
                    `${getCategoryTotal().toLocaleString()} kcal` : 
                   activeCategory === '심박수' ? 
                    getCategoryTotal() > 0 ? `평균 ${getCategoryTotal()} bpm` : '데이터 없음' : 
                   activeCategory === '뛴거리' ? 
                    `${getCategoryTotal().toFixed(1)} km` : '0'}
                </Text>
              </View>
              <View style={styles.periodSelectorContainer}>
                <TouchableOpacity 
                  style={styles.periodSelectorButton}
                  onPress={() => setShowPeriodSelect(!showPeriodSelect)}>
                  <Text style={styles.periodSelectorText}>{selectedPeriod}</Text>
                  <Image 
                    source={IMAGES.icons.arrowDownWhite}
                    style={styles.iconImage}
                  />
                </TouchableOpacity>
                
                {showPeriodSelect && (
                  <View style={styles.periodDropdown}>
                    <TouchableOpacity 
                      style={styles.periodDropdownItem}
                      onPress={() => {
                        setSelectedPeriod('일');
                        setShowPeriodSelect(false);
                      }}>
                      <Text style={styles.periodDropdownText}>일</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.periodDropdownItem}
                      onPress={() => {
                        setSelectedPeriod('주');
                        setShowPeriodSelect(false);
                      }}>
                      <Text style={styles.periodDropdownText}>주</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.periodDropdownItem}
                      onPress={() => {
                        setSelectedPeriod('월');
                        setShowPeriodSelect(false);
                      }}>
                      <Text style={styles.periodDropdownText}>월</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.periodDropdownItem}
                      onPress={() => {
                        setSelectedPeriod('연');
                        setShowPeriodSelect(false);
                      }}>
                      <Text style={styles.periodDropdownText}>연</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            
            {/* 막대그래프 */}
            <View style={styles.graphContainer}>
              {/* Y 축 레이블 */}
              <View style={styles.graphYAxis}>
                {getYAxisLabels().map((label, index) => (
                  <Text key={index} style={styles.graphYLabel}>{label}</Text>
                ))}
              </View>
              
              {/* 그래프 내용 */}
              {selectedPeriod === '월' || selectedPeriod === '일' ? (
                <ScrollView 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.graphScrollContent}
                  ref={ref}
                >
              <View style={styles.graphContent}>
                {/* 월 또는 일 데이터 막대 */}
                {(selectedPeriod === '월' ? weeklyData : currentMonthDates).map((item, index) => {
                const values = getCategoryData();
                const maxValue = getMaxValue();
                const value = values[index] || 0;
                      
                // 값을 그래프 높이에 맞게 스케일링
                let heightPercent = 0;
                      
                // Using switch statement for safer type checking
                switch(selectedPeriod) {
                  case '일':
                    if (activeCategory === '칼로리') {
                      // 일 선택 시 칼로리 Y축 스케일 맞춤
                      heightPercent = (value / 1250) * 150;
                    } else {
                      // 일 선택 시 Y축 스케일 맞춤
                      heightPercent = (value / 25) * 200;
                    }
                    break;
                  case '주':
                    if (activeCategory === '뛴거리') {
                      // 주 선택 시 뛴거리 Y축 0-75 스케일에 맞춤
                      console.log(`뛴거리 주간 데이터: ${value}km, 인덱스: ${index}`);
                      heightPercent = value * 15;
                    } else {
                      // 주 선택 시 Y축 0-5000 스케일에 맞춤
                      heightPercent = (value / 5000) * 300;
                    }
                    break;
                  case '월':
                    if (activeCategory === '칼로리') {
                      // 월 선택 시 칼로리 Y축 0-50000 스케일에 맞춤
                      heightPercent = (value / 50000) * 300;
                    } else {
                      // 월 선택 시 Y축 0-500 스케일에 맞춤
                      heightPercent = (value / 500) * 150;
                    }
                    break;
                  case '연':
                    if (activeCategory === '칼로리') {
                      // 연 선택 시 칼로리 Y축 0-500000 스케일에 맞춤
                      heightPercent = (value / 500000) * 300;
                    } else if (activeCategory === '뛴거리') {
                      // 연 선택 시 뛴거리 Y축 0-100 스케일에 맞춤
                      heightPercent = (value / 100) * 300;
                    } else {
                      // 연 선택 시 Y축 0-750000 스케일에 맞춤
                      heightPercent = (value / 750000) * 300;
                    }
                    break;
                  default:
                    // 기본 스케일링 로직
                    if (activeCategory === '뛴거리') {
                      // 뛴거리: Y축 0-25 스케일에 맞춤 (1km = 6px)
                      heightPercent = (value / 25) * 150;
                    } else if (activeCategory === '칼로리') {
                      // 칼로리: Y축 0-1250 스케일에 맞춤 (1250kcal = 150px)
                      heightPercent = (value / 1250) * 150;
                    } else if (activeCategory === '심박수') {
                      // 심박수: Y축 0-200 스케일에 맞춤 (200bpm = 150px)
                      heightPercent = (value / 200) * 150;
                    }
                }
                
                // 높이 조정 (최대 150으로 제한)
                const adjustedHeight = Math.min(heightPercent, 150);
                
                // 고유 키 생성을 위한 처리
                const itemKey = 'id' in item ? item.id : item.date.toString();
                  
                return (
                  <View key={itemKey} style={styles.graphItem}>
                    <View style={{height: '100%', justifyContent: 'flex-end', alignItems: 'center'}}>
                      <View 
                        style={[
                              styles.graphBarContainer,
                              { height: scale(adjustedHeight) }
                            ]} 
                          >
                            <LinearGradient 
                              colors={[
                                '#43B546', 
                                '#43B546'
                              ]}
                              style={styles.graphBarGradient}
                              start={{x: 0, y: 0}}
                              end={{x: 0, y: 1}}
                            />
                          </View>
                    </View>
                    <Text style={styles.graphDateLabel}>{item.date}</Text>
                        <Text style={styles.graphXLabel}>
                          {(() => {
                            switch(selectedPeriod) {
                              case '주': return '';
                              case '월': return '';
                              case '연': return '';
                              case '일': return item.day;
                              default: return item.day;
                            }
                          })()}
                        </Text>
                  </View>
                );
              })}
                </View>
              </ScrollView>
              ) : (
                <View style={[styles.graphContent, { justifyContent: 'space-between', width: '100%', flex: 1 }]}>
                  {/* 주별 또는 연도별 막대 */}
                  {(selectedPeriod === '주' ? weeklyData : weeklyData).map((item, index, array) => {
                    const values = getCategoryData();
                    const maxValue = getMaxValue();
                    const value = values[index] || 0;
                    
                    // 값을 그래프 높이에 맞게 스케일링
                    let heightPercent = 0;
                    
                    // Using switch statement for safer type checking
                    switch(selectedPeriod) {
                      case '주':
                        // 주 선택 시 Y축 0-5000 스케일에 맞춤
                        heightPercent = (value / 5000) * 150;
                        break;
                      case '월':
                        // 월 선택 시 Y축 0-500 스케일에 맞춤
                        heightPercent = (value / 500) * 150;
                        break;
                      case '연':
                        if (activeCategory === '칼로리') {
                          // 연 선택 시 칼로리 Y축 0-500000 스케일에 맞춤
                          heightPercent = (value / 500000) * 300;
                        } else if (activeCategory === '뛴거리') {
                          // 연 선택 시 뛴거리 Y축 0-100 스케일에 맞춤
                          heightPercent = (value / 100) * 300;
                        } else {
                          // 연 선택 시 Y축 0-750000 스케일에 맞춤
                          heightPercent = (value / 750000) * 150;
                        }
                        break;
                      default:
                        // 기본 스케일링 로직
                        if (activeCategory === '뛴거리') {
                          // 뛴거리: Y축 0-25 스케일에 맞춤 (1km = 6px)
                          heightPercent = (value / 25) * 150;
                        } else if (activeCategory === '칼로리') {
                          // 칼로리: Y축 0-1250 스케일에 맞춤 (1250kcal = 150px)
                          heightPercent = (value / 1250) * 150;
                        } else if (activeCategory === '심박수') {
                          // 심박수: Y축 0-200 스케일에 맞춤 (200bpm = 150px)
                          heightPercent = (value / 200) * 150;
                        }
                    }
                    
                    // 높이 조정 (최대 150으로 제한)
                    const adjustedHeight = Math.min(heightPercent, 150);
                    
                    // 고유 키 생성을 위한 처리
                    const itemKey = 'id' in item ? item.id : item.date.toString();
                    
                    return (
                      <View 
                        key={itemKey} 
                        style={[
                          styles.graphItem, 
                          { 
                            width: `${100/array.length}%`,
                            paddingHorizontal: 0
                          }
                        ]}
                      >
                        <View style={{height: '100%', justifyContent: 'flex-end', alignItems: 'center'}}>
                          <View 
                            style={[
                              styles.graphBarContainer,
                              { height: scale(adjustedHeight) }
                            ]} 
                          >
                            <LinearGradient 
                              colors={[
                                '#43B546', 
                                '#43B546'
                              ]}
                              style={styles.graphBarGradient}
                              start={{x: 0, y: 0}}
                              end={{x: 0, y: 1}}
                            />
                          </View>
                        </View>
                        <Text style={styles.graphDateLabel}>{item.date}</Text>
                        <Text style={styles.graphXLabel}>
                          {(() => {
                            switch(selectedPeriod) {
                              case '주': return '';
                              case '월': return '';
                              case '연': return '';
                              case '일': return item.day;
                              default: return item.day;
                            }
                          })()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* 누적 운동량 섹션 */}
        <View style={[styles.contentSection]}>  
          <Text style={styles.sectionTitle}>누적 운동량</Text>
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
                  <Text style={styles.exerciseSummaryTitle}>평균 심박수</Text>
                </View>
                <View style={{height: scale(120), justifyContent: 'center', alignItems: 'center'}}>
                  {/* 파동 애니메이션 */}
                  <Animated.View style={[
                    styles.pulseCircle,
                    {
                      opacity: pulseAnim1.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.7, 0.3, 0],
                      }),
                      transform: [{
                        scale: pulseAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 3],
                        }),
                      }],
                    }
                  ]} />
                  
                  <Animated.View style={[
                    styles.pulseCircle,
                    {
                      opacity: pulseAnim2.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.7, 0.3, 0],
                      }),
                      transform: [{
                        scale: pulseAnim2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 3],
                        }),
                      }],
                    }
                  ]} />
                  
                  <Animated.View style={[
                    styles.pulseCircle,
                    {
                      opacity: pulseAnim3.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.7, 0.3, 0],
                      }),
                      transform: [{
                        scale: pulseAnim3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 3],
                        }),
                      }],
                    }
                  ]} />
                  
                  <Image source={IMAGES.icons.heartWhite} style={styles.hearWhite} />
                </View>
                <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                  <Text style={styles.exerciseSummaryValue}>{accumulatedData.averageHeartRate}</Text>
                  <Text style={{fontSize: scale(16), color: '#FFFFFF'}}> Bpm</Text>
                </View>
              </View>
            </View>
            
            {/* 오른쪽 컨테이너 */}
            <View style={styles.exerciseSummaryRightContainer}>
              {/* 오른쪽 위 박스 */}
              <View style={styles.exerciseSummaryBoxSmall}>
                <View style={{flexDirection: 'column', justifyContent: 'space-between'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={styles.iconCircle}>
                    <Image 
                        source={IMAGES.icons.fireWhite}
                      style={styles.exerciseSummaryIcon}
                    />
                    </View>
                    <Text style={styles.exerciseSummaryTitle}>총 소모 칼로리</Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                    <Text style={styles.exerciseSummaryValue}>{accumulatedData.totalCalories.toLocaleString()}</Text>
                    <Text style={{fontSize: scale(16), color: '#848484'}}> kcal</Text>
                  </View>
                </View>

              </View>
              
              {/* 오른쪽 아래 박스 */}
              <View style={styles.exerciseSummaryBoxSmall}>
                <View style={{flexDirection: 'column', justifyContent: 'space-between'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View>
                      <View style={styles.iconCircle}>
                        <Image 
                          source={IMAGES.icons.runWhite}
                          style={styles.exerciseSummaryIcon}
                        />
                      </View>
                    </View>
                    <Text style={styles.exerciseSummaryTitle}>총 뛴거리</Text>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                    <Text style={styles.exerciseSummaryValue}>{accumulatedData.totalDistance.toFixed(1)}</Text>
                    <Text style={{fontSize: scale(16), color: '#848484'}}> km</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={{height: scale(80)}} />
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
        onExerciseInfoUpdated={refreshExerciseData}
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
  },
  content: {
    alignItems: 'center',
    marginBottom: scale(24),
    marginTop: scale(16),
  },
  contentText: {
    color: '#FFFFFF',
    fontSize: scale(16),
  },
  contentSection: {
    marginBottom: scale(24),
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: scale(16),
    justifyContent: 'center',
    marginTop: scale(20),
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: scale(16),
  },
  banner: {
    backgroundColor: '#373737',
    borderRadius: scale(8),
    padding: scale(16),
    minHeight: scale(150),
    marginTop: scale(20),
  },
  bannerImage: {
    width: '100%',
    height: scale(150),
    borderRadius: scale(8),
  },
  bannerDots: {
    position: 'absolute',
    bottom: scale(10),
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  bannerDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: scale(4),
  },
  bannerDotActive: {
    backgroundColor: '#FFFFFF',
  },
  bannerPlaceholderText: {
    color: '#999999',
    fontSize: scale(14),
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
  graphContainer: {
    flexDirection: 'row',
    height: scale(200),
    marginTop: scale(10),
  },
  graphYAxis: {
    width: scale(30),
    height: '100%',
    justifyContent: 'space-between',
    paddingVertical: scale(5),
    paddingBottom: scale(35),
  },
  graphYLabel: {
    color: '#999999',
    fontSize: scale(10),
    textAlign: 'right',
  },
  graphContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingLeft: scale(5),
    paddingRight: scale(5),
  },
  graphScrollContent: {
    minWidth: '100%',
  },
  graphItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: scale(30),
  },
  graphBarContainer: {
    width: scale(20),
    backgroundColor: '#43B546',
    borderRadius: scale(10),
    overflow: 'hidden',
    marginBottom: scale(5),
  },
  graphBarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: scale(10),
    opacity: Platform.OS === 'ios' ? 1 : undefined,
  },
  graphXLabel: {
    color: '#999999',
    fontSize: scale(12),
    textAlign: 'center',
    width: scale(36),
    flexWrap: 'nowrap',
  },
  graphDateLabel: {
    color: '#FFFFFF',
    fontSize: scale(12),
    marginBottom: scale(5),
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
    minHeight: scale(200),
  },
  exerciseSummaryTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  hearWhite: {
    width: scale(35),
    height: scale(35),
    tintColor: '#FFFFFF',
    resizeMode: 'contain',
  },
  exerciseSummaryValue: {
    color: '#FFFFFF',
    fontSize: scale(20),
    marginTop: scale(10),
  },
  exerciseSummaryIcon: {
    width: scale(10),
    height: scale(10),
    tintColor: '#FFFFFF',
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
  },
  iconCircle: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(20),
    backgroundColor: '#6BC46A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(5),
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
  pulseCircle: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
  },
});

export default Home;

