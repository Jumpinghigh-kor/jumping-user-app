import {axiosInstance} from '../config/axiosConfig';

interface GetMemberOrderAppRequest {
  mem_id: string | number;
  screen_type: string;
  year?: string;
  search_title?: string;
}

export interface MemberOrderAppItem {
  product_app_id: number;
  brand_name: string;
  product_name: string;
  product_title: string;
  order_quantity: number;
  order_price: number;
  order_dt: string;
  review_yn: string;
  order_status: string;
  option_amount: number;
  option_type: string;
  option_unit: string;
}

export interface GetMemberOrderAppResponse {
  success: boolean;
  message?: string;
  data?: MemberOrderAppItem[];
}

export const getMemberOrderAppList = async (params: GetMemberOrderAppRequest): Promise<GetMemberOrderAppResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-app/getMemberOrderAppList', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};