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
      
      if (response.data.success && response.data.data?.access_token) {
        await AsyncStorage.setItem('access_token', response.data.data.access_token);
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
      await AsyncStorage.removeItem('access_token');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('로그아웃 중 오류가 발생했습니다.');
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