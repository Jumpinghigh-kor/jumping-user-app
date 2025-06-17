import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  InteractionManager,
  Animated,
  Image,
  ImageBackground,
  Easing,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/AuthStackNavigator';
import IMAGES from '../utils/images';
import CommonHeader from '../components/CommonHeader';
import { useAppSelector } from '../store/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scale } from '../utils/responsive';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const RedirectScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const memberInfo = useAppSelector(state => state.member.memberInfo);

  // 애니메이션 값들
  const fadeAnim1 = React.useRef(new Animated.Value(0)).current;
  const fadeAnim2 = React.useRef(new Animated.Value(0)).current;
  const bounceAnim = React.useRef(new Animated.Value(-300)).current; // 이미지 시작 위치 (화면 위쪽)
  const imageOpacity = React.useRef(new Animated.Value(0)).current; // 이미지 투명도

  // 화면이 포커스될 때 하단탭 숨기기
  useFocusEffect(
    React.useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });

      // 애니메이션 값 초기화
      fadeAnim1.setValue(0);
      fadeAnim2.setValue(0);
      bounceAnim.setValue(-300);
      imageOpacity.setValue(0);

      // 애니메이션 시작
      Animated.sequence([
        // 시작 전 지연
        Animated.delay(800),
        // 첫 번째 텍스트 애니메이션과 동시에 이미지 바운스 시작
        Animated.parallel([
          Animated.sequence([
            Animated.delay(1500),
            Animated.timing(fadeAnim1, {
              toValue: 1,
              duration: 1500,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          // 바운스 애니메이션 (위에서 떨어져서 튀기기)
          Animated.parallel([
            Animated.sequence([
              // 첫 번째 바운스 (큰 바운스) - 중력 효과
              Animated.timing(bounceAnim, {
                toValue: 0,
                duration: 1000,
                easing: Easing.bounce,
                useNativeDriver: true,
              }),
            ]),
            // 이미지 서서히 나타나기
            Animated.timing(imageOpacity, {
              toValue: 1,
              duration: 1000,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
        // 첫 번째 완료 후 두 번째 텍스트 애니메이션
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // 렌더링 완료 후 쇼핑 화면으로 이동
      const interaction = InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          navigation.navigate('MainTab', { screen: 'Shopping' });
        }, 4500);
      });

      // cleanup: 화면을 벗어날 때 하단탭 다시 보이기
      return () => {
        interaction.cancel();
        navigation.getParent()?.setOptions({
          tabBarStyle: undefined
        });
      };
    }, [navigation])
  );

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.container}>
          <Image source={IMAGES.onboarding.backgroundGreen} style={styles.backgroundImage} />
          <Animated.View style={[
            {
              opacity: fadeAnim1,
            }
          ]}>
            <Text style={styles.text}>건강한 모든것을</Text>
          </Animated.View>
          
          <Animated.View style={[
            {
              opacity: fadeAnim2,
            }
          ]}>
            <Text style={[styles.text, {marginTop: scale(8)}]}>점핑하이와 즐기세요!</Text>
          </Animated.View>
          <View style={styles.imageContainer}>
            <Animated.View style={[
              {
                transform: [{ translateY: bounceAnim }],
                opacity: imageOpacity
              }
            ]}>
              <Image source={IMAGES.onboarding.person} style={styles.image} />
            </Animated.View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    height: '80%',
  },
  backgroundImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    resizeMode: 'cover',
    width: '100%',
    height: '120%',
  },
  text: {
    fontSize: scale(20),
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: scale(20),
  },
  image: {
    width: scale(250),
    height: scale(250),
    resizeMode: 'contain',
  },
});

export default RedirectScreen;
