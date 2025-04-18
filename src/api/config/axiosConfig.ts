import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { navigateToLogin } from '../../utils/navigationUtils';

// 세션 만료 팝업 표시 상태
let isSessionExpiredPopupShown = false;

// 세션 만료 알림 콜백 함수
let sessionExpiredCallback: ((message: string, callback: () => void) => void) | null = null;

// 세션 만료 알림 핸들러 설정
export const setSessionExpiredHandler = (
  handler: (message: string, callback: () => void) => void
) => {
  sessionExpiredCallback = handler;
};

// 테스트용 서버 IP
const SERVER_IP = 'http://192.168.0.173:3000/'; 
//const SERVER_IP = ''; // 실제 서버 IP

const BASE_URL = SERVER_IP;

console.log('Using API URL:', BASE_URL); // URL 확인용 로그

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 토큰 리프레시 중인지 확인하는 변수
let isRefreshing = false;
// 리프레시 토큰 요청 대기 중인 요청들을 저장하는 배열
let refreshSubscribers: ((token: string) => void)[] = [];
// 리프레시 실패 횟수를 추적하는 변수
let refreshFailCount = 0;
// 최대 리프레시 시도 횟수
const MAX_REFRESH_ATTEMPTS = 1;

// 리프레시 토큰을 사용하여 새 액세스 토큰을 요청하는 함수
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      console.log('No refresh token available');
      return null;
    }
    
    console.log('Attempting to refresh token with:', refreshToken.substring(0, 10) + '...');
    
    // BASE_URL 끝에 슬래시가 있으므로 슬래시로 시작하는 경로를 사용하면 중복됨
    // 올바른 URL 형식으로 수정
    const refreshUrl = BASE_URL.endsWith('/') 
      ? `${BASE_URL}auth/refresh-token` 
      : `${BASE_URL}/auth/refresh-token`;
    
    console.log('Refresh token URL:', refreshUrl);
    
    // 서버 요구사항에 맞게 refresh_token 키 사용
    const response = await axios.post(refreshUrl, { 
      refresh_token: refreshToken 
    });
    
    console.log('Refresh token response:', response.data);
    
    if (response.data.success && response.data.data && response.data.data.access_token) {
      const newAccessToken = response.data.data.access_token;
      console.log('New access token acquired:', newAccessToken.substring(0, 10) + '...');
      await AsyncStorage.setItem('access_token', newAccessToken);
      
      // 리프레시 성공했으므로 실패 카운트 초기화
      refreshFailCount = 0;
      
      return newAccessToken;
    } else {
      console.log('Refresh response did not contain a valid token:', response.data);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Token refresh network error:', 
        error.response?.status, 
        error.response?.data || error.message
      );
    } else {
      console.error('Token refresh error:', error);
    }
    return null;
  }
};

// 토큰 갱신 후 대기 중인 요청들을 처리하는 함수
const onRefreshed = (token: string) => {
  console.log('Executing queued requests with new token');
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// 요청이 대기열에 추가되도록 하는 함수
const addSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// 로그아웃 처리 함수
const handleLogout = async () => {
  console.log('Logging out due to token refresh failure');
  
  // 세션 만료 알림이 이미 표시된 경우 중복 표시하지 않음
  if (isSessionExpiredPopupShown) return;
  
  // 토큰 제거
  await AsyncStorage.removeItem('access_token');
  await AsyncStorage.removeItem('refresh_token');
  
  if (sessionExpiredCallback) {
    // 세션 만료 알림 표시
    isSessionExpiredPopupShown = true;
    sessionExpiredCallback('세션이 만료되었습니다.\n로그인이 필요합니다.', () => {
      isSessionExpiredPopupShown = false;
      navigateToLogin();
    });
  } else {
    // 콜백이 없는 경우 바로 로그인 화면으로 이동
    navigateToLogin();
  }
};

// Request interceptor
instance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log('Response error:', error.response?.status, error.config?.url);
    
    // 401 에러이고 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Handling 401 error for:', originalRequest.url);
      
      if (isRefreshing) {
        // 토큰 리프레시 중인 경우, 요청을 대기열에 추가
        console.log('Token refresh in progress, adding request to queue');
        try {
          const newToken = await new Promise<string>((resolve, reject) => {
            addSubscriber((token: string) => {
              resolve(token);
            });
            
            // 대기 시간이 너무 길면 reject (30초 타임아웃)
            setTimeout(() => {
              reject(new Error('Token refresh timeout'));
            }, 30000);
          });
          
          // 새 토큰으로 원래 요청 재시도
          console.log('Retrying request with new token');
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (error) {
          console.error('Error waiting for token refresh:', error);
          return Promise.reject(error);
        }
      }
      
      // 토큰 리프레시 시작
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // 리프레시 성공
          console.log('Token refresh successful, retrying original request');
          isRefreshing = false;
          onRefreshed(newToken);
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } else {
          // 리프레시 실패, 다시 시도
          refreshFailCount++;
          
          if (refreshFailCount < MAX_REFRESH_ATTEMPTS) {
            console.log(`Token refresh failed, attempt ${refreshFailCount}/${MAX_REFRESH_ATTEMPTS}`);
            isRefreshing = false;
            // 1초에서 0.3초로 줄여 대기 시간 감소
            await new Promise(resolve => setTimeout(resolve, 300));
            return instance(originalRequest);
          } else {
            // 최대 시도 횟수 초과, 로그아웃 처리
            console.log('Max refresh attempts reached, logging out');
            isRefreshing = false;
            refreshFailCount = 0;
            await handleLogout();
            return Promise.reject(error);
          }
        }
      } catch (refreshError) {
        console.error('Exception during token refresh:', refreshError);
        isRefreshing = false;
        refreshFailCount++;
        
        if (refreshFailCount < MAX_REFRESH_ATTEMPTS) {
          console.log(`Token refresh exception, attempt ${refreshFailCount}/${MAX_REFRESH_ATTEMPTS}`);
          // 1초에서 0.3초로 줄여 대기 시간 감소
          await new Promise(resolve => setTimeout(resolve, 300));
          return instance(originalRequest);
        } else {
          console.log('Max refresh attempts reached after exception, logging out');
          refreshFailCount = 0;
          await handleLogout();
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export {instance as axiosInstance}; 