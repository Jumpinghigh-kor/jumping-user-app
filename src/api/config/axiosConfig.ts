import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 테스트용 서버 IP
const SERVER_IP = 'http://192.168.0.173:3000/'; // 실제 서버 IP

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
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('access_token');
      } catch (e) {
        console.error('Error removing token:', e);
      }
    }
    return Promise.reject(error);
  }
);

export {instance as axiosInstance}; 