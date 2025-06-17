import messaging from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updatePushToken } from './membersService';

export interface PushNotificationData {
  title?: string;
  body?: string;
  data?: {[key: string]: any};
}

class PushNotificationService {
  private fcmToken: string | null = null;

  /**
   * 푸시 알림 권한 요청
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        console.log('iOS 푸시 알림 권한 요청 시작');
        
        const authStatus = await messaging().requestPermission();
        console.log('iOS 권한 상태:', authStatus);
        
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        console.log('iOS 권한 허용 여부:', enabled);

        if (!enabled) {
          console.log('iOS 권한이 거부되었습니다');
          Alert.alert(
            '알림 권한 필요',
            '푸시 알림을 받으려면 설정에서 알림 권한을 허용해주세요.',
            [
              {text: '취소', style: 'cancel'},
              {text: '설정으로 이동', onPress: () => {
                // 설정으로 이동하는 로직 필요시 추가
              }}
            ]
          );
        }

        return enabled;
      } else {
        // Android의 경우 자동으로 권한이 부여됨 (targetSdkVersion 33 미만)
        // Android 13+ (API 33+)의 경우 별도 권한 요청 필요
        if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      }
    } catch (error) {
      console.error('푸시 알림 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * FCM 토큰 가져오기
   */
  async getFCMToken(): Promise<string | null> {
    try {
      // 권한 확인
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        console.log('푸시 알림 권한이 없습니다.');
        return null;
      }

      // 토큰 가져오기
      const token = await messaging().getToken();
      
      if (token) {
        this.fcmToken = token;
        // 토큰을 로컬 저장소에 저장
        await AsyncStorage.setItem('@fcm_token', token);
        console.log('FCM Token:', token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('FCM 토큰 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * 저장된 FCM 토큰 가져오기
   */
  async getStoredFCMToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('@fcm_token');
      return token;
    } catch (error) {
      console.error('저장된 FCM 토큰 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * 푸시 알림 권한 상태 확인
   */
  async checkPermission(): Promise<boolean> {
    try {
      console.log('권한 상태 확인 시작');
      
      const authStatus = await messaging().hasPermission();
      console.log('현재 권한 상태:', authStatus);
      
      const hasPermission = (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
      
      console.log('권한 있음:', hasPermission);
      return hasPermission;
    } catch (error) {
      console.error('푸시 알림 권한 확인 실패:', error);
      return false;
    }
  }

  /**
   * 포그라운드 메시지 리스너 설정
   */
  setupForegroundMessageHandler(callback: (message: PushNotificationData) => void) {
    return messaging().onMessage(async remoteMessage => {
      console.log('포그라운드에서 메시지 수신:', remoteMessage);
      
      const notificationData: PushNotificationData = {
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
      };

      callback(notificationData);
    });
  }

  /**
   * 백그라운드 메시지 핸들러 설정 (App.tsx에서 호출)
   */
  static setupBackgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('백그라운드에서 메시지 수신:', remoteMessage);
      
      // 백그라운드에서 처리할 로직 추가
      // 예: 로컬 데이터 업데이트, 로그 저장 등
    });
  }

  /**
   * 앱이 종료된 상태에서 푸시 알림을 통해 열린 경우 처리
   */
  async getInitialNotification(): Promise<PushNotificationData | null> {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      
      if (remoteMessage) {
        console.log('앱이 종료된 상태에서 알림으로 열림:', remoteMessage);
        
        return {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        };
      }
      
      return null;
    } catch (error) {
      console.error('초기 알림 정보 가져오기 실패:', error);
      return null;
    }
  }

  /**
   * 백그라운드/종료 상태에서 알림 클릭 이벤트 처리
   */
  setupNotificationOpenedHandler(callback: (message: PushNotificationData) => void) {
    return messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('백그라운드 상태에서 알림 클릭:', remoteMessage);
      
      const notificationData: PushNotificationData = {
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
      };

      callback(notificationData);
    });
  }

  /**
   * 토큰 갱신 리스너 설정
   */
  setupTokenRefreshHandler(callback: (token: string) => void) {
    return messaging().onTokenRefresh(token => {
      console.log('FCM 토큰 갱신:', token);
      this.fcmToken = token;
      
      // 토큰을 로컬 저장소에 업데이트
      AsyncStorage.setItem('@fcm_token', token);
      
      callback(token);
    });
  }

  /**
   * 푸시 알림 초기화 (앱 시작 시 호출)
   */
  async initialize(userId?: string): Promise<string | null> {
    try {
      // 1. 권한 요청
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return null;
      }

      // 2. FCM 토큰 가져오기
      const token = await this.getFCMToken();
      if (!token) {
        return null;
      }

      return token;
    } catch (error) {
      console.error('푸시 알림 초기화 실패:', error);
      return null;
    }
  }

  /**
   * 푸시 알림 구독 해제
   */
  async unsubscribe(): Promise<boolean> {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem('@fcm_token');
      this.fcmToken = null;
      
      console.log('푸시 알림 구독 해제 완료');
      return true;
    } catch (error) {
      console.error('푸시 알림 구독 해제 실패:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
export const pushNotificationService = new PushNotificationService();
export { PushNotificationService };
export default pushNotificationService; 