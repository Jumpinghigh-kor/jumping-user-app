import axios from 'axios';
import {axiosInstance} from '../config/axiosConfig';

// 회원 정보 타입 정의
export interface MemberInfo {
  mem_id: string;
  mem_name: string;
  mem_phone: string;
  email: string;
  mem_nickname: string;
  mem_email_id: string;
  center_id: number;
  center_name: string;
  sch_time: string
  mem_sch_id: number;
  total_point: number;
  mem_checkin_number: string;
  coupon_cnt: number;
  cart_cnt: number;
  mem_role: string;
  push_yn: string;
  push_token: string;
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

// 회원 탈퇴 API
export const updateMemberWithdrawal = async (memId: string) => {
  try {
    const response = await axiosInstance.post('/members/updateMemberWithdrawal', {
      mem_id: memId,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 푸시 토큰 업데이트 API
export interface UpdatePushTokenRequest {
  mem_id: string;
  push_token: string;
}

export interface UpdatePushTokenResponse {
  success: boolean;
  message?: string;
}

export const updatePushToken = async (
  params: UpdatePushTokenRequest
): Promise<UpdatePushTokenResponse> => {
  try {
    const response = await axiosInstance.post('/members/updatePushToken', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 푸시 알림 설정 업데이트 API
export interface UpdatePushYnRequest {
  mem_id: string;
  push_yn: 'Y' | 'N';
}

export interface UpdatePushYnResponse {
  success: boolean;
  message?: string;
}

export const updatePushYn = async (
  params: UpdatePushYnRequest
): Promise<UpdatePushYnResponse> => {
  try {
    const response = await axiosInstance.post('/members/updatePushYn', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const updateRecentDt = async (mem_id: number) => {
  try {
    const response = await axiosInstance.post('/members/updateRecentDt', {
      mem_id: mem_id,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 아이디 찾기 API
export const findId = async (name: string, phone: string) => {
  try {
    const response = await axiosInstance.post('/members/findId', {
      mem_name: name,
      mem_phone: phone,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 비밀번호 찾기 API
export const findPassword = async (id: string, name: string, phone: string) => {
  console.log(id, name, phone);
  try {
    const response = await axiosInstance.post('/members/findPassword', {
      mem_email_id: id,
      mem_name: name,
      mem_phone: phone,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};