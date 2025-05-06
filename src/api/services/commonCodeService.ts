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

// 공통 코드 목록 조회 API
export const getCommonCodeList = async (params?: GetCommonCodeListRequest): Promise<GetCommonCodeListResponse> => {
  try {
    const response = await axiosInstance.post('/common-code/getCommonCodeList', params || {});
    return response.data;
  } catch (error: any) {
    console.error('[CommonCodeService] 공통 코드 조회 실패:', error);
    throw error;
  }
}; 