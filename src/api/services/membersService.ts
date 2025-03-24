import axios from 'axios';
import {axiosInstance} from '../config/axiosConfig';

// 회원 정보 타입 정의
export interface MemberInfo {
  mem_id: string;
  name: string;
  phone: string;
  email: string;
  mem_nickname: string;
  mem_email_id: string;
  // 필요한 다른 회원 정보 필드 추가
}

export interface GetMemberInfoResponse {
  success: boolean;
  message?: string;
  data: MemberInfo;
}

interface MemberInfoRequest {
  mem_id: string;
}

// 비밀번호 변경 API
export interface UpdatePasswordRequest {
  mem_id: number;
  mem_app_password: string;
}

export interface UpdatePasswordResponse {
  success: boolean;
  message?: string;
}

export const getMemberInfo = async (params: MemberInfoRequest): Promise<GetMemberInfoResponse> => {
  try {
    const response = await axiosInstance.post('/members/getMemberInfo', params);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateMemberAppPassword = async (
  params: UpdatePasswordRequest
): Promise<UpdatePasswordResponse> => {
  try {
    const response = await axiosInstance.post(
      '/members/updateMemberAppPassword',
      params
    );
    return response.data;
  } catch (error: any) {
    console.log(error.response.data);
    throw error;
  }
}; 