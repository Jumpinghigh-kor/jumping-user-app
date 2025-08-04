import {axiosInstance} from '../config/axiosConfig';

interface GetMemberOrderAppRequest {
  mem_id: string | number;
  screen_type: string;
  year?: string;
  search_title?: string;
}

export interface MemberOrderAppItem {
  product_app_id: number;
  product_detail_app_id: number;
  product_name: string;
  option_gender: string;
  option_amount: number;
  option_unit: string;
  quantity: number;
  price: number;
  brand_name: string;
  title: string;
  order_status: string;
  order_dt: string;
}

export interface GetMemberOrderAppResponse {
  success: boolean;
  message?: string;
  data?: MemberOrderAppItem[];
}

export interface InsertMemberOrderAppRequest {
  payment_app_id: number;
  product_detail_app_id: number;
  mem_id: number;
  order_address_id: number;
  order_quantity: number;
}

export interface InsertMemberOrderAppResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const getMemberOrderAppList = async (params: GetMemberOrderAppRequest): Promise<GetMemberOrderAppResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-app/getMemberOrderAppList', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const insertMemberOrderApp = async (params: InsertMemberOrderAppRequest): Promise<InsertMemberOrderAppResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-app/insertMemberOrderApp', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 정보 저장 실패:', error);
    throw error;
  }
};