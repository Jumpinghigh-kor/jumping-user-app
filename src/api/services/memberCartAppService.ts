import { axiosInstance } from '../config/axiosConfig';

// API 응답 타입 정의
interface GetCartResponse {
  success: boolean;
  message: string;
  data: CartItem[] | CartItem;
}

// 장바구니 아이템 타입 정의
export interface CartItem {
  cart_app_id: number;
  mem_id: number;
  product_app_id: number;
  product_detail_app_id: number;
  quantity: number;
  del_yn: string;
  title?: string;
  price?: number;
  original_price?: number;
  discount?: number;
  brand_name?: string;
  product_quantity?: number;
  option_amount?: string;
  option_unit?: string;
  option_gender?: string;
}

// 장바구니 목록 조회 API
export const getMemberCartAppList = async (params: { mem_id: number }): Promise<GetCartResponse> => {
  try {
    const response = await axiosInstance.post('/member-cart-app/getMemberCartAppList', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 장바구니 추가 API
export const insertMemberCartApp = async (params: { 
  mem_id: number;
  product_detail_app_id: number;
  quantity: number;
}): Promise<GetCartResponse> => {
  try {
    const response = await axiosInstance.post('/member-cart-app/insertMemberCartApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 장바구니 수량 변경 API
export const updateMemberCartApp = async (params: {
  mem_id: number;
  cart_app_id: number;
  quantity: number;
  product_detail_app_id: number;
}): Promise<GetCartResponse> => {
  try {
    const response = await axiosInstance.post('/member-cart-app/updateMemberCartApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 장바구니 삭제 API
export const deleteMemberCartApp = async (params: {
  mem_id: number;
  cart_app_id: number;
}): Promise<GetCartResponse> => {
  try {
    const response = await axiosInstance.post('/member-cart-app/deleteMemberCartApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 