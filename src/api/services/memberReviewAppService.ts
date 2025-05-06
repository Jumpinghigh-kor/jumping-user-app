import {axiosInstance} from '../config/axiosConfig';

// 리뷰 타입 정의
export interface Review {
  review_app_id: number;
  mem_id: number;
  product_app_id: number;
  title: string;
  content: string;
  star_point: number;
  del_yn: string;
  reg_dt: string;
  reg_id: number;
  mod_dt: string;
  mod_id: number;
  review_cnt: number;
  avg_star_point: string;
  review_title: string;
  product_title: string;
  brand_name: string;
  product_name: string;
  // 추가 필드가 있다면 여기에 정의
}

// 리뷰 등록 요청 인터페이스
export interface InsertMemberReviewRequest {
  mem_id: number;
  product_app_id: number;
  title: string;
  content: string;
  star_point: number;
  file_name?: string[];
}

// 리뷰 등록/수정 응답 인터페이스
export interface MemberReviewResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// 리뷰 목록 조회 응답 인터페이스
export interface GetReviewsResponse {
  success: boolean;
  message?: string;
  data: Review[];
}

// 회원 리뷰 목록 조회 API - product_app_id는 선택적 파라미터
export const getMemberReviewAppList = async (params?: { product_app_id?: number }): Promise<GetReviewsResponse> => {
  try {
    const response = await axiosInstance.post('/member-review-app/getMemberReviewAppList', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 타겟 리뷰 목록 조회 API
export const getTargetMemberReviewAppList = async (params?: { mem_id?: number }): Promise<GetReviewsResponse> => {
  try {
    const response = await axiosInstance.post('/member-review-app/getTargetMemberReviewAppList', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 리뷰 등록 API
export const insertMemberReviewApp = async (params: InsertMemberReviewRequest): Promise<MemberReviewResponse> => {
  try {
    const response = await axiosInstance.post('/member-review-app/insertMemberReviewApp', params);
    return response.data;
  } catch (error: any) {
    console.error('리뷰 등록 오류:', error);
    throw error;
  }
}; 