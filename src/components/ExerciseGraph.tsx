import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import { getMemberExerciseList } from '../api/services/memberExerciseService';
import ExerciseInfoPopup from './ExerciseInfoPopup';

type Period = '일' | '주' | '월' | '연';
type Category = '칼로리' | '심박수';

// Constants
const EXERCISE_CONSTANTS = {
  CALORIES: {
    LOW: 300,
    MODERATE: 400,
    HIGH: 500
  },
  DISTANCE: {
    LOW: 1.5,
    MODERATE: 4.5,
    HIGH: 9.5
  },
  HEART_RATE: {
    LOW: 110,
    MODERATE: 130,
    HIGH: 150
  }
};

interface ExerciseData {
  exercise_dt: string;
  jumping_intensity_level: string;
  jumping_exercise_time: string;
  jumping_heart_rate: string;
  other_exercise_type: string;
  other_exercise_time: string;
  other_exercise_calory: string;
}

// Utility functions
const calculateExerciseMetrics = (data: ExerciseData) => {
  const { jumping_intensity_level, jumping_exercise_time } = data;
  
  // Calculate time ratio
  const hours = jumping_exercise_time && jumping_exercise_time.length >= 2 ? parseInt(jumping_exercise_time.substring(0, 2), 10) : 0;
  const minutes = jumping_exercise_time && jumping_exercise_time.length >= 4 ? parseInt(jumping_exercise_time.substring(2, 4), 10) : 0;
  const totalMinutes = hours * 60 + minutes;
  const timeRatio = totalMinutes / 60;

  // Calculate calories
  const baseCalories = EXERCISE_CONSTANTS.CALORIES[jumping_intensity_level] || 0;
  const calories = Math.round(baseCalories * timeRatio);

  // Calculate distance
  const baseDistance = EXERCISE_CONSTANTS.DISTANCE[jumping_intensity_level] || 0;
  const distance = baseDistance * timeRatio;

  // Calculate heart rate
  let heartRate = 0;
  if (data.jumping_heart_rate && parseInt(data.jumping_heart_rate, 10) > 0) {
    heartRate = parseInt(data.jumping_heart_rate, 10);
  } else {
    heartRate = EXERCISE_CONSTANTS.HEART_RATE[jumping_intensity_level] || 0;
  }

  return { calories, distance, heartRate };
};

interface ExerciseGraphProps {
  selectedPeriod: Period;
  activeCategory?: Category;
  graphData?: any[];
  onPeriodChange: (period: Period) => void;
  onCategoryChange?: (category: Category) => void;
  memId: number;
  exerciseData: any[];
  onDateClick?: (date: string) => void;
  goalCalories?: number;
}

const ExerciseGraph: React.FC<ExerciseGraphProps> = ({
  selectedPeriod,
  activeCategory = '칼로리',
  graphData: propGraphData,
  onPeriodChange,
  onCategoryChange,
  memId,
  exerciseData,
  onDateClick,
  goalCalories,
}) => {
  const [showPeriodSelect, setShowPeriodSelect] = useState(false);
  const [showExercisePopup, setShowExercisePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [internalExerciseData, setInternalExerciseData] = useState<any[]>(exerciseData);

  // 내부 그래프 데이터 생성
  const graphData = useMemo(() => {
    const today = new Date();
    
    if (selectedPeriod === '주') {
      const year = today.getFullYear();
      const month = today.getMonth();
      
      // 이번 달의 첫날과 마지막날 구하기
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // 이번 달의 첫 주 시작일 구하기 (일요일 기준)
      const firstSunday = new Date(firstDayOfMonth);
      const dayOfWeek = firstDayOfMonth.getDay();
      
      if (dayOfWeek !== 0) {
        firstSunday.setDate(firstDayOfMonth.getDate() - dayOfWeek);
      }
      
      // 주 단위로 데이터 생성
      const weekData = [];
      let currentDate = new Date(firstSunday);
      let weekCounter = 1;
      
      while (true) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekMiddle = new Date(currentDate);
        weekMiddle.setDate(weekStart.getDate() + 3);
        
        const isWeekInMonth = 
          (weekMiddle.getMonth() === month && weekMiddle.getFullYear() === year) ||
          (weekStart.getMonth() === month && weekStart.getFullYear() === year) ||
          (weekEnd.getMonth() === month && weekEnd.getFullYear() === year);
        
        if (isWeekInMonth) {
          const weekStartText = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
          const weekEndText = `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
          
          weekData.push({
            id: `week-${weekCounter}`,
            date: weekCounter,
            day: `${weekCounter}주`,
            weekDate: `${weekStartText}-${weekEndText}`,
            isToday: false,
            isPast: weekEnd < today,
            isCheckedIn: false,
          });
          
          weekCounter++;
        }
        
        currentDate.setDate(currentDate.getDate() + 7);
        
        if (currentDate > lastDayOfMonth && currentDate.getDate() > 7) {
          break;
        }
      }
      
      return weekData;
    } else if (selectedPeriod === '월') {
      // 올해의 모든 월 표시
      const year = today.getFullYear();
      const monthData = [];
      
      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(year, month, 1);
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        const isCurrentMonth = today.getMonth() === month;
        const isPastMonth = monthDate < new Date(today.getFullYear(), today.getMonth(), 1);
        
        monthData.push({
          id: `month-${month + 1}`,
          date: month + 1,
          day: monthNames[month],
          isToday: isCurrentMonth,
          isPast: isPastMonth,
          isCheckedIn: false,
        });
      }
      
      return monthData;
    } else if (selectedPeriod === '연') {
      // 현재 연도와 이전 5년 표시
      const currentYear = today.getFullYear();
      const yearData = [];
      
      for (let i = 5; i >= 0; i--) {
        const year = currentYear - i;
        const isCurrentYear = year === currentYear;
        const isPastYear = year < currentYear;
        
        yearData.push({
          id: `year-${year}`,
          date: year,
          day: `${year}`,
          isToday: isCurrentYear,
          isPast: isPastYear,
          isCheckedIn: false,
        });
      }
      
      return yearData;
    } else {
      // 일별 데이터 - 이번 달 전체
      const year = today.getFullYear();
      const month = today.getMonth();
      const currentDate = today.getDate();
      const lastDay = new Date(year, month + 1, 0).getDate();

      return Array.from({length: lastDay}, (_, i) => {
        const date = i + 1;
        const dateObj = new Date(year, month, date);
        const day = dateObj.getDay();
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

        return {
          id: String(date),
          date,
          day: dayNames[day],
          isToday: date === currentDate,
          isPast: date < currentDate,
          isCheckedIn: false,
        };
      });
    }
  }, [selectedPeriod]);

  // 운동 정보 새로고침 함수
  const refreshExerciseData = React.useCallback(async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      
      // 선택된 기간 값을 영어로 변환
      let periodValue = 'day';
      let apiParam = '';
      
      switch (selectedPeriod) {
        case '일':
          periodValue = 'day';
          apiParam = `${year}${month < 10 ? '0' + month : month}`;
          break;
        case '주':
          periodValue = 'week';
          apiParam = `${year}${month < 10 ? '0' + month : month}`;
          break;
        case '월':
          periodValue = 'month';
          apiParam = `${year}`;
          break;
        case '연':
          periodValue = 'year';
          apiParam = 'all_date';
          break;
        default:
          periodValue = 'day';
          apiParam = `${year}${month < 10 ? '0' + month : month}`;
      }
      
      // 운동 정보 API 호출 (기간에 따른 파라미터 전달)
      const response = await getMemberExerciseList(memId, apiParam, periodValue);

      if (response.success) {
        const newData = Array.isArray(response.data) ? response.data || [] : [response.data || {}];
        setInternalExerciseData(newData);
      }
    } catch (error) {
    }
  }, [selectedPeriod, memId]);

  // 날짜 클릭 핸들러
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowExercisePopup(true);
    if (onDateClick) {
      onDateClick(date);
    }
  };

  // 카테고리별 그래프 데이터 설정
  const getCategoryData = () => {
    // 월별과 연별은 API로 새로 받아온 전체 데이터 사용, 일별과 주별은 props 데이터 사용
    const dataToUse = (selectedPeriod === '월' || selectedPeriod === '연') ? internalExerciseData : exerciseData;
    
    const weekDates = graphData.map(item => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      
      switch(selectedPeriod) {
        case '주':
          // 주간 형식 수정: 주간 데이터에서 weekDate 속성을 사용
          if (item.weekDate) {
            // weekDate에서 시작 날짜만 추출 (예: "11/5-11/11"에서 "11/5")
            const startDate = item.weekDate.split('-')[0].trim();
            const [startMonth, startDay] = startDate.split('/');
            // 주간 형식 생성
            return `${year}${startMonth.padStart(2, '0')}W${item.date < 10 ? '0' + item.date : item.date}`;
          }
          // 기존 방식 유지 (fallback)
          return `${year}${month < 10 ? '0' + month : month}W${item.date < 10 ? '0' + item.date : item.date}`;
        case '월':
          return `${year}${item.date < 10 ? '0' + item.date : item.date}`;
        case '연':
          return `${item.date}`;
        default:
          const day = item.date < 10 ? `0${item.date}` : `${item.date}`;
          return `${year}${month < 10 ? '0' + month : month}${day}`;
      }
    });

    const weeklyDataValues = weekDates.map(() => 0);
    
    if (selectedPeriod === '주') {
      // 주간 데이터 처리: 날짜 범위로 매칭
      graphData.forEach((item, index) => {
        if (item.weekDate) {
          // weekDate 형식: "11/5-11/11"
          const [startDateStr, endDateStr] = item.weekDate.split('-');
          const [startMonth, startDay] = startDateStr.trim().split('/').map(Number);
          const [endMonth, endDay] = endDateStr.trim().split('/').map(Number);
          
          const today = new Date();
          const year = today.getFullYear();
          
          // 시작일과 종료일을 YYYYMMDD 형식으로 변환
          const startDate = `${year}${startMonth.toString().padStart(2, '0')}${startDay.toString().padStart(2, '0')}`;
          const endDate = `${year}${endMonth.toString().padStart(2, '0')}${endDay.toString().padStart(2, '0')}`;
          
          // 해당 주간 범위에 속하는 모든 운동 데이터 찾기
          const weeklyExerciseData = dataToUse.filter(data => 
            data.exercise_dt >= startDate && data.exercise_dt <= endDate
          );
          
          // 주간 총 칼로리 계산
          let totalWeeklyCalories = 0;
          let totalWeeklyHeartRate = 0;
          let heartRateCount = 0;
          
          weeklyExerciseData.forEach(data => {
            const { calories, distance, heartRate } = calculateExerciseMetrics(data);
            const otherCalories = data.other_exercise_calory ? Number(data.other_exercise_calory) : 0;
            
            totalWeeklyCalories += calories + otherCalories;
            
            if (heartRate > 0) {
              totalWeeklyHeartRate += heartRate;
              heartRateCount++;
            }
          });
          
          switch(activeCategory) {
            case '칼로리':
              weeklyDataValues[index] = totalWeeklyCalories;
              break;
            case '심박수':
              weeklyDataValues[index] = heartRateCount > 0 ? Math.round(totalWeeklyHeartRate / heartRateCount) : 0;
              break;
          }
        }
      });
    } else if (selectedPeriod === '월') {
      // 월별 데이터 처리: 각 월의 모든 데이터 합산
      graphData.forEach((item, index) => {
        const today = new Date();
        const year = today.getFullYear();
        const month = item.date; // 1~12월
        
        // 해당 월의 시작일과 종료일 계산
        const startDate = `${year}${month.toString().padStart(2, '0')}01`;
        const lastDay = new Date(year, month + 1, 0).getDate(); // 해당 월의 마지막 날
        const endDate = `${year}${month.toString().padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`;
        
        // 해당 월 범위에 속하는 모든 운동 데이터 찾기
        const monthlyExerciseData = dataToUse.filter(data => 
          data.exercise_dt >= startDate && data.exercise_dt <= endDate
        );
        
        // 월별 총 칼로리 계산
        let totalMonthlyCalories = 0;
        let totalMonthlyHeartRate = 0;
        let heartRateCount = 0;
        
        monthlyExerciseData.forEach(data => {
          const { calories, distance, heartRate } = calculateExerciseMetrics(data);
          const otherCalories = data.other_exercise_calory ? Number(data.other_exercise_calory) : 0;
          
          totalMonthlyCalories += calories + otherCalories;
          
          if (heartRate > 0) {
            totalMonthlyHeartRate += heartRate;
            heartRateCount++;
          }
        });
        
        switch(activeCategory) {
          case '칼로리':
            weeklyDataValues[index] = totalMonthlyCalories;
            break;
          case '심박수':
            weeklyDataValues[index] = heartRateCount > 0 ? Math.round(totalMonthlyHeartRate / heartRateCount) : 0;
            break;
        }
      });
    } else if (selectedPeriod === '연') {
      // 연별 데이터 처리: 각 연도의 모든 데이터 합산
      graphData.forEach((item, index) => {
        const year = item.date; // 연도 (예: 2024)
        
        // 해당 연도의 시작일과 종료일 계산
        const startDate = `${year}0101`;
        const endDate = `${year}1231`;
        
        // 해당 연도 범위에 속하는 모든 운동 데이터 찾기
        const yearlyExerciseData = dataToUse.filter(data => 
          data.exercise_dt >= startDate && data.exercise_dt <= endDate
        );
        
        // 연별 총 칼로리 계산
        let totalYearlyCalories = 0;
        let totalYearlyHeartRate = 0;
        let heartRateCount = 0;
        
        yearlyExerciseData.forEach(data => {
          const { calories, distance, heartRate } = calculateExerciseMetrics(data);
          const otherCalories = data.other_exercise_calory ? Number(data.other_exercise_calory) : 0;
          
          totalYearlyCalories += calories + otherCalories;
          
          if (heartRate > 0) {
            totalYearlyHeartRate += heartRate;
            heartRateCount++;
          }
        });
        
        switch(activeCategory) {
          case '칼로리':
            weeklyDataValues[index] = totalYearlyCalories;
            break;
          case '심박수':
            weeklyDataValues[index] = heartRateCount > 0 ? Math.round(totalYearlyHeartRate / heartRateCount) : 0;
            break;
        }
      });
    } else {
      // 일별 데이터 처리: 기존 로직
      dataToUse.forEach(data => {
        const { calories, distance, heartRate } = calculateExerciseMetrics(data);
        const dateIndex = weekDates.findIndex(date => date === data.exercise_dt);
        
        if (dateIndex !== -1) {
          switch(activeCategory) {
            case '칼로리':
              // 점핑 운동 칼로리 + 기타 운동 칼로리
              const otherCalories = data.other_exercise_calory ? Number(data.other_exercise_calory) : 0;
              weeklyDataValues[dateIndex] = calories + otherCalories;
              break;
            case '심박수':
              weeklyDataValues[dateIndex] = heartRate;
              break;
          }
        }
      });
    }

    return weeklyDataValues;
  };

  // 총합 계산
  const getTotalValue = () => {
    const categoryData = getCategoryData();
    if (activeCategory === '심박수') {
      // 심박수의 경우 평균 계산 (0이 아닌 값들만)
      const nonZeroValues = categoryData.filter(value => value > 0);
      return nonZeroValues.length > 0 ? Math.round(nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length) : 0;
    } else {
      // 칼로리의 경우 총합
      return categoryData.reduce((a, b) => a + b, 0);
    }
  };

  useEffect(() => {
    // 기간이 변경되면 즉시 새로운 데이터 가져오기
    refreshExerciseData();
  }, [memId, selectedPeriod, refreshExerciseData]);

  const getYAxisLabels = () => {
    const labels = {
      심박수: ['250', '200', '150', '100', '50', '0'],
      칼로리: {
        주: ['6000', '4800', '3600', '2400', '1200', '0'],
        월: ['5만', '4만', '3만', '2만', '1만', '0'],
        연: ['50만', '40만', '30만', '20만', '10만', '0'],
        일: ['1500', '1200', '900', '600', '300', '0']
      }
    };

    if (activeCategory === '심박수') return labels.심박수;
    return labels.칼로리[selectedPeriod] || labels.칼로리.일;
  };

  const calculateBarHeight = (value: number, index: number) => {
    let heightPercent = 0;
    switch(selectedPeriod) {
      case '일':
        if (activeCategory === '칼로리') {
          // Y축: 1500, 1200, 900, 600, 300, 0 (6단계)
          // 300 칼로리는 전체 높이의 1/5 지점에 위치해야 함
          heightPercent = (value / 1500) * 150;
        } else {
          // 심박수: Y축 최대값 250
          heightPercent = (value / 250) * 150;
        }
        break;
      case '주':
        if (activeCategory === '칼로리') {
          heightPercent = (value / 6000) * 150;
        } else {
          // 심박수: Y축 최대값 250
          heightPercent = (value / 250) * 150;
        }
        break;
      case '월':
        if (activeCategory === '칼로리') {
          heightPercent = (value / 50000) * 150;
        } else {
          // 심박수: Y축 최대값 250
          heightPercent = (value / 250) * 150;
        }
        break;
      case '연':
        if (activeCategory === '칼로리') {
          heightPercent = (value / 500000) * 150;
        } else {
          // 심박수: Y축 최대값 250
          heightPercent = (value / 250) * 150;
        }
        break;
    }
    
    // 초록 막대를 살짝 늘려서 노란선과 맞춤
    const adjustedHeight = Platform.OS === 'ios' ? Math.min(heightPercent, 150) + scale(2) : Math.min(heightPercent, 150) + -scale(1);
    return adjustedHeight;
  };

  const generateDateString = (item: any): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    
    if (selectedPeriod === '주') {
      return `${year}${month < 10 ? '0' + month : month}W${item.date < 10 ? '0' + item.date : item.date}`;
    } else if (selectedPeriod === '월') {
      return `${year}${item.date < 10 ? '0' + item.date : item.date}`;
    } else if (selectedPeriod === '연') {
      return `${item.date}`;
    } else {
      const day = item.date < 10 ? `0${item.date}` : `${item.date}`;
      return `${year}${month < 10 ? '0' + month : month}${day}`;
    }
  };

  // 주간 데이터의 경우 날짜 범위에서 운동 데이터 찾기
  const findWeeklyExerciseData = (item: any) => {
    // 월별과 연별은 API로 새로 받아온 전체 데이터 사용, 일별과 주별은 props 데이터 사용
    const dataToUse = (selectedPeriod === '월' || selectedPeriod === '연') ? internalExerciseData : exerciseData;
    
    if (selectedPeriod !== '주' || !item.weekDate) {
      return null;
    }

    // weekDate 형식: "11/5-11/11"
    const [startDateStr, endDateStr] = item.weekDate.split('-');
    const [startMonth, startDay] = startDateStr.trim().split('/').map(Number);
    const [endMonth, endDay] = endDateStr.trim().split('/').map(Number);
    
    const today = new Date();
    const year = today.getFullYear();
    
    // 시작일과 종료일을 YYYYMMDD 형식으로 변환
    const startDate = `${year}${startMonth.toString().padStart(2, '0')}${startDay.toString().padStart(2, '0')}`;
    const endDate = `${year}${endMonth.toString().padStart(2, '0')}${endDay.toString().padStart(2, '0')}`;
    
    // 해당 주간 범위에 속하는 모든 운동 데이터 찾기
    const weeklyData = dataToUse.filter(data => 
      data.exercise_dt >= startDate && data.exercise_dt <= endDate
    );
    
    // 주간 기타 운동 칼로리 합계 계산
    let totalOtherCalory = 0;
    let totalJumpingCalory = 0;
    let totalHeartRate = 0;
    let heartRateCount = 0;
    
    weeklyData.forEach(data => {
      // 기타 운동 칼로리
      if (data.other_exercise_calory) {
        totalOtherCalory += Number(data.other_exercise_calory);
      }
      
      // 점핑 운동 칼로리 계산
      if (data.jumping_exercise_time && data.jumping_intensity_level) {
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
        }
        
        // 운동 시간에 따른 칼로리 조정
        const hours = parseInt(data.jumping_exercise_time.substring(0, 2), 10);
        const minutes = parseInt(data.jumping_exercise_time.substring(2, 4), 10);
        const totalMinutes = hours * 60 + minutes;
        const timeRatio = totalMinutes / 60;
        totalJumpingCalory += Math.round(baseCalories * timeRatio);
      }
      
      // 심박수 계산
      let heartRate = 0;
      if (data.jumping_heart_rate && parseInt(data.jumping_heart_rate, 10) > 0) {
        heartRate = parseInt(data.jumping_heart_rate, 10);
      } else if (data.jumping_intensity_level) {
        switch (data.jumping_intensity_level) {
          case 'LOW':
            heartRate = 110;
            break;
          case 'MODERATE':
            heartRate = 130;
            break;
          case 'HIGH':
            heartRate = 150;
            break;
        }
      }
      
      if (heartRate > 0) {
        totalHeartRate += heartRate;
        heartRateCount++;
      }
    });
    
    return { 
      other_exercise_calory: totalOtherCalory,
      jumping_calory: totalJumpingCalory,
      average_heart_rate: heartRateCount > 0 ? Math.round(totalHeartRate / heartRateCount) : 0
    };
  };

  // 월별 데이터의 경우 해당 월의 모든 운동 데이터 찾기
  const findMonthlyExerciseData = (item: any) => {
    // 월별과 연별은 API로 새로 받아온 전체 데이터 사용, 일별과 주별은 props 데이터 사용
    const dataToUse = (selectedPeriod === '월' || selectedPeriod === '연') ? internalExerciseData : exerciseData;
    
    if (selectedPeriod !== '월') {
      return null;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = item.date; // 1~12월
    
    // 해당 월의 시작일과 종료일 계산
    const startDate = `${year}${month.toString().padStart(2, '0')}01`;
    const lastDay = new Date(year, month + 1, 0).getDate(); // 해당 월의 마지막 날
    const endDate = `${year}${month.toString().padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`;
    
    // 해당 월 범위에 속하는 모든 운동 데이터 찾기
    const monthlyData = dataToUse.filter(data => 
      data.exercise_dt >= startDate && data.exercise_dt <= endDate
    );
    
    // 월별 기타 운동 칼로리 합계 계산
    let totalOtherCalory = 0;
    let totalJumpingCalory = 0;
    let totalHeartRate = 0;
    let heartRateCount = 0;
    
    monthlyData.forEach(data => {
      // 기타 운동 칼로리
      if (data.other_exercise_calory) {
        totalOtherCalory += Number(data.other_exercise_calory);
      }
      
      // 점핑 운동 칼로리 계산
      if (data.jumping_exercise_time && data.jumping_intensity_level) {
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
        }
        
        // 운동 시간에 따른 칼로리 조정
        const hours = parseInt(data.jumping_exercise_time.substring(0, 2), 10);
        const minutes = parseInt(data.jumping_exercise_time.substring(2, 4), 10);
        const totalMinutes = hours * 60 + minutes;
        const timeRatio = totalMinutes / 60;
        totalJumpingCalory += Math.round(baseCalories * timeRatio);
      }
      
      // 심박수 계산
      let heartRate = 0;
      if (data.jumping_heart_rate && parseInt(data.jumping_heart_rate, 10) > 0) {
        heartRate = parseInt(data.jumping_heart_rate, 10);
      } else if (data.jumping_intensity_level) {
        switch (data.jumping_intensity_level) {
          case 'LOW':
            heartRate = 110;
            break;
          case 'MODERATE':
            heartRate = 130;
            break;
          case 'HIGH':
            heartRate = 150;
            break;
        }
      }
      
      if (heartRate > 0) {
        totalHeartRate += heartRate;
        heartRateCount++;
      }
    });
    
    return { 
      other_exercise_calory: totalOtherCalory,
      jumping_calory: totalJumpingCalory,
      average_heart_rate: heartRateCount > 0 ? Math.round(totalHeartRate / heartRateCount) : 0
    };
  };

  // 연별 데이터의 경우 해당 연도의 모든 운동 데이터 찾기
  const findYearlyExerciseData = (item: any) => {
    // 월별과 연별은 API로 새로 받아온 전체 데이터 사용, 일별과 주별은 props 데이터 사용
    const dataToUse = (selectedPeriod === '월' || selectedPeriod === '연') ? internalExerciseData : exerciseData;
    
    if (selectedPeriod !== '연') {
      return null;
    }

    const year = item.date; // 연도 (예: 2024)
    
    // 해당 연도의 시작일과 종료일 계산
    const startDate = `${year}0101`;
    const endDate = `${year}1231`;
    
    // 해당 연도 범위에 속하는 모든 운동 데이터 찾기
    const yearlyData = dataToUse.filter(data => 
      data.exercise_dt >= startDate && data.exercise_dt <= endDate
    );
    
    // 연별 기타 운동 칼로리 합계 계산
    let totalOtherCalory = 0;
    let totalJumpingCalory = 0;
    let totalHeartRate = 0;
    let heartRateCount = 0;
    
    yearlyData.forEach(data => {
      // 기타 운동 칼로리
      if (data.other_exercise_calory) {
        totalOtherCalory += Number(data.other_exercise_calory);
      }
      
      // 점핑 운동 칼로리 계산
      if (data.jumping_exercise_time && data.jumping_intensity_level) {
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
        }
        
        // 운동 시간에 따른 칼로리 조정
        const hours = parseInt(data.jumping_exercise_time.substring(0, 2), 10);
        const minutes = parseInt(data.jumping_exercise_time.substring(2, 4), 10);
        const totalMinutes = hours * 60 + minutes;
        const timeRatio = totalMinutes / 60;
        totalJumpingCalory += Math.round(baseCalories * timeRatio);
      }
      
      // 심박수 계산
      let heartRate = 0;
      if (data.jumping_heart_rate && parseInt(data.jumping_heart_rate, 10) > 0) {
        heartRate = parseInt(data.jumping_heart_rate, 10);
      } else if (data.jumping_intensity_level) {
        switch (data.jumping_intensity_level) {
          case 'LOW':
            heartRate = 110;
            break;
          case 'MODERATE':
            heartRate = 130;
            break;
          case 'HIGH':
            heartRate = 150;
            break;
        }
      }
      
      if (heartRate > 0) {
        totalHeartRate += heartRate;
        heartRateCount++;
      }
    });
    
    return { 
      other_exercise_calory: totalOtherCalory,
      jumping_calory: totalJumpingCalory,
      average_heart_rate: heartRateCount > 0 ? Math.round(totalHeartRate / heartRateCount) : 0
    };
  };

  const renderGraphContent = () => {
    if (selectedPeriod === '월' || selectedPeriod === '일') {
      return (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.graphScrollContent}
        >
          <View style={styles.graphContent}>
            {graphData.map((item, index) => {
              const value = getCategoryData()[index] || 0;
              const height = calculateBarHeight(value, index);
              const itemKey = 'id' in item ? item.id : item.date.toString();
              
              // 날짜 형식 생성
              const dateStr = generateDateString(item);
              
              // 해당 날짜의 운동 데이터 찾기
              // 월별과 연별은 API로 새로 받아온 전체 데이터 사용, 일별과 주별은 props 데이터 사용
              const dataToUse = (selectedPeriod === '월' || selectedPeriod === '연') ? internalExerciseData : exerciseData;
              
              let exerciseInfo;
              if (selectedPeriod === '주') {
                exerciseInfo = findWeeklyExerciseData(item);
              } else if (selectedPeriod === '월') {
                exerciseInfo = findMonthlyExerciseData(item);
              } else if (selectedPeriod === '연') {
                exerciseInfo = findYearlyExerciseData(item);
              } else {
                exerciseInfo = dataToUse.find(data => data.exercise_dt === dateStr);
              }
              
              // 주간 데이터의 경우 계산된 값 사용, 다른 기간은 getCategoryData 사용
              let actualValue = value;
              if (selectedPeriod === '주' && exerciseInfo) {
                actualValue = activeCategory === '심박수' ? exerciseInfo.average_heart_rate : exerciseInfo.jumping_calory;
              } else if (selectedPeriod === '월' && exerciseInfo) {
                actualValue = activeCategory === '심박수' ? exerciseInfo.average_heart_rate : exerciseInfo.jumping_calory;
              } else if (selectedPeriod === '연' && exerciseInfo) {
                actualValue = activeCategory === '심박수' ? exerciseInfo.average_heart_rate : exerciseInfo.jumping_calory;
              } else if (selectedPeriod === '일' && exerciseInfo && activeCategory === '칼로리') {
                // 일별 데이터에서 점핑 운동 칼로리만 계산
                if (exerciseInfo.jumping_exercise_time && exerciseInfo.jumping_intensity_level) {
                  let baseCalories = 0;
                  switch (exerciseInfo.jumping_intensity_level) {
                    case 'LOW':
                      baseCalories = 300;
                      break;
                    case 'MODERATE':
                      baseCalories = 400;
                      break;
                    case 'HIGH':
                      baseCalories = 500;
                      break;
                  }
                  const hours = parseInt(exerciseInfo.jumping_exercise_time.substring(0, 2), 10);
                  const minutes = parseInt(exerciseInfo.jumping_exercise_time.substring(2, 4), 10);
                  const totalMinutes = hours * 60 + minutes;
                  const timeRatio = totalMinutes / 60;
                  actualValue = Math.round(baseCalories * timeRatio);
                } else {
                  actualValue = 0;
                }
              }
              const actualHeight = calculateBarHeight(actualValue, index);
              
              // other_exercise_calory 값 확인 (칼로리 카테고리일 때만)
              const otherExerciseCalory = (activeCategory === '칼로리' && exerciseInfo?.other_exercise_calory) ? Number(exerciseInfo.other_exercise_calory) : 0;
              const otherHeight = calculateBarHeight(otherExerciseCalory, index);

              // 단독으로 표시되는지 여부 확인
              const isGreenBarAlone = actualValue > 0 && otherExerciseCalory === 0;
              const isOrangeBarAlone = actualValue === 0 && otherExerciseCalory > 0;
              const areBothBarsPresent = actualValue > 0 && otherExerciseCalory > 0;

              return (
                <View 
                  key={itemKey} 
                  style={[
                    styles.graphItem
                  ]}
                >
                  <View style={styles.barContainer}>
                    {actualValue > 0 && (
                      <View style={[
                        styles.graphBarContainer, 
                        { height: scale(actualHeight) },
                        isGreenBarAlone && {
                          borderRadius: scale(10)
                        },
                        areBothBarsPresent && {
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                          borderBottomLeftRadius: scale(10),
                          borderBottomRightRadius: scale(10)
                        }
                      ]}>
                        <LinearGradient 
                          colors={['#43B546', '#43B546']}
                          style={[
                            styles.graphBarGradient,
                            isGreenBarAlone && {
                              borderRadius: scale(10)
                            },
                            areBothBarsPresent && {
                              borderTopLeftRadius: 0,
                              borderTopRightRadius: 0,
                              borderBottomLeftRadius: scale(10),
                              borderBottomRightRadius: scale(10)
                            }
                          ]}
                          start={{x: 0, y: 0}}
                          end={{x: 0, y: 1}}
                        />
                      </View>
                    )}
                    
                    {otherExerciseCalory > 0 && (
                      <View 
                        style={[
                          styles.graphBarContainer, 
                          { 
                            height: scale(otherHeight), 
                            backgroundColor: '#FFA95E',
                            position: 'absolute',
                            bottom: actualValue > 0 ? scale(actualHeight) : 0,
                            zIndex: 1,
                          },
                          isOrangeBarAlone && {
                            borderRadius: scale(10)
                          },
                          areBothBarsPresent && {
                            borderTopLeftRadius: scale(10),
                            borderTopRightRadius: scale(10),
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0
                          }
                        ]}
                      />
                    )}
                  </View>
                  <Text style={styles.graphDateLabel}>{item.date}</Text>
                  <Text style={styles.graphXLabel}>
                    {item.day || ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={[styles.graphContent, { justifyContent: 'space-evenly', width: '100%', flex: 1, flexDirection: 'row' }]}>
        {graphData.map((item, index, array) => {
          const value = getCategoryData()[index] || 0;
          const height = calculateBarHeight(value, index);
          const itemKey = 'id' in item ? item.id : item.date.toString();
          
          // 날짜 형식 생성
          const dateStr = generateDateString(item);
          
          // 해당 날짜의 운동 데이터 찾기
          // 월별과 연별은 API로 새로 받아온 전체 데이터 사용, 일별과 주별은 props 데이터 사용
          const dataToUse = (selectedPeriod === '월' || selectedPeriod === '연') ? internalExerciseData : exerciseData;
          
          let exerciseInfo;
          if (selectedPeriod === '주') {
            exerciseInfo = findWeeklyExerciseData(item);
          } else if (selectedPeriod === '월') {
            exerciseInfo = findMonthlyExerciseData(item);
          } else if (selectedPeriod === '연') {
            exerciseInfo = findYearlyExerciseData(item);
          } else {
            exerciseInfo = dataToUse.find(data => data.exercise_dt === dateStr);
          }
          
          // 주간 데이터의 경우 계산된 값 사용, 다른 기간은 getCategoryData 사용
          let actualValue = value;
          if (selectedPeriod === '주' && exerciseInfo) {
            actualValue = activeCategory === '심박수' ? exerciseInfo.average_heart_rate : exerciseInfo.jumping_calory;
          } else if (selectedPeriod === '월' && exerciseInfo) {
            actualValue = activeCategory === '심박수' ? exerciseInfo.average_heart_rate : exerciseInfo.jumping_calory;
          } else if (selectedPeriod === '연' && exerciseInfo) {
            actualValue = activeCategory === '심박수' ? exerciseInfo.average_heart_rate : exerciseInfo.jumping_calory;
          } else if (selectedPeriod === '일' && exerciseInfo && activeCategory === '칼로리') {
            // 일별 데이터에서 점핑 운동 칼로리만 계산
            if (exerciseInfo.jumping_exercise_time && exerciseInfo.jumping_intensity_level) {
              let baseCalories = 0;
              switch (exerciseInfo.jumping_intensity_level) {
                case 'LOW':
                  baseCalories = 300;
                  break;
                case 'MODERATE':
                  baseCalories = 400;
                  break;
                case 'HIGH':
                  baseCalories = 500;
                  break;
              }
              const hours = parseInt(exerciseInfo.jumping_exercise_time.substring(0, 2), 10);
              const minutes = parseInt(exerciseInfo.jumping_exercise_time.substring(2, 4), 10);
              const totalMinutes = hours * 60 + minutes;
              const timeRatio = totalMinutes / 60;
              actualValue = Math.round(baseCalories * timeRatio);
            } else {
              actualValue = 0;
            }
          }
          const actualHeight = calculateBarHeight(actualValue, index);
          
          // other_exercise_calory 값 확인 (칼로리 카테고리일 때만)
          const otherExerciseCalory = (activeCategory === '칼로리' && exerciseInfo?.other_exercise_calory) ? Number(exerciseInfo.other_exercise_calory) : 0;
          const otherHeight = calculateBarHeight(otherExerciseCalory, index);

          // 단독으로 표시되는지 여부 확인
          const isGreenBarAlone = actualValue > 0 && otherExerciseCalory === 0;
          const isOrangeBarAlone = actualValue === 0 && otherExerciseCalory > 0;
          const areBothBarsPresent = actualValue > 0 && otherExerciseCalory > 0;

          return (
            <View 
              key={itemKey} 
              style={[
                styles.graphItem, 
                { 
                  width: selectedPeriod === '주' ? scale(55) : selectedPeriod === '연' ? scale(45) : scale(35),
                }
              ]}
            >
              <View style={styles.barContainer}>
                {actualValue > 0 && (
                  <View style={[
                    styles.graphBarContainer, 
                    { height: scale(actualHeight) },
                    isGreenBarAlone && {
                      borderRadius: scale(10)
                    },
                    areBothBarsPresent && {
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      borderBottomLeftRadius: scale(10),
                      borderBottomRightRadius: scale(10)
                    }
                  ]}>
                    <LinearGradient 
                      colors={['#43B546', '#43B546']}
                      style={[
                        styles.graphBarGradient,
                        isGreenBarAlone && {
                          borderRadius: scale(10)
                        },
                        areBothBarsPresent && {
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                          borderBottomLeftRadius: scale(10),
                          borderBottomRightRadius: scale(10)
                        }
                      ]}
                      start={{x: 0, y: 0}}
                      end={{x: 0, y: 1}}
                    />
                  </View>
                )}
                
                {otherExerciseCalory > 0 && (
                  <View 
                    style={[
                      styles.graphBarContainer, 
                      { 
                        height: scale(otherHeight), 
                        backgroundColor: '#FFA95E',
                        position: 'absolute',
                        bottom: actualValue > 0 ? scale(actualHeight) : 0,
                        zIndex: 1,
                      },
                      isOrangeBarAlone && {
                        borderRadius: scale(10)
                      },
                      areBothBarsPresent && {
                        borderTopLeftRadius: scale(10),
                        borderTopRightRadius: scale(10),
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0
                      }
                    ]}
                  />
                )}
              </View>
              <Text style={styles.graphDateLabel}>{item.date}</Text>
              <Text style={styles.graphXLabel}>
                {item.day || ''}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const calculateGoalLinePosition = (goalCalories: number) => {
    // 목표 칼로리에 따른 점선 위치 계산
    let heightPercent = 0;
    switch(selectedPeriod) {
      case '일':
        heightPercent = (goalCalories / 1500) * 150;
        break;
      case '주':
        heightPercent = (goalCalories / 6000) * 150;
        break;
      case '월':
        heightPercent = (goalCalories / 50000) * 150;
        break;
      case '연':
        heightPercent = (goalCalories / 500000) * 150;
        break;
    }
    return Math.min(heightPercent, 150);
  };

  return (
    <View style={styles.container}>
      {/* 카테고리 버튼 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryButtonsScrollView}
        contentContainerStyle={styles.categoryButtonsContainer}
      >
        <TouchableOpacity 
          style={[styles.categoryButton, activeCategory === '칼로리' && styles.categoryButtonActive]}
          onPress={() => onCategoryChange?.('칼로리')}>
          <Image 
            source={IMAGES.icons.fireWhite}
            style={styles.categoryButtonIcon}
          />
          <Text style={[styles.categoryButtonText, activeCategory === '칼로리' && styles.categoryButtonTextActive]}>칼로리(kcal)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.categoryButton, activeCategory === '심박수' && styles.categoryButtonActive]}
          onPress={() => onCategoryChange?.('심박수')}>
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
              `${getTotalValue().toLocaleString()} kcal` : 
             activeCategory === '심박수' ? 
              getTotalValue() > 0 ? `평균 ${getTotalValue()} bpm` : '0 bpm' : '0 bpm'}
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
                  onPeriodChange('일');
                  setShowPeriodSelect(false);
                }}>
                <Text style={styles.periodDropdownText}>일</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.periodDropdownItem}
                onPress={() => {
                  onPeriodChange('주');
                  setShowPeriodSelect(false);
                }}>
                <Text style={styles.periodDropdownText}>주</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.periodDropdownItem}
                onPress={() => {
                  onPeriodChange('월');
                  setShowPeriodSelect(false);
                }}>
                <Text style={styles.periodDropdownText}>월</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.periodDropdownItem}
                onPress={() => {
                  onPeriodChange('연');
                  setShowPeriodSelect(false);
                }}>
                <Text style={styles.periodDropdownText}>연</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* 그래프 */}
      <View style={styles.graphContainer}>
        <View style={styles.graphYAxis}>
          {getYAxisLabels().map((label, index) => (
            <Text key={index} style={styles.graphYLabel}>{label}</Text>
          ))}
        </View>
        <View style={styles.graphContentWrapper}>
          {/* 목표 칼로리 점선 */}
          {goalCalories && goalCalories > 0 && activeCategory === '칼로리' ? (
            <View style={[
              styles.goalLineContainer,
              {
                bottom: (selectedPeriod === '주' || selectedPeriod === '연' ? scale(41) : scale(40)) + scale(calculateGoalLinePosition(goalCalories)),
                width: selectedPeriod === '주' || selectedPeriod === '연' ? scale(265) : undefined,
              }
            ]}>
              <View style={[styles.goalLineDash, { left: '0%' }]} />
              <View style={[styles.goalLineDash, { left: '7%' }]} />
              <View style={[styles.goalLineDash, { left: '14%' }]} />
              <View style={[styles.goalLineDash, { left: '21%' }]} />
              <View style={[styles.goalLineDash, { left: '28%' }]} />
              <View style={[styles.goalLineDash, { left: '35%' }]} />
              <View style={[styles.goalLineDash, { left: '42%' }]} />
              <View style={[styles.goalLineDash, { left: '49%' }]} />
              <View style={[styles.goalLineDash, { left: '56%' }]} />
              <View style={[styles.goalLineDash, { left: '63%' }]} />
              <View style={[styles.goalLineDash, { left: '70%' }]} />
              <View style={[styles.goalLineDash, { left: '77%' }]} />
              <View style={[styles.goalLineDash, { left: '84%' }]} />
              <View style={[styles.goalLineDash, { left: '91%' }]} />
              <View style={[styles.goalLineDash, { left: '98%' }]} />
            </View>
          ) : null}
          {renderGraphContent()}
        </View>
      </View>

      <ExerciseInfoPopup
        visible={showExercisePopup}
        date={selectedDate}
        onClose={() => setShowExercisePopup(false)}
        onExerciseInfoUpdated={refreshExerciseData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#373737',
    borderRadius: scale(15),
    padding: scale(20),
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryButtonsScrollView: {
    flexDirection: 'row',
    marginBottom: scale(20),
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
    resizeMode: 'contain',
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
  graphContentWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingLeft: scale(5),
    paddingRight: scale(5),
    position: 'relative',
    marginRight: scale(10),
  },
  graphContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    height: '100%',
  },
  graphScrollContent: {
    minWidth: '100%',
  },
  graphItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: scale(40),
  },
  barContainer: {
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
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
  goalLineContainer: {
    position: 'absolute',
    left: scale(10),
    right: scale(25),
    height: 2,
    zIndex: 10,
  },
  goalLineDash: {
    position: 'absolute',
    width: '3%',
    height: 2,
    backgroundColor: '#FECB3D',
  },
});

export default ExerciseGraph; 