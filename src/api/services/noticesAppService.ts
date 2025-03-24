import {axiosInstance} from '../config/axiosConfig';

// 공지사항 타입 정의
export interface Notice {
  notices_app_id: number;
  title: string;
  content: string;
  reg_dt: string;
  view_cnt: number;
  // 추가 필드가 있다면 여기에 정의
}

export interface GetNoticesResponse {
  success: boolean;
  message?: string;
  data: Notice[];
}

// 공지사항 목록 조회 API
export const getNoticesAppList = async (): Promise<GetNoticesResponse> => {
  try {
    const response = await axiosInstance.post('/notices-app/getNoticesAppList');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};