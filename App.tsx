/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler';
import React, {useEffect, useRef, useState} from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native';
import {Provider} from 'react-redux';
import store from './src/store';
import AuthStackNavigator from './src/navigation/AuthStackNavigator';
import SplashScreen from 'react-native-splash-screen';
import {setNavigationRef} from './src/utils/navigationUtils';
import { setSessionExpiredHandler } from './src/api/config/axiosConfig';
import CommonPopup from './src/components/CommonPopup';

const App = () => {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  // 세션 만료 팝업 상태
  const [sessionPopup, setSessionPopup] = useState({
    visible: false,
    message: '',
    callback: () => {}
  });
  
  // 현재 활성화된 화면 상태
  const [currentRoute, setCurrentRoute] = useState('');

  useEffect(() => {
    // SplashScreen.hide();

    // 세션 만료 핸들러 설정
    setSessionExpiredHandler((message, callback) => {
      setSessionPopup({
        visible: true,
        message,
        callback
      });
    });
  }, []);

  // 세션 만료 팝업 처리
  const handleSessionExpiredConfirm = () => {
    setSessionPopup(prev => ({
      ...prev,
      visible: false
    }));
    sessionPopup.callback();
  };
  
  // 쇼핑 관련 화면인지 확인하는 함수
  const isShoppingScreen = (routeName: string) => {
    return routeName.includes('Shopping') || routeName == 'Attendance';
  };
  
  // 네비게이션 상태 변경 감지 핸들러
  const handleNavigationStateChange = (state: any) => {
    if (state) {
      // 상태 트리에서 현재 활성화된 경로 찾기
      const findCurrentRoute = (routes: any[], index: number): string => {
        const currentRoute = routes[index];
        if (currentRoute.state) {
          return findCurrentRoute(
            currentRoute.state.routes,
            currentRoute.state.index
          );
        }
        return currentRoute.name;
      };
      
      const routeName = findCurrentRoute(state.routes, state.index);
      setCurrentRoute(routeName);
    }
  };

  // 현재 화면에 따른 배경색 결정
  const backgroundColor = isShoppingScreen(currentRoute) ? '#FFFFFF' : '#202020';

  return (
    <View style={{flex: 1, backgroundColor}}>
      <Provider store={store}>
        <GestureHandlerRootView>
          <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
              <NavigationContainer
                ref={navigationRef}
                onStateChange={handleNavigationStateChange}
                onReady={() => {
                  setNavigationRef(navigationRef.current);
                }}>
                <AuthStackNavigator />
              </NavigationContainer>

              {/* 세션 만료 팝업 */}
              <CommonPopup
                visible={sessionPopup.visible}
                message={sessionPopup.message}
                type="warning"
                onConfirm={handleSessionExpiredConfirm}
                confirmText="확인"
              />
            </SafeAreaView>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </Provider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
