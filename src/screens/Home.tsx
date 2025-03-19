import React, {useEffect, useMemo, useState} from 'react';
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
import AttendancePopup from '../components/AttendancePopup';
import LinearGradient from 'react-native-linear-gradient';
import {getMemberExerciseInfo, getMemberExerciseList} from '../api/services/memberExercise';
import IMAGES from '../utils/images';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const Home = () => {
  const insets = useSafeAreaInsets();
  const {memberInfo, loadMemberInfo} = useAuth();
  const [checkinLogs, setCheckinLogs] = useState<string[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const [showPopup, setShowPopup] = useState(false);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [activeCategory, setActiveCategory] = useState('칼로리');
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('일');
  const [showPeriodSelect, setShowPeriodSelect] = useState(false);

  useEffect(() => {
    // AsyncStorage에서 회원 ID를 불러와 회원 정보 조회
    loadMemberInfo();
  }, []);

  // 운동 정보 가져오기
  useFocusEffect(
    React.useCallback(() => {
      const fetchExerciseData = async () => {
        if (memberInfo?.mem_id) {
          try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            
            // 현재 월의 yearMonth 포맷 생성 (YYYYMM)
            const yearMonth = `${year}${month < 10 ? '0' + month : month}`;
            
            // 운동 정보 API 호출
            const response = await getMemberExerciseList(Number(memberInfo.mem_id), yearMonth);
            
            if (response.success && response.data) {
              setExerciseData(Array.isArray(response.data) ? response.data : [response.data]);
            }
          } catch (error) {
            console.error('운동 정보 조회 실패:', error);
          }
        }
      };

      fetchExerciseData();
    }, [memberInfo]),
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

            if (response.success && response.data) {
              // 출석 날짜만 추출 (YYYY-MM-DD 형식에서 DD만 추출)
              const checkinDates = response.data.map(log => {
                const dateParts = log.ci_date_only.split('-');
                return dateParts[2]; // 일자만 반환
              });
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

  // 7일 데이터 생성 (오늘 날짜 중심으로 앞뒤 3일씩)
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

  // 카테고리별 그래프 데이터 설정
  const getCategoryData = () => {
    const weekDates = sevenDaysData.map(item => {
      const day = item.date < 10 ? `0${item.date}` : `${item.date}`;
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      return `${year}${month < 10 ? '0' + month : month}${day}`;
    });

    // 주간 데이터를 저장할 배열 초기화
    const weeklyData = weekDates.map(() => 0);
    
    // exerciseData에서 일치하는 날짜 찾아서 데이터 매핑
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
          
          // 운동 시간 계산 (HHMM 형식을 분 단위로 변환)
          if (data.exercise_time) {
            const hours = parseInt(data.exercise_time.substring(0, 2), 10);
            const minutes = parseInt(data.exercise_time.substring(2, 4), 10);
            const totalMinutes = hours * 60 + minutes;
            
            // 시간 비율에 따라 칼로리 조정 (기준: 60분)
            const timeRatio = totalMinutes / 60;
            weeklyData[dateIndex] = Math.round(baseCalories * timeRatio);
          } else {
            weeklyData[dateIndex] = baseCalories;
          }
        } else if (activeCategory === '뛴거리') {
          // 뛴거리는 강도와 시간에 따라 계산
          let distanceValue = 0;
          
          // intensity_level에 따른 기본 거리 계산
          let baseDistance = 0;
          switch (data.intensity_level) {
            case 'LOW':
              baseDistance = 1.4;  // 저강도 1시간 1.4km
              break;
            case 'MODERATE':
              baseDistance = 4.3;  // 중강도 1시간 4.3km
              break;
            case 'HIGH':
              baseDistance = 9.6;  // 고강도 1시간 9.6km
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
          
          weeklyData[dateIndex] = distanceValue;
        } else if (activeCategory === '심박수') {
          // 심박수 데이터 설정
          // intensity_level에 따른 기본 심박수 계산
          let baseHeartRate = 0;
          switch (data.intensity_level) {
            case 'LOW':
              baseHeartRate = 110;  // 저강도 1시간 110 bpm
              break;
            case 'MODERATE':
              baseHeartRate = 135;  // 중강도 1시간 135 bpm
              break;
            case 'HIGH':
              baseHeartRate = 165;  // 고강도 1시간 165 bpm
              break;
            default:
              baseHeartRate = 0;
          }
          
          // API에서 제공하는 실제 심박수가 있으면 그 값을 사용, 없으면 계산된 값 사용
          if (data.heart_rate) {
            weeklyData[dateIndex] = parseInt(data.heart_rate, 10);
          } else {
            weeklyData[dateIndex] = baseHeartRate;
          }
        }
      }
    });

    return weeklyData;
  };

  // 카테고리별 최대값 설정
  const getMaxValue = () => {
    switch (activeCategory) {
      case '칼로리':
        return 1000;
      case '심박수':
        return 600;
      case '뛴거리':
        return 10;
      default:
        return 1000;
    }
  };

  // 카테고리별 Y축 레이블 설정
  const getYAxisLabels = () => {
    switch (activeCategory) {
      case '칼로리':
        return ['1000', '800', '600', '400', '200', '0'];
      case '심박수':
        return ['600', '500', '400', '300', '200', '0'];
      case '뛴거리':
        return ['10', '8', '6', '4', '2', '0'];
      default:
        return ['1000', '800', '600', '400', '200', '0'];
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
              heartRate = 110;  // 저강도 1시간 110 bpm
              break;
            case 'MODERATE':
              heartRate = 135;  // 중강도 1시간 135 bpm
              break;
            case 'HIGH':
              heartRate = 165;  // 고강도 1시간 165 bpm
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
            baseDistance = 1.4;  // 저강도 1시간 1.4km
            break;
          case 'MODERATE':
            baseDistance = 4.3;  // 중강도 1시간 4.3km
            break;
          case 'HIGH':
            baseDistance = 9.6;  // 고강도 1시간 9.6km
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
        <View
          style={[
            styles.header,
            {paddingTop: Platform.OS === 'ios' ? insets.top : 16},
          ]}>
          <View style={styles.emptySpace} />
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {/* 프로필 이미지가 들어갈 자리 */}
            </View>
            <Text style={styles.nickname}>
              {memberInfo?.mem_nickname || '사용자'}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Image 
              source={IMAGES.icons.bellWhite}
              style={styles.bellIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.banner}></View>
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
              <LinearGradient
                key={`date-${item.date}`}
                colors={['#43b546', '#b6ff99']}
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
                        '출석한 요일을 클릭하면 출석 정보를 입력할 수 있습니다.',
                        ToastAndroid.SHORT,
                      );
                    } else {
                      // iOS의 경우 Alert 사용
                      Alert.alert(
                        '알림',
                        '출석한 요일을 클릭하면 출석 정보를 입력할 수 있습니다.',
                      );
                    }
                  }
                }}>
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
            ))}
          </View>
        </View>

        <View style={styles.contentSection}>
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
              <View style={styles.graphContent}>
                {/* 요일별 막대 */}
                {sevenDaysData.map((item, index) => {
                  const values = getCategoryData();
                  const maxValue = getMaxValue();
                  // 값을 그래프 높이에 맞게 스케일링 (최대값 기준)
                  const heightPercent = (values[index] / maxValue) * 100;
                  const value = values[index];
                  
                  return (
                    <View key={item.date.toString()} style={styles.graphItem}>
                      <View style={{height: '100%', justifyContent: 'flex-end', alignItems: 'center'}}>
                        <View 
                          style={[
                            styles.graphBar,
                            { height: scale(Math.min(heightPercent * 1.5, 150)) } // 최대 높이 제한
                          ]} 
                        />
                      </View>
                      <Text style={styles.graphDateLabel}>{item.date}</Text>
                      <Text style={styles.graphXLabel}>{item.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* 누적 운동량 섹션 */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>누적 운동량</Text>
          <View style={styles.exerciseSummaryContainer}>
            {/* 왼쪽 박스 */}
            <View style={styles.exerciseSummaryBox}>
              <View>
                <Text style={styles.exerciseSummaryTitle}>총 소모 칼로리</Text>
                <Text style={styles.exerciseSummaryValue}>14,500 kcal</Text>
              </View>
              <View style={styles.exerciseSummaryIconContainer}>
                <Image 
                  source={IMAGES.icons.fireWhite}
                  style={styles.exerciseSummaryIcon}
                />
              </View>
            </View>
            
            {/* 오른쪽 컨테이너 */}
            <View style={styles.exerciseSummaryRightContainer}>
              {/* 오른쪽 위 박스 */}
              <View style={styles.exerciseSummaryBoxSmall}>
                <View>
                  <Text style={styles.exerciseSummaryTitleSmall}>총 뛴거리</Text>
                  <Text style={styles.exerciseSummaryValueSmall}>52.4 km</Text>
                </View>
                <View style={styles.exerciseSummaryIconContainerSmall}>
                  <Image 
                    source={IMAGES.icons.runWhite}
                    style={styles.exerciseSummaryIconSmall}
                  />
                </View>
              </View>
              
              {/* 오른쪽 아래 박스 */}
              <View style={styles.exerciseSummaryBoxSmall}>
                <View>
                  <Text style={styles.exerciseSummaryTitleSmall}>평균 심박수</Text>
                  <Text style={styles.exerciseSummaryValueSmall}>125 bpm</Text>
                </View>
                <View style={styles.exerciseSummaryIconContainerSmall}>
                  <Image 
                    source={IMAGES.icons.heartWhite}
                    style={styles.exerciseSummaryIconSmall}
                  />
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

      <AttendancePopup
        visible={showAttendancePopup}
        date={selectedDate}
        onClose={() => setShowAttendancePopup(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242527',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: scale(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: scale(12),
    backgroundColor: '#242527', // 배경색 명시적 지정
  },
  emptySpace: {
    width: scale(40),
  },
  profileSection: {
    alignItems: 'center',
    marginTop: scale(30),
  },
  profileImageContainer: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(50),
    backgroundColor: '#444444',
    marginBottom: scale(4),
  },
  nickname: {
    fontSize: scale(12),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: scale(10),
  },
  notificationButton: {
    padding: scale(8),
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
    backgroundColor: '#333333',
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
    backgroundColor: '#333333',
    borderRadius: scale(8),
    padding: scale(16),
    minHeight: scale(150),
    marginTop: scale(20),
  },
  calendarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linearGradientDateWrapper: {
    borderRadius: scale(50),
    padding: scale(1),
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
    backgroundColor: '#6BC46A',
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
    backgroundColor: '#6BC46A',
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
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingLeft: scale(5),
  },
  graphItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: scale(30),
  },
  graphBar: {
    width: scale(20),
    backgroundColor: '#6BC46A',
    borderRadius: scale(10),
    marginBottom: scale(5),
  },
  graphXLabel: {
    color: '#999999',
    fontSize: scale(12),
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
    height: scale(150),
    backgroundColor: '#444444',
    borderRadius: scale(15),
    padding: scale(15),
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  exerciseSummaryTitle: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
  exerciseSummaryValue: {
    color: '#FFFFFF',
    fontSize: scale(22),
    fontWeight: 'bold',
    marginTop: scale(10),
  },
  exerciseSummaryIconContainer: {
    alignSelf: 'flex-end',
    marginTop: scale(10),
  },
  exerciseSummaryIcon: {
    width: scale(30),
    height: scale(30),
    tintColor: '#6BC46A',
  },
  exerciseSummaryRightContainer: {
    width: '48%', 
    height: scale(150),
    justifyContent: 'space-between',
  },
  exerciseSummaryBoxSmall: {
    height: scale(70),
    backgroundColor: '#444444',
    borderRadius: scale(15),
    padding: scale(10),
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  exerciseSummaryTitleSmall: {
    color: '#FFFFFF',
    fontSize: scale(12),
  },
  exerciseSummaryValueSmall: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
  exerciseSummaryIconContainerSmall: {
    alignSelf: 'flex-end',
    marginTop: scale(5),
  },
  exerciseSummaryIconSmall: {
    width: scale(20),
    height: scale(20),
    tintColor: '#6BC46A',
  },
});

export default Home;
