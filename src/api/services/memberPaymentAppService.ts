import { axiosInstance } from '../config/axiosConfig';

export interface InsertMemberPaymentAppRequest {
  mem_id: number;
  payment_method?: string;
  payment_amount: number;
  portone_imp_uid?: string;
  portone_merchant_uid?: string;
  portone_status: string;
  card_name: string;
}

export interface InsertMemberPaymentAppResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const insertMemberPaymentApp = async (params: InsertMemberPaymentAppRequest): Promise<InsertMemberPaymentAppResponse> => {
  try {
    const response = await axiosInstance.post('/member-payment-app/insertMemberPaymentApp', params);
    return response.data;
  } catch (error: any) {
    console.error('결제 정보 저장 실패:', error);
    throw error;
  }
}; 