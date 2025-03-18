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

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const Home = () => {
  const insets = useSafeAreaInsets();
  const {memberInfo, loadMemberInfo} = useAuth();
  const [checkinLogs, setCheckinLogs] = useState<string[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const [showPopup, setShowPopup] = useState(false);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    // AsyncStorage에서 회원 ID를 불러와 회원 정보 조회
    loadMemberInfo();
  }, []);

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
            <Icon name="notifications" size={scale(24)} color="#FFFFFF" />
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
              <Icon name="chevron-right" size={scale(16)} color="#999999" />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarContent}>
            {sevenDaysData.map(item => (
              <TouchableOpacity
                key={item.date.toString()}
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
            ))}
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>섹션 3</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>콘텐츠 카드 3</Text>
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={{height: scale(20)}} />
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
    borderRadius: scale(8),
    padding: scale(16),
    minHeight: scale(100),
    justifyContent: 'center',
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
  dateItem: {
    backgroundColor: '#333333',
    borderWidth: 1,
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
});

export default Home;
