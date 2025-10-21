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

export interface InsertMemberOrderDetailAppRequest {
  order_detail_app_id: number;
  order_app_id: number;
  product_detail_app_id: number;
  order_status: string;
  order_quantity: number;
  order_group: number;
  mem_id: number;
}

export interface InsertMemberOrderDetailAppResponse {
  success: boolean;
  message?: string;
  data?: any;
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

export const insertMemberOrderDetailApp = async (params: InsertMemberOrderDetailAppRequest): Promise<InsertMemberOrderDetailAppResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-app/insertMemberOrderDetailApp', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 정보 저장 실패:', error.response.data.message);
    throw error;
  }
};

export interface UpdateMemberOrderDetailAppRequest {
  order_detail_app_ids: number[];
  mem_id: number;
  courier_code: string;
  tracking_number: string;
  goodsflow_id: string;
  purchase_confirm_dt: string;
}

export interface UpdateMemberOrderDetailAppResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface UpdateOrderQuantityRequest {
  order_detail_app_id: number;
  mem_id: number;
  order_quantity: number;
}

export interface UpdateOrderQuantityResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface UpdateOrderStatusRequest {
  order_detail_app_ids: number[];
  mem_id: number;
  order_status: string;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const updateMemberOrderDetailApp = async (params: UpdateMemberOrderDetailAppRequest): Promise<UpdateMemberOrderDetailAppResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-app/updateMemberOrderDetailApp', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 상세 정보 업데이트 실패:', error.response.data.message);
    throw error;
  }
};

export const updateOrderStatus = async (params: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-app/updateOrderStatus', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 상태 업데이트 실패:', error.response.data.message);
    throw error;
  }
};

export const updateOrderQuantity = async (params: UpdateOrderQuantityRequest): Promise<UpdateOrderQuantityResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-app/updateOrderQuantity', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 수량 업데이트 실패:', error);
    throw error;
  }
};