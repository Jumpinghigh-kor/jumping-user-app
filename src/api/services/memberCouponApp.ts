import { axiosInstance } from '../config/axiosConfig';

// 쿠폰 지급 API
export const insertMemberCouponApp = async (couponData: any) => {
  try {
    const response = await axiosInstance.post('/member-coupon-app/insertMemberCouponApp', couponData);
    return response.data;
  } catch (error) {
    console.error('쿠폰 지급 실패:', error);
    throw error;
  }
};

// 회원 쿠폰 목록 조회 API
export const getMemberCouponAppList = async (getMemberCouponAppListDto: any) => {
  try {
    const response = await axiosInstance.post('/member-coupon-app/getMemberCouponAppList', {
      mem_id: getMemberCouponAppListDto.mem_id,
      use_yn: getMemberCouponAppListDto.use_yn,
      date: getMemberCouponAppListDto.date
    });
    return response.data;
  } catch (error) {
    console.error('회원 쿠폰 목록 조회 실패:', error);
    throw error;
  }
};

// 쿠폰 정보 조회 API
export const getCouponAppList = async (product_app_id: number) => {
  try {
    const response = await axiosInstance.post('/member-coupon-app/getCouponAppList', {
      product_app_id: product_app_id
    });
    return response.data;
  } catch (error) {
    console.error('쿠폰 정보 조회 실패:', error);
    throw error;
  }
}; 