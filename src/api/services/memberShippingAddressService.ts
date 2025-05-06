import {axiosInstance} from '../config/axiosConfig';

interface GetMemberShippingAddressListRequest {
  mem_id: string | number;
}

export interface ShippingAddressItem {
  shipping_address_id: number;
  mem_id: string | number;
  shipping_address_name: string;
  receiver_name: string;
  receiver_phone: string;
  default_yn: 'Y' | 'N';
  del_yn: 'Y' | 'N';
  address: string;
  address_detail: string;
  zip_code: string;
  enter_way?: string;
  enter_memo?: string;
  delivery_request?: string;
  reg_dt?: string;
  reg_id?: string | number;
  mod_dt?: string;
  mod_id?: string | number;
}

export interface GetMemberShippingAddressListResponse {
  success: boolean;
  message?: string;
  data?: ShippingAddressItem[];
}

export const getMemberShippingAddressList = async (params: GetMemberShippingAddressListRequest): Promise<GetMemberShippingAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-shipping-address/getMemberShippingAddressList', params);
    return response.data;
  } catch (error) {
    console.error('배송지 목록 조회 오류:', error);
    throw error;
  }
}; 