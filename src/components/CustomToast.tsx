import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { scale } from '../utils/responsive';

const { width: screenWidth } = Dimensions.get('window');

interface CustomToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onHide?: () => void;
  position?: 'top' | 'center' | 'bottom';
}

const CustomToast: React.FC<CustomToastProps> = ({
  visible,
  message,
  duration = 2000,
  onHide,
  position = 'top'
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // 토스트 나타나기
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 지정된 시간 후 토스트 사라지기
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onHide) {
            onHide();
          }
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, fadeAnim, translateY, onHide]);

  if (!visible) {
    return null;
  }

  return (
    <View style={[
      styles.container,
      position === 'center' 
        ? { top: '50%', transform: [{ translateY: -25 }] }
        : position === 'bottom'
        ? { bottom: scale(100) }
        : { top: scale(50) }
    ]}>
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    pointerEvents: 'none',
  },
  toast: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
    borderRadius: scale(25),
    maxWidth: screenWidth * 0.8,
  },
  message: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
  },
});

export default CustomToast; 