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
  select_yn: 'Y' | 'N';
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

export interface InsertMemberShippingAddressRequest {
  mem_id: string | number;
  shipping_address_name: string;
  receiver_name: string;
  receiver_phone: string;
  default_yn: 'Y' | 'N';
  select_yn: 'Y' | 'N';
  del_yn: 'Y' | 'N';
  address: string;
  address_detail: string;
  zip_code: string;
  enter_way?: string;
  enter_memo?: string;
}

export interface InsertMemberShippingAddressResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface DeleteMemberShippingAddressRequest {
  shipping_address_id: number;
  mem_id: string | number;
}

export interface DeleteMemberShippingAddressResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface UpdateMemberShippingAddressRequest {
  shipping_address_id: number;
  mem_id: number;
  shipping_address_name: string;
  receiver_name: string;
  receiver_phone: string;
  default_yn: string;
  select_yn: string;
  del_yn: string;
  address: string;
  address_detail: string;
  zip_code: string;
  enter_way?: string;
  enter_memo?: string;
  delivery_request?: string;
}

export interface UpdateMemberShippingAddressResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface UpdateDeliveryRequestRequest {
  shipping_address_id: number;
  mem_id: string | number;
  delivery_request: string | null;
}

export interface UpdateDeliveryRequestResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface UpdateSelectYnRequest {
  mem_id: string | number;
  shipping_address_id: number;
  select_yn: 'Y' | 'N';
}

export interface UpdateSelectYnResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const getMemberShippingAddressList = async (params: GetMemberShippingAddressListRequest): Promise<GetMemberShippingAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-shipping-address/getMemberShippingAddressList', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTargetMemberShippingAddress = async (params: GetMemberShippingAddressListRequest): Promise<GetMemberShippingAddressListResponse> => {
  try {
    const response = await axiosInstance.post('/member-shipping-address/getTargetMemberShippingAddress', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const insertMemberShippingAddress = async (params: InsertMemberShippingAddressRequest): Promise<InsertMemberShippingAddressResponse> => {
  try {
    const response = await axiosInstance.post('/member-shipping-address/insertMemberShippingAddress', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteMemberShippingAddress = async (params: DeleteMemberShippingAddressRequest): Promise<DeleteMemberShippingAddressResponse> => {
  try {
    const response = await axiosInstance.post('/member-shipping-address/deleteMemberShippingAddress', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateMemberShippingAddress = async (params: UpdateMemberShippingAddressRequest): Promise<UpdateMemberShippingAddressResponse> => {
  try {
    const response = await axiosInstance.post('/member-shipping-address/updateMemberShippingAddress', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateDeliveryRequest = async (params: UpdateDeliveryRequestRequest): Promise<UpdateDeliveryRequestResponse> => {
  try {
    const response = await axiosInstance.post('/member-shipping-address/updateDeliveryRequest', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSelectYn = async (params: UpdateSelectYnRequest): Promise<UpdateSelectYnResponse> => {
  try {
    const response = await axiosInstance.post('/member-shipping-address/updateSelectYn', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};