import { axiosInstance } from '../config/axiosConfig';

// 쿠폰 지급 API
export const insertInquiryShoppingApp = async (inquiryData: any) => {
  try {
    const response = await axiosInstance.post('/inquiry-shopping-app/insertInquiryShoppingApp', inquiryData);
    return response.data;
  } catch (error) {
    console.error('쿠폰 지급 실패:', error);
    throw error;
  }
};