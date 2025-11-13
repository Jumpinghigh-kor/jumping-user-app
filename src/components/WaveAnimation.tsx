import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing, Image, StyleSheet } from 'react-native';
import { scale } from '../utils/responsive';
import IMAGES from '../utils/images';

const WaveAnimation: React.FC = () => {
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
    <View style={styles.container}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    height: scale(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
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

export default WaveAnimation; 