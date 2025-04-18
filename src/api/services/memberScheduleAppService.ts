import {axiosInstance} from '../config/axiosConfig';

// 스케줄 관련 서비스
export interface CenterScheduleInfo {
  sch_id: number;
  sch_time: string;
  sch_max_cap: number;
  sch_info: string;
}

export interface MemberScheduleInfo {
  mem_sch_id: number;
  mem_id: number;
  sch_id: number;
  sch_dt: string;
  sch_time: string;
  sch_info: string;
}

export interface GetCenterScheduleResponse {
  success: boolean;
  data: CenterScheduleInfo[];
  message?: string;
}

export interface GetMemberScheduleResponse {
  success: boolean;
  data: MemberScheduleInfo[];
  message?: string;
}

export interface InsertMemberScheduleResponse {
  success: boolean;
  message?: string;
}

// 센터 ID로 회원 스케줄 조회
export const getCenterScheduleList = async (centerId: number): Promise<GetCenterScheduleResponse> => {
  try {
    const response = await axiosInstance.post('/member-schedule-app/getCenterScheduleList', {
      center_id: centerId
    });
    return response.data;
  } catch (error) {
    console.error('스케줄 조회 에러:', error);
    throw error;
  }
};

// 회원 스케줄 예약 추가
export const insertMemberSchedule = async (
  memId: number, 
  schId: number, 
  schDt: string
): Promise<InsertMemberScheduleResponse> => {
  try {
    const response = await axiosInstance.post('/member-schedule-app/insertMemberScheduleApp', {
      mem_id: memId,
      sch_id: schId,
      sch_dt: schDt
    });
    return response.data;
  } catch (error) {
    console.error('스케줄 예약 추가 에러:', error);
    throw error;
  }
};

// 회원 스케줄 목록 조회
export const getMemberScheduleList = async (memId: number): Promise<GetMemberScheduleResponse> => {
  try {
    const response = await axiosInstance.post('/member-schedule-app/getMemberScheduleAppList', {
      mem_id: memId
    });
    return response.data;
  } catch (error) {
    console.error('회원 스케줄 목록 조회 에러:', error);
    throw error;
  }
}; 