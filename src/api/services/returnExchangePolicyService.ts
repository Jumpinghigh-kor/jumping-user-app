import {axiosInstance} from '../config/axiosConfig';

// 공지사항 타입 정의
export interface ReturnExchangePolicy {
  return_exchange_id: number;
  title: string;
  content: string;
  direction: string;
  order_seq: number;
  // 추가 필드가 있다면 여기에 정의
}

// 공지사항 목록 조회 요청 인터페이스
export interface GetReturnExchangePolicyRequest {
  product_app_id?: string;
}

export interface GetReturnExchangePolicyResponse {
  success: boolean;
  message?: string;
  data: ReturnExchangePolicy[];
}

// 공지사항 목록 조회 API
export const getReturnExchangePolicyList = async (params?: GetReturnExchangePolicyRequest): Promise<GetReturnExchangePolicyResponse> => {
  try {
    const response = await axiosInstance.post('/return-exchange-policy/getReturnExchangePolicyList', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};