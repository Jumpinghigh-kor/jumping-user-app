import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';
import WaveAnimation from './WaveAnimation';
import { commonStyle } from '../styles/common';

interface ExerciseSummaryProps {
  data: {
    totalCalories: number;
    totalJumpingCalories: number;
    totalOtherCalories: number;
    averageHeartRate: number;
    averageRestTime: number;
    averageSleepTime: number;
  };
  title?: string;
}

const ExerciseSummary: React.FC<ExerciseSummaryProps> = ({ 
  data,
  title = '누적 운동량'
}) => {
  // 시간 포맷팅 함수
  const formatTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0 && minutes === 0) return "0분";
    if (hours === 0) return `${minutes}분`;
    if (minutes === 0) return `${hours}시간`;
    return `${hours}시간 ${minutes}분`;
  };

  return (
    <View style={styles.contentSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              {/* 파동 애니메이션 */}
              <WaveAnimation />
            </View>
            <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
              <Text style={styles.exerciseSummaryValue}>{data.averageHeartRate}</Text>
              <Text style={{fontSize: scale(16), color: '#FFFFFF'}}> Bpm</Text>
            </View>
          </View>
        </View>
        
        {/* 오른쪽 컨테이너 */}
        <View style={styles.exerciseSummaryRightContainer}>
          {/* 평균 필요 휴식시간 */}
          <View style={styles.exerciseSummaryBoxSmall}>
            <View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={styles.iconCircle}>
                <Image 
                    source={IMAGES.icons.plusGreen}
                  style={styles.exerciseSummaryIcon}
                />
                </View>
                <Text style={styles.exerciseSummaryTitle}>평균 필요 휴식시간</Text>
              </View>
              <Text style={styles.exerciseSummaryValue}>{formatTime(data.averageRestTime)}</Text>
            </View>
          </View>
          
          {/* 평균 필요 수면시간 */}
          <View style={styles.exerciseSummaryBoxSmall}>
            <View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={styles.iconCircle}>
                <Image 
                    source={IMAGES.icons.moonYellow}
                  style={styles.exerciseSummaryIcon}
                />
                </View>
                <Text style={styles.exerciseSummaryTitle}>평균 필요 수면시간</Text>
              </View>
              <Text style={styles.exerciseSummaryValue}>{formatTime(data.averageSleepTime)}</Text>
            </View>
          </View>
          
        </View>
      </View>

      {/* 총 소모 칼로리 */}
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
              <Text style={[{fontSize: scale(18), color: '#FFFFFF'}]}>{data.totalCalories.toLocaleString()}</Text>
              <Text style={{fontSize: scale(18), color: '#848484'}}> Kcal</Text>
            </View>
          </View>
          <View style={{flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-evenly', paddingHorizontal: scale(40)}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
              <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: scale(20)}}>
                <Image source={IMAGES.icons.trampolineWhite} style={{width: scale(40), height: scale(40), resizeMode: 'contain'}} />
                <Text style={[commonStyle.mv10, {fontSize: scale(12), color: '#FFFFFF'}]}>점핑 소모칼로리</Text>
                <Text style={{fontSize: scale(16), color: '#FFFFFF'}}>{data.totalJumpingCalories.toLocaleString()} <Text style={{fontSize: scale(16), color: '#848484'}}>Kcal</Text></Text>
              </View>
              <View style={{flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: scale(20)}}>
                <Image source={IMAGES.icons.runWhite} style={{width: scale(40), height: scale(40), resizeMode: 'contain'}} />
                <Text style={[commonStyle.mv10, {fontSize: scale(12), color: '#FFFFFF'}]}>기타 소모칼로리</Text>
                <Text style={{fontSize: scale(16), color: '#FFFFFF'}}>{data.totalOtherCalories.toLocaleString()} <Text style={{fontSize: scale(16), color: '#848484'}}>Kcal</Text></Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentSection: {
    marginBottom: scale(24),
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontWeight: 'bold',
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
});

export default ExerciseSummary; 