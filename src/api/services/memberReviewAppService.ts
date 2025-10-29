import {axiosInstance} from '../config/axiosConfig';

// 리뷰 타입 정의
export interface Review {
  review_app_id: number;
  mem_id: number;
  product_app_id: number;
  product_detail_app_id: number;
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
  review_img_count: number;
  admin_del_yn: string;
  // 추가 필드가 있다면 여기에 정의
}

// 리뷰 등록 요청 인터페이스
export interface InsertMemberReviewRequest {
  mem_id: number;
  order_app_id: number;
  product_app_id: number;
  title: string;
  content: string;
  star_point: number;
  file_name?: string[];
  file_ids?: number[];
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
export const getMemberReviewAppList = async (params?: { product_app_id?: number, filter?: string, review_img_yn?: string }): Promise<GetReviewsResponse> => {
  try {
    const response = await axiosInstance.post('/member-review-app/getMemberReviewAppList', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 타겟 리뷰 목록 조회 API
export const getCompleteMemberReviewAppList = async (params?: { mem_id?: number }): Promise<GetReviewsResponse> => {
  try {
    const response = await axiosInstance.post('/member-review-app/getCompleteMemberReviewAppList', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 리뷰 이미지 조회 API
export const getMemberReviewAppImgList = async (params?: { review_app_id?: number }): Promise<GetReviewsResponse> => {
  try {
    const response = await axiosInstance.post('/member-review-app/getMemberReviewAppImgList', params || {});
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
    throw error;
  }
};

// 회원 리뷰 수정 API
export const updateMemberReviewApp = async (params: { 
  review_app_id: number; 
  title: string; 
  content: string; 
  star_point: number;
  mem_id: number;
  file_name?: string[];
  file_ids?: number[];
  review_app_img_id?: number[];
}): Promise<MemberReviewResponse> => {
  try {
    const response = await axiosInstance.post('/member-review-app/updateMemberReviewApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 리뷰 삭제 API
export const deleteMemberReviewApp = async (params: { 
  review_app_id: number;
  mem_id: number;
}): Promise<MemberReviewResponse> => {
  try {
    const response = await axiosInstance.post('/member-review-app/deleteMemberReviewApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 

export const insertMemberReviewAppImg = async (params: { 
  review_app_id: number;
  mem_id: number;
  file_name: string;
}): Promise<MemberReviewResponse> => {
  try {
    const response = await axiosInstance.post('/member-review-app/insertMemberReviewAppImg', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};