import { axiosInstance } from '../config/axiosConfig';

export interface InsertMemberOrderAddressRequest {
  mem_id: number;
  receiver_name: string;
  receiver_phone: string;
  address: string;
  address_detail: string;
  zip_code: string;
  enter_way?: string;
  enter_memo?: string;
  delivery_request?: string;
}

export interface InsertMemberOrderAddressResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const insertMemberOrderAddress = async (params: InsertMemberOrderAddressRequest): Promise<InsertMemberOrderAddressResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-address/insertMemberOrderAddress', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 배송지 저장 실패:', error);
    throw error;
  }
}; 