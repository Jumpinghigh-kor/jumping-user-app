import { axiosInstance } from '../config/axiosConfig';

// 문의사항 타입 정의
export interface InquiryShoppingApp {
  inquiry_shopping_app_id: number;
  content: string;
  reg_dt: string;
  del_yn: string;
}

// 쇼핑 문의 조회 API
export const getInquiryShoppingAppList = async (inquiryShoppingAppData: any) => {
  try {
    const response = await axiosInstance.post('/inquiry-shopping-app/getInquiryShoppingAppList', inquiryShoppingAppData);
    return response.data;
  } catch (error) {
    console.error('쇼핑 문의 조회 실패:', error);
    throw error;
  }
};

// 쇼핑 문의 등록 API
export interface InsertInquiryShoppingAppRequest {
  product_app_id: number;
  content: string;
  mem_id: number;
}

export interface InsertInquiryShoppingAppResponse {
  success: boolean;
  message?: string;
}

export const insertInquiryShoppingApp = async (params: InsertInquiryShoppingAppRequest): Promise<InsertInquiryShoppingAppResponse> => {
  try {
    const response = await axiosInstance.post('/inquiry-shopping-app/insertInquiryShoppingApp', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 문의사항 수정 API
export interface UpdateInquiryShoppingAppRequest {
  content: string;
  mem_id: number;
  inquiry_shopping_app_id: number;
}

export interface UpdateInquiryShoppingAppResponse {
  success: boolean;
  message?: string;
}

export const updateInquiryShoppingApp = async (params: UpdateInquiryShoppingAppRequest): Promise<UpdateInquiryShoppingAppResponse> => {
  try {
    const response = await axiosInstance.post('/inquiry-shopping-app/updateInquiryShoppingApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 

// 문의사항 삭제 API
export interface DeleteInquiryShoppingAppRequest {
  inquiry_shopping_app_id: number;
  mem_id: number;
}

export interface DeleteInquiryShoppingAppResponse {
  success: boolean;
  message?: string;
}

export const deleteInquiryShoppingApp = async (params: DeleteInquiryShoppingAppRequest): Promise<DeleteInquiryShoppingAppResponse> => {
  try {
    const response = await axiosInstance.post('/inquiry-shopping-app/deleteInquiryShoppingApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 