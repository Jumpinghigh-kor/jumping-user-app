import {axiosInstance} from '../config/axiosConfig';

// 공통 코드 타입 정의
export interface CommonCode {
  common_code: string;
  common_code_name: string;
  common_code_memo: string;
  order_seq?: number;
  use_yn: string;
  group_code: string;
}

export interface GetCommonCodeListResponse {
  success: boolean;
  message?: string;
  data: CommonCode[];
}

interface GetCommonCodeListRequest {
  group_code?: string;
}

// 공통 파일 등록 요청 인터페이스
interface InsertCommonFileRequest {
  file_name: string;
  file_path: string;
  file_division: string;
  mem_id: number;
}

// 공통 파일 등록 응답 인터페이스
interface InsertCommonFileResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// 공통 파일 삭제 요청 인터페이스
interface DeleteCommonFileRequest {
  file_id: number;
  mem_id: number;
}

// 공통 파일 삭제 응답 인터페이스
interface DeleteCommonFileResponse {
  success: boolean;
  message?: string;
  data?: any;
}


// 공통 코드 목록 조회 API
export const getCommonCodeList = async (params?: GetCommonCodeListRequest): Promise<GetCommonCodeListResponse> => {
  try {
    const response = await axiosInstance.post('/common-code/getCommonCodeList', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 공통 파일 등록 API
export const insertCommonFile = async (params: InsertCommonFileRequest): Promise<InsertCommonFileResponse> => {
  try {
    const response = await axiosInstance.post('/common-code/insertCommonFile', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 공통 파일 삭제 API
export const deleteCommonFile = async (params: DeleteCommonFileRequest): Promise<DeleteCommonFileResponse> => {
  try {
    const response = await axiosInstance.post('/common-code/deleteCommonFile', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

