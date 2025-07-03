import {axiosInstance} from '../config/axiosConfig';
import { Notice } from './noticesAppService';

// 공지사항 타입 정의
export interface NoticeShoppingApp {
  notices_shopping_app_id: number;
  notices_type: string;
  title: string;
  content: string;
  reg_dt: string;
  view_cnt: number;
  // 추가 필드가 있다면 여기에 정의
}

// 공지사항 목록 조회 요청 인터페이스
export interface GetNoticesShoppingAppRequest {
  notices_type?: string;
}

export interface GetNoticesShoppingAppResponse {
  success: boolean;
  message?: string;
  data: NoticeShoppingApp[];
}

// 공지사항 목록 조회 API
export const getNoticesShoppingAppList = async (params?: GetNoticesShoppingAppRequest): Promise<GetNoticesShoppingAppResponse> => {
  try {
    const response = await axiosInstance.post('/notices-shopping-app/getNoticesShoppingAppList', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};