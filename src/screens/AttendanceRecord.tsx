import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getCheckinLogList} from '../api/services/checkinService';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Attendance: undefined;
  Shopping: undefined;
  Reservation: undefined;
  MyPage: undefined;
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

  const fetchCheckinLog = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const memId = await AsyncStorage.getItem('mem_id');

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

  useFocusEffect(
    useCallback(() => {
      fetchCheckinLog();
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
      isCheckedIn && styles.checkedInDay,
    ];

    const textStyle = [
      styles.dayText,
      !item.isCurrentMonth && styles.otherMonthText,
      item.date.getDay() === 0 && styles.sundayText,
      item.date.getDay() === 6 && styles.saturdayText,
      isCheckedIn && styles.checkedInText,
    ];

    return (
      <TouchableOpacity 
        style={dayStyle}
        onPress={() => console.log(dateString, checkinTime)}
        disabled={!item.isCurrentMonth}
      >
        <Text style={textStyle}>
          {item.date.getDate()}
        </Text>
        {isCheckedIn && (
          <>
            <View style={styles.checkedInDot} />
            <Text style={styles.timeText}>{checkinTime}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderCalendar = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Text style={styles.headerButton}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Text style={styles.headerButton}>{'>'}</Text>
        </TouchableOpacity>
      </View>

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
    </>
  );

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      {renderCalendar()}
      <TouchableOpacity 
        style={styles.attendanceButton}
        onPress={() => navigation.navigate('Attendance')}
      >
        <Text style={styles.attendanceButtonText}>출석하러 가기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242527',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#242527',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButton: {
    fontSize: 24,
    padding: 10,
    color: '#FFFFFF',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
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
    borderRadius: 8,
    margin: 2,
    padding: 2,
    backgroundColor: '#333639',
  },
  dayText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  otherMonthText: {
    color: '#999999',
  },
  sundayText: {
    color: '#FF6B6B',
  },
  saturdayText: {
    color: '#6B9AFF',
  },
  checkedInDay: {
    backgroundColor: '#2E4A3D',
  },
  checkedInText: {
    color: '#4ADE80',
    fontWeight: 'bold',
  },
  checkedInDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    position: 'absolute',
    bottom: '15%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(36, 37, 39, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    padding: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 10,
    color: '#4ADE80',
    marginTop: 2,
  },
  attendanceButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  attendanceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AttendanceRecord; 