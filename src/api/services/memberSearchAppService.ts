import { axiosInstance } from '../config/axiosConfig';

export interface MemberSearch {
  search_app_id: number;
  mem_id: number | string;
  keyword: string;
  reg_dt: string;
}

export interface GetMemberSearchRequest {
  mem_id: number | string;
}

export interface InsertMemberSearchRequest {
  mem_id: number | string;
  keyword: string;
}

export interface DeleteMemberSearchRequest {
  search_app_id: number;
  mem_id: number | string;
}

export interface MemberSearchResponse {
  success: boolean;
  message?: string;
}

export interface GetMemberSearchResponse {
  success: boolean;
  message?: string;
  data: MemberSearch[];
}

export interface GetSearchProductRequest {
  mem_id: number | string;
  keyword: string;
}

export interface SearchProduct {
  product_app_id: number;
  title: string;
  image: string;
  price: number;
  original_price: number;
  discount: number;
  // 기타 상품 정보 필드
}

export interface GetSearchProductResponse {
  success: boolean;
  message?: string;
  data: SearchProduct[];
}

export const getMemberSearchAppList = async (params: GetMemberSearchRequest): Promise<GetMemberSearchResponse> => {
  try {
    const response = await axiosInstance.post('/member-search-app/getMemberSearchAppList', params);
    return response.data;
  } catch (error: any) {
    console.error('검색어 목록 조회 오류:', error);
    throw error;
  }
};

export const insertMemberSearchApp = async (params: InsertMemberSearchRequest): Promise<MemberSearchResponse> => {
  try {
    const response = await axiosInstance.post('/member-search-app/insertMemberSearchApp', params);
    return response.data;
  } catch (error: any) {
    console.error('검색어 저장 오류:', error);
    throw error;
  }
};

export const deleteMemberSearchApp = async (params: DeleteMemberSearchRequest): Promise<MemberSearchResponse> => {
  try {
    const response = await axiosInstance.post('/member-search-app/deleteMemberSearchApp', params);
    return response.data;
  } catch (error: any) {
    console.error('검색어 삭제 오류:', error);
    throw error;
  }
};

export const getSearchProduct = async (params: GetSearchProductRequest): Promise<GetSearchProductResponse> => {
  try {
    const response = await axiosInstance.post('/member-search-app/getSearchProduct', params);
    return response.data;
  } catch (error: any) {
    console.error('상품 검색 오류:', error);
    throw error;
  }
}; 