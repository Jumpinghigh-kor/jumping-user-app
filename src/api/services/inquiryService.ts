import {axiosInstance} from '../config/axiosConfig';

// 문의사항 타입 정의
export interface Inquiry {
  inquiry_app_id: number;
  title: string;
  content: string;
  answer?: string;
  answer_dt?: string;
  reg_dt: string;
  del_yn: string;
  // 추가 필드가 있다면 여기에 정의
}

export interface GetInquiryResponse {
  success: boolean;
  message?: string;
  data: Inquiry[];
}

// 문의사항 목록 조회 API
export const getInquiryList = async (): Promise<GetInquiryResponse> => {
  try {
    const response = await axiosInstance.post('/inquiry-app/getInquiryAppList');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 문의사항 작성 API
export interface CreateInquiryRequest {
  title: string;
  content: string;
  mem_id: number;
}

export interface CreateInquiryResponse {
  success: boolean;
  message?: string;
}

export const createInquiry = async (params: CreateInquiryRequest): Promise<CreateInquiryResponse> => {
  try {
    const response = await axiosInstance.post('/inquiry-app/insertInquiryApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 문의사항 수정 API
export interface UpdateInquiryRequest {
  title: string;
  content: string;
  mem_id: number;
  inquiry_app_id: number;
}

export interface UpdateInquiryResponse {
  success: boolean;
  message?: string;
}

export const updateInquiry = async (params: UpdateInquiryRequest): Promise<UpdateInquiryResponse> => {
  try {
    const response = await axiosInstance.post('/inquiry-app/updateInquiryApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 