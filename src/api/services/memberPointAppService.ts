import {axiosInstance} from '../config/axiosConfig';

// 포인트 정보 타입 정의
export interface MemberPointApp {
  point_status: string;
  point_amount: number;
  product_name: string;
  brand_name: string;
  option_unit: string;
  option_amount: number;
  option_gender: string;
  order_quantity: number;
  reg_dt: string;
}

// 포인트 목록 조회 요청 인터페이스
export interface GetMemberPointAppRequest {
  mem_id: number | string;
  reg_ym: string;
}

// 포인트 목록 조회 응답 인터페이스
export interface GetMemberPointAppResponse {
  success: boolean;
  message?: string;
  data: MemberPointApp[];
}

// 회원 포인트 목록 조회 API
export const getMemberPointAppList = async (params: GetMemberPointAppRequest): Promise<GetMemberPointAppResponse> => {
  try {
    const response = await axiosInstance.post('/member-point-app/getMemberPointAppList', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 

export interface InsertMemberPointAppRequest {
  mem_id: number;
  point_amount: number;
  point_status: 'PLUS' | 'MINUS';
  reason?: string;
  order_detail_app_id?: number;
}

export interface InsertMemberPointAppResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const insertMemberPointApp = async (params: InsertMemberPointAppRequest): Promise<InsertMemberPointAppResponse> => {
  try {
    const response = await axiosInstance.post('/member-point-app/insertMemberPointApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};