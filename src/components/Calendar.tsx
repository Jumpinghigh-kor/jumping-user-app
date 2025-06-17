import React, {useState} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Image} from 'react-native';
import { scale } from '../utils/responsive';
import images from '../utils/images';

interface CalendarProps {
  selectedDate: string;
  scheduledDates: string[];
  orderList: any[];
  onDateSelect: (date: string, isScheduled: boolean) => void;
  onMembershipError: () => void;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  scheduledDates,
  orderList,
  onDateSelect,
  onMembershipError
}) => {
  const [currentViewMonth, setCurrentViewMonth] = useState(new Date().getMonth());
  const [currentViewYear, setCurrentViewYear] = useState(new Date().getFullYear());

  // 달력 관련 계산
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  const lastDayOfMonth = new Date(currentViewYear, currentViewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentViewYear, currentViewMonth, 1).getDay();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  
  const calendarDays = [];
  
  // 이전 달 날짜 채우기
  const prevMonthLastDate = new Date(currentViewYear, currentViewMonth, 0).getDate();
  for (let i = 0; i < firstDayOfMonth; i++) {
    const prevMonthDate = prevMonthLastDate - (firstDayOfMonth - 1) + i;
    calendarDays.push({day: prevMonthDate, isPrevMonth: true});
  }
  
  // 이번 달 날짜 채우기
  for (let i = 1; i <= lastDayOfMonth; i++) {
    calendarDays.push({day: i, isCurrentMonth: true});
  }
  
  // 다음 달 날짜 채우기
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
    const isScheduled = scheduledDates.includes(formattedDate);
    
    // orderList가 0이면 회원권 구매 에러 표시
    if (orderList.length === 0) {
      onMembershipError();
      return;
    }
    
    onDateSelect(formattedDate, isScheduled);
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

  return (
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
              index === 0 && styles.sundayText,
              index === 6 && {color: '#50ABFF'}
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
                  (index % 7 === 0) && isCurrentMonth && !isPastDate && styles.sundayText,
                  (index % 7 === 0) && isPastDate && {color: '#8B2A2A'},
                  (index % 7 === 0) && !isCurrentMonth && {color: '#8B2A2A'},
                  (index % 7 === 6) && !isPastDate && isCurrentMonth && {color: '#50ABFF'},
                  (index % 7 === 6) && isPastDate && {color: '#2A5F99'},
                  (index % 7 === 6) && !isCurrentMonth && {color: '#2A5F99'},
                  isPastDate && (index % 7 !== 6) && (index % 7 !== 0) && styles.pastDayText,
                  (!isCurrentMonth) && (index % 7 !== 0) && (index % 7 !== 6) && styles.otherMonthText,
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
  );
};

const styles = StyleSheet.create({
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
  scheduledDayBackground: {
    backgroundColor: '#40B649',
    borderRadius: scale(50),
  },
});

export default Calendar; 