import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
  Alert,
  ToastAndroid,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getCheckinLogList} from '../api/services/checkinService';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {scale} from '../utils/responsive';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import ExerciseSummary from '../components/ExerciseSummary';
import {getMemberExerciseList} from '../api/services/memberExerciseService';
import {useAuth} from '../hooks/useAuth';
import ExerciseInfoPopup from '../components/ExerciseInfoPopup';
import CustomToast from '../components/CustomToast';

type RootStackParamList = {
  Home: undefined;
  Attendance: undefined;
  Shopping: undefined;
  Reservation: undefined;
  MyPage: undefined;
  MainTab: { screen: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 날짜 형식 변환 함수 추가
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const AttendanceRecord = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [checkinData, setCheckinData] = useState<{ [date: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();
  const [accumulatedData, setAccumulatedData] = useState({
    totalCalories: 0,
    totalJumpingCalories: 0,
    totalOtherCalories: 0,
    averageHeartRate: 0,
    averageRestTime: 0,
    averageSleepTime: 0,
  });
  const {memberInfo} = useAuth();
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [clickedDate, setClickedDate] = useState('');
  const [showCustomToast, setShowCustomToast] = useState(false);
  const [customToastMessage, setCustomToastMessage] = useState('');

  const fetchCheckinLog = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const memId = memberInfo?.mem_id;

      if (!memId) {
        setError('회원 정보를 찾을 수 없습니다.');
        return;
      }

      const requestParams = {
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        mem_id: parseInt(memId, 10),
      };

      const response = await getCheckinLogList(requestParams);
      if (response.success && Array.isArray(response.data)) {
        const dateTimeMap = response.data.reduce((acc, item) => {
          acc[item.ci_date_only] = item.ci_time_only;
          return acc;
        }, {} as { [date: string]: string });
        setCheckinData(dateTimeMap);
      } else {
        setCheckinData({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '출석 기록을 불러오는데 실패했습니다.');
      setCheckinData({});
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseData = async () => {
    if (!memberInfo?.mem_id) return;
    
    try {
      setLoading(true);
      
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      
      // 현재 월의 yearMonth 포맷 생성 (YYYYMM)
      const yearMonth = `${year}${month < 10 ? '0' + month : month}`;
      
      // 운동 정보 API 호출
      const response = await getMemberExerciseList(Number(memberInfo.mem_id), yearMonth, '');
      
      if (response.success) {
        const exerciseData = Array.isArray(response.data) ? response.data || [] : [response.data || {}];
        
        // 누적 데이터 계산
        let totalCalories = 0;
        let totalJumpingCalories = 0;
        let totalOtherCalories = 0;
        let totalHeartRate = 0;
        let heartRateCount = 0;
        let dailyRestTimes = [];
        let dailySleepTimes = [];
        
        exerciseData.forEach(data => {
          // 점핑 운동 칼로리 계산
          let jumpingCalories = 0;
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
          
          // 점핑 운동 시간에 따른 칼로리 조정
          if (data.jumping_exercise_time && baseCalories > 0) {
            const hours = parseInt(data.jumping_exercise_time.substring(0, 2), 10);
            const minutes = parseInt(data.jumping_exercise_time.substring(2, 4), 10);
            const totalMinutes = hours * 60 + minutes;
            
            const timeRatio = totalMinutes / 60;
            jumpingCalories = Math.round(baseCalories * timeRatio);
          }
          
          // 기타 운동 칼로리 추가
          let otherCalories = 0;
          if (data.other_exercise_calory) {
            otherCalories = parseInt(data.other_exercise_calory, 10) || 0;
          }
          
          // 그 날의 총 칼로리
          const dayTotalCalories = jumpingCalories + otherCalories;
          totalCalories += dayTotalCalories;
          totalJumpingCalories += jumpingCalories;
          totalOtherCalories += otherCalories;
          
          // 그 날의 필요 운동시간 계산: (칼로리 ÷ 1000) × 120분
          const dayRequiredExerciseMinutes = Math.round((dayTotalCalories / 1000) * 120);
          
          // 그 날의 필요 휴식시간 계산: 운동시간 × 0.75
          const dayRequiredRestMinutes = Math.round(dayRequiredExerciseMinutes * 0.75);
          dailyRestTimes.push(dayRequiredRestMinutes);
          
          // 그 날의 필요 수면시간 계산: 8시간 + (칼로리 ÷ 500) × 20분
          const dayRequiredSleepMinutes = Math.round(8 * 60 + (dayTotalCalories / 500) * 20);
          dailySleepTimes.push(dayRequiredSleepMinutes);
          
          // 심박수 계산 (점핑 운동만, 기타 운동은 심박수 데이터 없음)
          let heartRate = 0;
          if (data.jumping_heart_rate && parseInt(data.jumping_heart_rate, 10) > 0) {
            heartRate = parseInt(data.jumping_heart_rate, 10);
          } else if (data.jumping_intensity_level) {
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
        
        // 평균 심박수 계산
        const averageHeartRate = heartRateCount > 0 ? Math.round(totalHeartRate / heartRateCount) : 0;
        
        // 평균 필요 휴식시간 계산
        const averageRestTime = dailyRestTimes.length > 0 ? Math.round(dailyRestTimes.reduce((a, b) => a + b, 0) / dailyRestTimes.length) : 0;
        
        // 평균 필요 수면시간 계산  
        const averageSleepTime = dailySleepTimes.length > 0 ? Math.round(dailySleepTimes.reduce((a, b) => a + b, 0) / dailySleepTimes.length) : 0;
        
        // 누적 데이터 설정
        setAccumulatedData({
          totalCalories,
          totalJumpingCalories,
          totalOtherCalories,
          averageHeartRate,
          averageRestTime,
          averageSleepTime,
        });
      }
    } catch (error) {
      // 오류 발생 시 사용자에게 알림
      setCustomToastMessage('운동 정보를 불러오는데 실패했습니다.');
      setShowCustomToast(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCheckinLog();
      fetchExerciseData();
    }, [selectedDate])
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    // 이전 달의 날짜들로 첫 주 채우기
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift({
        date: prevDate,
        isCurrentMonth: false,
      });
    }
    
    // 현재 달의 날짜들
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // 다음 달의 날짜들로 마지막 주 채우기
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }
    }
    
    return days;
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setSelectedDate(newDate);
  };

  const renderDay = ({item}: any) => {
    // ISO 문자열 대신 formatDate 함수 사용
    const dateString = formatDate(item.date);
    const checkinTime = checkinData[dateString];
    const isCheckedIn = !!checkinTime;

    const dayStyle = [
      styles.dayCell,
      !item.isCurrentMonth && styles.otherMonthDay,
    ];

    const textStyle = [
      styles.dayText,
      !item.isCurrentMonth && styles.otherMonthText,
      item.date.getDay() === 0 && styles.sundayText,
      item.date.getDay() === 6 && styles.saturdayText,
      isCheckedIn && styles.checkedInText,
    ];

    const handleDayPress = () => {
      if (isCheckedIn && item.isCurrentMonth) {
        // 선택된 월의 전체 날짜 정보를 YYYYMMDD 형식으로 생성
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const day = item.date.getDate();
        const formattedDate = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;

        setClickedDate(formattedDate);
        setShowAttendancePopup(true);
      }
    };

    return (
      <TouchableOpacity 
        style={dayStyle}
        onPress={handleDayPress}
        disabled={!item.isCurrentMonth}
      >
        {isCheckedIn ? (
          <View style={styles.checkedInCircle}>
            <Text style={styles.checkedInText}>
              {item.date.getDate()}
            </Text>
          </View>
        ) : (
          <Text style={textStyle}>
            {item.date.getDate()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderCalendar = () => (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Image source={IMAGES.icons.arrowLeftGray} style={styles.headerButton} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Image source={IMAGES.icons.arrowRightGray} style={styles.headerButton} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.weekDays}>
          {DAYS.map((day, index) => (
            <Text 
              key={index} 
              style={[
                styles.weekDayText,
                index === 0 && styles.sundayText,
                index === 6 && styles.saturdayText,
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        <FlatList
          data={getDaysInMonth(selectedDate)}
          renderItem={renderDay}
          numColumns={7}
          scrollEnabled={false}
          keyExtractor={(item) => item.date.toISOString()}
        />
      </View>
    </View>
  );

  return (
    <>
      <CommonHeader title="출석 기록" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: scale(40)}}
      >
        {renderCalendar()}
        
        {/* 월별 누적 운동량 컴포넌트 추가 */}
        <ExerciseSummary 
          data={accumulatedData} 
          title={`${selectedDate.getMonth() + 1}월 누적 운동량`}
        />
        
        <TouchableOpacity 
          style={styles.attendanceButton}
          onPress={() => navigation.navigate('MainTab', { screen: 'Attendance' })}
        >
          <Text style={styles.attendanceButtonText}>출석하러 가기</Text>
        </TouchableOpacity>

        {/* 운동 정보 팝업 */}
        <ExerciseInfoPopup
          visible={showAttendancePopup}
          date={clickedDate}
          onClose={() => setShowAttendancePopup(false)}
          onExerciseInfoUpdated={() => {
            fetchExerciseData();
          }}
        />

        {/* 커스텀 토스트 */}
        <CustomToast
          visible={showCustomToast}
          message={customToastMessage}
          onHide={() => setShowCustomToast(false)}
        />
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
    padding: scale(16),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(15),
  },
  headerTitle: {
    fontSize: scale(12),
    color: '#848484',
    marginHorizontal: scale(5),
  },
  headerButton: {
    width: scale(12),
    height: scale(12),
    resizeMode: 'contain',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: scale(10),
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale(8),
    margin: scale(2),
    padding: scale(2),
  },
  dayText: {
    fontSize: scale(14),
    color: '#FFFFFF',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  otherMonthText: {
    color: '#999999',
  },
  sundayText: {
    color: '#FF5F5F',
  },
  saturdayText: {
    color: '#50ABFF',
  },
  checkedInDay: {
    position: 'relative',
  },
  checkedInText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  attendanceButton: {
    backgroundColor: '#40B649',
    padding: scale(15),
    borderRadius: scale(10),
    alignItems: 'center',
  },
  attendanceButtonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: scale(10),
    marginBottom: scale(30),
    padding: scale(10),
    paddingTop: scale(20),
  },
  checkedInCircle: {
    width: scale(23),
    height: scale(23),
    borderRadius: scale(30),
    backgroundColor: '#43B546',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AttendanceRecord; 