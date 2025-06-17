import {axiosInstance} from '../config/axiosConfig';

// 공지사항 타입 정의
export interface Notice {
  notices_app_id: number;
  notices_type: string;
  title: string;
  content: string;
  reg_dt: string;
  view_cnt: number;
  // 추가 필드가 있다면 여기에 정의
}

// 공지사항 목록 조회 요청 인터페이스
export interface GetNoticesRequest {
  notices_location?: string;
}

export interface GetNoticesResponse {
  success: boolean;
  message?: string;
  data: Notice[];
}

// 공지사항 목록 조회 API
export const getNoticesAppList = async (params?: GetNoticesRequest): Promise<GetNoticesResponse> => {
  try {
    const response = await axiosInstance.post('/notices-app/getNoticesAppList', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};