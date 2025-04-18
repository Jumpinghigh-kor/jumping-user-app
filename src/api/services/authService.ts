import { axiosInstance } from '../config/axiosConfig';
import { LoginRequest, LoginResponse } from '../types/auth.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';

interface ErrorResponse {
  success: boolean;
  message: string;
}

interface LoginCredentials {
  mem_email_id: string;
  mem_app_password: string;
}

interface RefreshTokenResponse {
  success: boolean;
  data?: {
    access_token: string;
  };
  message?: string;
}

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<LoginResponse>('/auth/login', credentials);
      
      if (response.data.success && response.data.data) {
        const { access_token, refresh_token } = response.data.data;
        
        // 액세스 토큰 저장
        if (access_token) {
          await AsyncStorage.setItem('access_token', access_token);
        }
        
        // 리프레시 토큰 저장
        if (refresh_token) {
          await AsyncStorage.setItem('refresh_token', refresh_token);
        }
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        // 서버 응답이 있는 경우 그대로 전달
        return error.response.data as LoginResponse;
      }
      // 네트워크 에러 등의 경우
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // 리프레시 토큰 가져오기
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      // 서버에 로그아웃 요청 (선택적)
      if (refreshToken) {
        try {
          await axiosInstance.post('/auth/logout', { refresh_token: refreshToken });
        } catch (error) {
          console.log('Logout API error:', error);
          // API 오류가 있어도 로컬 로그아웃은 진행
        }
      }
      
      // 로컬 토큰 삭제
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
    } catch (error) {
      throw new Error('로그아웃 중 오류가 발생했습니다.');
    }
  }

  async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        return {
          success: false,
          message: '리프레시 토큰이 없습니다.'
        };
      }
      
      console.log('Manual refresh token call with:', refreshToken.substring(0, 10) + '...');
      
      // 요청 형식을 서버 API와 일치시킴 - refresh_token 키 사용
      const response = await axiosInstance.post<RefreshTokenResponse>('auth/refresh-token', {
        refresh_token: refreshToken  // 서버에서 기대하는 키 이름으로 수정
      });
      
      console.log('Manual refresh response:', response.data);
      
      if (response.data.success && response.data.data?.access_token) {
        const newToken = response.data.data.access_token;
        console.log('New access token saved:', newToken.substring(0, 10) + '...');
        await AsyncStorage.setItem('access_token', newToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Manual refresh token error:', 
        axios.isAxiosError(error) ? error.response?.data : error
      );
      
      if (axios.isAxiosError(error) && error.response?.data) {
        return error.response.data as RefreshTokenResponse;
      }
      
      return {
        success: false,
        message: '토큰 갱신 중 오류가 발생했습니다.'
      };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return !!token;
    } catch (error) {
      return false;
    }
  }
}

export default AuthService.getInstance(); 