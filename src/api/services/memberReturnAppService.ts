import {axiosInstance} from '../config/axiosConfig';

// 리뷰 타입 정의
export interface Return {
  product_app_id: number;
  return_app_id: number;
  order_app_id: number;
  mem_id: number;
  return_type: string;
  return_status: string;
  reason: string;
  admin_reason: string;
  admin_yn: string;
  cancel_yn: string;
  customer_tracking_number: string;
  company_tracking_number: string;
  customer_courier_code: string;
  company_courier_code: string;
  reg_dt: string;
  brand_name: string;
  product_name: string;
  option_unit: string;
  quantity: number;
  payment_amount: number;
  option_amount: number;
}

// 리뷰 등록 요청 인터페이스
export interface InsertMemberReturnRequest {
  order_detail_app_id: number;
  order_address_id: number;
  mem_id: number;
  return_reason_type: string;
  reason: string;
  quantity: number;
}

// 리뷰 등록/수정 응답 인터페이스
export interface MemberReturnResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// 리뷰 목록 조회 응답 인터페이스
export interface GetReturnsResponse {
  success: boolean;
  message?: string;
  data: Return[];
}

// 회원 반품/교환 목록 조회 API
export const getMemberReturnAppList = async (params?: { mem_id?: number, order_detail_app_id?: number, type?: string, search_title?: string, year?: string }): Promise<GetReturnsResponse> => {
  try {
    const response = await axiosInstance.post('/member-return-app/getMemberReturnAppList', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 반품/교환 목록 조회 API
export const getMemberReturnAppDetail = async (params?: { return_app_id?: number }): Promise<GetReturnsResponse> => {
  try {
    const response = await axiosInstance.post('/member-return-app/getMemberReturnAppDetail', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 반품/교환 등록 API
export const insertMemberReturnApp = async (params: InsertMemberReturnRequest): Promise<MemberReturnResponse> => {
  try {
    const response = await axiosInstance.post('/member-return-app/insertMemberReturnApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 반품/교환 삭제 API
export const deleteMemberReturnApp = async (params: { 
  return_app_id: number;
  mem_id: number;
}): Promise<MemberReturnResponse> => {
  try {
    const response = await axiosInstance.post('/member-return-app/deleteMemberReturnApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 반품/취소 접수 취소 API
export const updateMemberReturnAppCancelYn = async (params: {
  order_detail_app_ids: number[];
  mem_id: number;
  cancel_yn: string;
}): Promise<MemberReturnResponse> => {
  try {
    const response = await axiosInstance.post('/member-return-app/updateMemberReturnAppCancelYn', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 반품/교환 업데이트 API (취소접수 상태 해제 등)
export const updateMemberReturnApp = async (params: {
  order_detail_app_ids: number[];
  mem_id: number;
  quantity: number;
  cancel_yn: string;
  return_reason_type: string;
  reason: string;
}): Promise<MemberReturnResponse> => {
  try {
    const response = await axiosInstance.post('/member-return-app/updateMemberReturnApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 반품/교환 주문주소ID 업데이트 API
export const updateMemberReturnAppOrderAddressId = async (params: {
  order_detail_app_id: number;
  order_address_id: number;
  mem_id: number;
}): Promise<MemberReturnResponse> => {
  try {
    const response = await axiosInstance.post('/member-return-app/updateMemberReturnAppOrderAddressId', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};