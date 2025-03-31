import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';

interface ExerciseSummaryProps {
  data: {
    totalCalories: number;
    totalDistance: number;
    averageHeartRate: number;
  };
  title?: string;
}

const ExerciseSummary: React.FC<ExerciseSummaryProps> = ({ 
  data,
  title = '누적 운동량'
}) => {
  return (
    <View style={styles.contentSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.exerciseSummaryContainer}>
        {/* 왼쪽 박스 */}
        <View style={styles.exerciseSummaryBox}>
          <View>
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
            <Text style={styles.exerciseSummaryValue}>{data.averageHeartRate} bpm</Text>
          </View>
        </View>
        
        {/* 오른쪽 컨테이너 */}
        <View style={styles.exerciseSummaryRightContainer}>
          {/* 오른쪽 위 박스 */}
          <View style={styles.exerciseSummaryBoxSmall}>
            <View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={styles.iconCircle}>
                <Image 
                    source={IMAGES.icons.fireWhite}
                  style={styles.exerciseSummaryIcon}
                />
                </View>
                <Text style={styles.exerciseSummaryTitle}>총 소모 칼로리</Text>
              </View>
              <Text style={styles.exerciseSummaryValue}>{data.totalCalories.toLocaleString()} kcal</Text>
            </View>
          </View>
          
          {/* 오른쪽 아래 박스 */}
          <View style={styles.exerciseSummaryBoxSmall}>
            <View>
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
              <Text style={styles.exerciseSummaryValue}>{data.totalDistance.toFixed(1)} km</Text>
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
    minHeight: scale(200),
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
  exerciseSummaryIcon: {
    width: scale(10),
    height: scale(10),
    tintColor: '#FFFFFF',
  },
  exerciseSummaryRightContainer: {
    width: '48%', 
    height: scale(195),
    justifyContent: 'space-between',
  },
  exerciseSummaryBoxSmall: {
    backgroundColor: '#444444',
    borderRadius: scale(15),
    padding: scale(10),
    justifyContent: 'space-between',
    flexDirection: 'row',
    height: '48%',
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
});

export default ExerciseSummary; 