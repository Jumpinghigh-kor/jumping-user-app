import {axiosInstance} from '../config/axiosConfig';

// 프로필 이미지 업로드 요청 인터페이스
interface UploadProfileImageRequest {
  file_name: string; // base64 이미지 데이터
  file_path: string; // 파일 경로 (ex: /profile)
  file_division: string; // 파일 구분 (ex: profile)
  mem_id: number; // 회원 ID
}

// 프로필 이미지 업로드 응답 인터페이스
interface UploadProfileImageResponse {
  success: boolean;
  message?: string;
  data?: {
    file_id: number;
    file_url: string;
  };
}

// 회원 이미지 연결 요청 인터페이스
interface LinkMemberImageRequest {
  mem_id: number; // 회원 ID
  file_id: number; // 파일 시퀀스 번호
}

// 회원 이미지 연결 응답 인터페이스
interface LinkMemberImageResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// 회원 이미지 조회 요청 인터페이스
interface GetMemberImageRequest {
  mem_id: number; // 회원 ID
}

// 회원 이미지 조회 응답 인터페이스
interface GetMemberImageResponse {
  success: boolean;
  message?: string;
  data?: {
    file_url: string;
    member_img_id: number; // 회원 이미지 ID 추가
  };
}

// 회원 이미지 개수 조회 요청 인터페이스
interface GetMemberImageCountRequest {
  mem_id: number; // 회원 ID
}

// 회원 이미지 개수 조회 응답 인터페이스
interface GetMemberImageCountResponse {
  success: boolean;
  message?: string;
  data?: {
    imgCnt: number;
  };
}

// 회원 이미지 미사용 처리 요청 인터페이스
interface UpdateMemberImageRequest {
  member_img_id: number; // 회원 이미지 ID
  mem_id: number; // 회원 ID
}

// 회원 이미지 미사용 처리 응답 인터페이스
interface UpdateMemberImageResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// 회원 이미지 삭제 요청 인터페이스
interface DeleteMemberImageRequest {
  mem_id: number; // 회원 ID
  member_img_id: number; // 회원 이미지 ID
}

// 회원 이미지 삭제 응답 인터페이스
interface DeleteMemberImageResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// 프로필 이미지 업로드 API
export const uploadProfileImage = async (
  imageUrlOrData: string,
  memberId: string,
  fileName?: string, // 파일 이름 파라미터 추가
): Promise<UploadProfileImageResponse> => {
  try {
    // 파일 이름이 없으면 생성
    const actualFileName = fileName || `profile_${memberId}_${Date.now()}.jpg`;
    
    const requestData: UploadProfileImageRequest = {
      file_name: actualFileName, // 파일 이름
      file_path: '/profile', // 파일 경로
      file_division: 'profile', // 파일 구분
      mem_id: parseInt(memberId, 10) || 0, // 회원 ID
    };

    const response = await axiosInstance.post(
      '/common-code/insertCommonFile',
      requestData,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 이미지 연결 API
export const linkMemberImage = async (
  memberId: string,
  fileId: number,
): Promise<LinkMemberImageResponse> => {
  try {
    const requestData: LinkMemberImageRequest = {
      mem_id: parseInt(memberId, 10) || 0, // 문자열을 숫자로 변환
      file_id: fileId,
    };

    const response = await axiosInstance.post(
      '/member-img-file/insertMemberImgFile',
      requestData,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 이미지 조회 API
export const getMemberImageFile = async (
  memberId: string,
): Promise<GetMemberImageResponse> => {
  try {
    const requestData: GetMemberImageRequest = {
      mem_id: parseInt(memberId, 10) || 0, // 문자열을 숫자로 변환
    };

    const response = await axiosInstance.post(
      '/member-img-file/selectMemberImgFile',
      requestData,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 이미지 개수 조회 API
export const getMemberImageCount = async (
  memberId: string,
): Promise<GetMemberImageCountResponse> => {
  try {
    const requestData: GetMemberImageCountRequest = {
      mem_id: parseInt(memberId, 10) || 0, // 문자열을 숫자로 변환
    };

    const response = await axiosInstance.post(
      '/member-img-file/selectMemberImgFileCnt',
      requestData,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 이미지 미사용 처리 API
export const updateMemberImage = async (
  memberImgId: number,
  memberId: string,
): Promise<UpdateMemberImageResponse> => {
  try {
    const requestData: UpdateMemberImageRequest = {
      member_img_id: memberImgId,
      mem_id: parseInt(memberId, 10) || 0, // 문자열을 숫자로 변환
    };

    const response = await axiosInstance.post(
      '/member-img-file/updateMemberImgFile',
      requestData,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// 회원 이미지 삭제 API
export const deleteMemberImgFile = async (
  memberId: string,
  memberImgId: number,
): Promise<DeleteMemberImageResponse> => {
  try {
    const requestData: DeleteMemberImageRequest = {
      mem_id: parseInt(memberId, 10) || 0,
      member_img_id: memberImgId,
    };

    const response = await axiosInstance.post(
      '/member-img-file/deleteMemberImgFile',
      requestData,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 