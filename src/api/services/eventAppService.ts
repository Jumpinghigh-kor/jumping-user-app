import {axiosInstance} from '../config/axiosConfig';

// 이벤트 타입 정의
export interface Event {
  event_app_id: number;
  title?: string;
  use_yn?: string;
  reg_dt?: string;
}

export interface GetEventListResponse {
  success: boolean;
  message?: string;
  data: Event[];
}

// 특정 이벤트 조회 API
export const getEventAppList = async (params: { event_app_id: number }): Promise<GetEventListResponse> => {
  try {
    const response = await axiosInstance.post(`/event-app/getEventAppList`, params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 