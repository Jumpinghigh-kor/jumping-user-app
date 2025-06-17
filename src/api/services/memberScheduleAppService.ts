import {axiosInstance} from '../config/axiosConfig';

// 스케줄 관련 서비스
export interface CenterScheduleInfo {
  sch_id: number;
  sch_time: string;
  sch_max_cap: number;
  sch_info: string;
  mem_sch_cnt: number;
  mem_total_sch_cnt: number;
  mem_change_sch_cnt: number;
  mem_basic_sch_cnt: number;
}

export interface MemberScheduleInfo {
  mem_sch_id: number;
  mem_id: number;
  original_sch_id: number;
  reservation_sch_id: number;
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
export const getCenterScheduleList = async (centerId: number, memId: number, schDt?: string): Promise<GetCenterScheduleResponse> => {
  try {
    const response = await axiosInstance.post('/member-schedule-app/getCenterScheduleList', {
      center_id: centerId,
      mem_id: memId,
      sch_dt: schDt
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 회원 스케줄 예약 추가
export const insertMemberScheduleApp = async (
  memId: number,
  originalSchId: number,
  reservationSchId: number,
  schDt: string,
  memName: string,
  centerId: number
): Promise<InsertMemberScheduleResponse> => {
  try {
    const response = await axiosInstance.post('/member-schedule-app/insertMemberScheduleApp', {
      mem_id: memId,
      reservation_sch_id: reservationSchId,
      original_sch_id: originalSchId,
      sch_dt: schDt,
      mem_name: memName,
      center_id: centerId
    });
    return response.data;
  } catch (error) {
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
    throw error;
  }
};

// 회원 스케줄 삭제
export const deleteMemberScheduleApp = async (
  memId: number, 
  schAppIds: number | number[],
): Promise<InsertMemberScheduleResponse> => {
  try {
    const response = await axiosInstance.post('/member-schedule-app/deleteMemberScheduleApp', {
      mem_id: memId,
      sch_app_id: schAppIds,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 회원 스케줄 수정
export const updateMemberScheduleApp = async (
  memId: number,
  schId: number,
  schAppId: number,
  memName: string,
  centerId: number,
  schDt: string,
): Promise<InsertMemberScheduleResponse> => {
  try {
    const response = await axiosInstance.post('/member-schedule-app/updateMemberScheduleApp', {
      mem_id: memId,
      reservation_sch_id: schId,
      sch_app_id: schAppId,
      mem_name: memName,
      center_id: centerId,
      sch_dt: schDt
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}; 