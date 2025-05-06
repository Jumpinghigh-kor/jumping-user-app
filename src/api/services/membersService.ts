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
  center_id: number;
  center_name: string;
  sch_time: string
  mem_sch_id: number;
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
  current_password?: string;
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

// 닉네임 중복 체크 API
export const checkNicknameDuplicate = async (nickname: string) => {
  try {
    const response = await axiosInstance.post('/members/checkNicknameDuplicate', {
      mem_nickname: nickname,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원가입 완료 API
export const completeSignup = async (memId: string, nickname: string) => {
  try {
    const response = await axiosInstance.post('/members/completeSignup', {
      mem_id: memId,
      mem_nickname: nickname,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 