import {axiosInstance} from '../config/axiosConfig';

// 상품 타입 정의
export interface Product {
  product_app_id: number;
  title: string;
  price: number;
  original_price: number;
  discount: number;
  big_category: string;
  small_category: string;
  image: string;
  reg_dt: string;
  product_name: string;
  brand_name: string;
  option_gender: string;
  option_amount: number;
  option_unit: string;
  // 추가 필드가 있다면 여기에 정의
}

// 상품 목록 조회 응답 인터페이스
export interface GetProductsResponse {
  success: boolean;
  message?: string;
  data: Product[];
}

// 상품 목록 조회 API
export const getProductAppList = async (params?: any): Promise<GetProductsResponse> => {
  try {
    const response = await axiosInstance.post('/product-app/getProductAppList', params || {});
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 상품 상세 조회 API
export const getProductAppImgDetail = async (params: {product_app_id: number}): Promise<GetProductsResponse> => {
  try {
    const response = await axiosInstance.post('/product-app/getProductAppImgDetail', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};


export const getProductAppThumbnailImg = async (): Promise<GetProductsResponse> => {
  try {
    const response = await axiosInstance.post('/product-app/getProductAppThumbnailImg');
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

// 상품 상세 목록 조회 API
export const getProductDetailAppList = async (params: {product_app_id: number}): Promise<GetProductsResponse> => {
  try {
    const response = await axiosInstance.post('/product-app/getProductDetailAppList', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};