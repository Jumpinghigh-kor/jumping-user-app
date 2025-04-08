import {axiosInstance} from '../config/axiosConfig';

// 배너 타입 정의
export interface Banner {
  banner_app_id: number;
  banner_img_url: string;
  banner_link_url: string;
  banner_title: string;
  banner_order: number;
  use_yn: string;
  reg_dt: string;
  file_path?: string;
  file_name?: string;
  // 추가 필드가 있다면 여기에 정의
}

export interface GetBannerResponse {
  success: boolean;
  message?: string;
  data: Banner[];
}

// 배너 상세 조회 API
export const getBannerAppDetail = async (params: any): Promise<GetBannerResponse> => {
  try {
    const response = await axiosInstance.post(`/banner-app/selectBannerAppInfo`, params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 