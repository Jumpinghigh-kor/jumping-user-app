import { axiosInstance } from '../config/axiosConfig';


export interface GetMemberOrderAddressListRequest {
  mem_id: number;
}

export interface CommonMemberOrderAddressListResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface InsertMemberOrderAddressRequest {
  order_detail_app_id?: number;
  mem_id: number;
  order_address_type: string;
  receiver_name: string;
  receiver_phone: string;
  address: string;
  address_detail: string;
  zip_code: string;
  enter_way?: string;
  enter_memo?: string;
  delivery_request?: string;
}

export interface UpdateMemberOrderAddressRequest {
  order_address_id: number;
  mem_id: number;
  order_address_type: string;
}

export interface DeleteMemberOrderAddressRequest {
  order_detail_app_id: number;
  mem_id: number;
}

export interface UpdateMemberOrderAddressUseYnRequest {
  order_address_id: number;
  mem_id: number;
  use_yn: 'Y' | 'N';
}

export interface UpdateMemberOrderAddressTypeRequest {
  order_address_id: number;
  mem_id: number;
  order_address_type: string;
}

export interface GetTargetMemberOrderAddressRequest {
  order_detail_app_id: number;
}

export interface UpdateOrderDetailAppIdRequest {
  order_address_id: number;
  mem_id: number;
  order_detail_app_id: number;
}

export const getMemberOrderAddressList = async (params: GetMemberOrderAddressListRequest): Promise<CommonMemberOrderAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-address/getMemberOrderAddressList', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTargetMemberOrderAddress = async (params: GetTargetMemberOrderAddressRequest): Promise<CommonMemberOrderAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-address/getTargetMemberOrderAddress', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const insertMemberOrderAddress = async (params: InsertMemberOrderAddressRequest): Promise<CommonMemberOrderAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-address/insertMemberOrderAddress', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 배송지 저장 실패:', error.response.data.message);
    throw error;
  }
}

export const updateMemberOrderAddress = async (params: UpdateMemberOrderAddressRequest): Promise<CommonMemberOrderAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-address/updateMemberOrderAddress', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 배송지 수정 실패:', error.response.data.message);
    throw error;
  }
};

export const updateMemberOrderAddressType = async (params: UpdateMemberOrderAddressTypeRequest): Promise<CommonMemberOrderAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-address/updateMemberOrderAddressType', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 배송지 타입 수정 실패:', error.response.data.message);
    throw error;
  }
};

export const deleteMemberOrderAddress = async (params: DeleteMemberOrderAddressRequest): Promise<CommonMemberOrderAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-address/deleteMemberOrderAddress', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 배송지 삭제 실패:', error.response.data.message);
    throw error;
  }
};

export const updateMemberOrderAddressUseYn = async (params: UpdateMemberOrderAddressUseYnRequest): Promise<CommonMemberOrderAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-address/updateMemberOrderAddressUseYn', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 배송지 사용 여부 수정 실패:', error.response.data.message);
    throw error;
  }
}; 

export const updateOrderDetailAppId = async (params: UpdateOrderDetailAppIdRequest): Promise<CommonMemberOrderAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-order-address/updateOrderDetailAppId', params);
    return response.data;
  } catch (error: any) {
    console.error('주문 상세 ID 수정 실패:', error.response.data.message);
    throw error;
  }
}; 