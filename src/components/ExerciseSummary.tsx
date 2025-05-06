import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
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
  // 파동 애니메이션 값
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;

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
              <Text style={styles.exerciseSummaryValue}>{data.averageHeartRate}</Text>
              <Text style={{fontSize: scale(16), color: '#FFFFFF'}}> Bpm</Text>
            </View>
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
  pulseCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
  },
  hearWhite: {
    width: scale(35),
    height: scale(35),
    tintColor: '#FFFFFF',
    resizeMode: 'contain',
  },
});

export default ExerciseSummary; 