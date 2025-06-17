import {axiosInstance} from '../config/axiosConfig';

interface MemberZzimRequest {
  mem_id: string | number;
  product_app_id: number;
}

interface UpdateMemberZzimRequest {
  zzim_app_id: number;
  zzim_yn: 'Y' | 'N';
  mem_id: string | number;
}

interface GetMemberZzimRequest {
  mem_id: string | number;
}

interface GetMemberZzimDetailRequest {
  mem_id: string | number;
  product_app_id: number;
}

export interface MemberZzimItem {
  zzim_app_id: number;
  mem_id: number | string;
  product_app_id: number;
  zzim_yn: 'Y' | 'N';
  reg_dt?: string;
  upd_dt?: string;
}

export interface GetMemberZzimResponse {
  success: boolean;
  message?: string;
  data?: MemberZzimItem[];
}

export interface MemberZzimResponse {
  success: boolean;
  message?: string;
  data?: {
    zzim_app_id?: number;
    [key: string]: any;
  };
}

export const getMemberZzimAppList = async (params: GetMemberZzimRequest): Promise<GetMemberZzimResponse> => {
  try {
    const response = await axiosInstance.post('/member-zzim-app/getMemberZzimAppList', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const insertMemberZzimApp = async (params: MemberZzimRequest): Promise<MemberZzimResponse> => {
  try {
    const response = await axiosInstance.post('/member-zzim-app/insertMemberZzimApp', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateMemberZzimApp = async (params: UpdateMemberZzimRequest): Promise<MemberZzimResponse> => {
  try {
    const response = await axiosInstance.post('/member-zzim-app/updateMemberZzimApp', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMemberZzimAppDetail = async (params: GetMemberZzimDetailRequest): Promise<MemberZzimResponse> => {
  try {
    const response = await axiosInstance.post('/member-zzim-app/getMemberZzimAppDetail', params);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 