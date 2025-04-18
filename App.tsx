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
import {StyleSheet, Text, TextInput} from 'react-native';
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

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <NavigationContainer
            ref={navigationRef}
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
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
