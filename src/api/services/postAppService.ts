import { axiosInstance } from '../config/axiosConfig';

export interface PostAppType {
  post_app_id: number;
  member_post_app_id: number;
  post_type: string;
  title: string;
  content: string;
  read_yn: string;
  read_dt: string;
  reg_dt: string;
}

// 우편 정보 조회 API
export const getPostAppList = async (mem_id: number, post_type: string) => {
  try {
    const response = await axiosInstance.post('/post-app/getPostAppList', {
      mem_id: mem_id,
      post_type: post_type
    });
    return response.data;
  } catch (error) {
    console.error('우편 정보 조회 실패:', error.response);
    throw error;
  }
}; 

// 우편 회원 등록 API
export const insertMemberPostApp = async (postData: any) => {
  try {
    const response = await axiosInstance.post('/post-app/insertMemberPostApp', postData);
    return response.data;
  } catch (error) {
    console.error('우편 회원 등록 실패:', error.response);
    throw error;
  }
};

// 우편 회원 업데이트 API
export const updateMemberPostApp = async (postData: any) => {
  try {
    const response = await axiosInstance.post('/post-app/updateMemberPostApp', postData);
    return response.data;
  } catch (error) {
    console.error('우편 회원 업데이트 실패:', error.response);
    throw error;
  }
};

// 우편 회원 삭제 API (post_app_id 배열 전송 가능)
export const deleteMemberPostApp = async (post_app_id: number | number[], mem_id: number) => {
  try {
    const response = await axiosInstance.post('/post-app/deleteMemberPostApp', {
      post_app_id: Array.isArray(post_app_id) ? post_app_id : [post_app_id],
      mem_id: mem_id
    });
    return response.data;
  } catch (error) {
    console.error('우편 회원 삭제 실패:', error.response);
    throw error;
  }
};