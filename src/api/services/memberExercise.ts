import axios from 'axios';
import {axiosInstance} from '../config/axiosConfig';

interface InsertMemberExerciseRequest {
  mem_id: number;
  exercise_dt: string;
  exercise_time: string;
  intensity_level: string;
  heart_rate: string | null;
  reg_dt: string;
  reg_id: number;
  mod_dt: string;
  mod_id: number;
}

interface InsertMemberExerciseResponse {
  success: boolean;
  message?: string;
}

interface MemberExerciseInfoResponse {
  success: boolean;
  data: Array<{
    exercise_id: number;
    mem_id: number;
    exercise_dt: string;
    exercise_time: string;
    intensity_level: string;
    heart_rate: string | null;
  }>;
}

interface UpdateMemberExerciseRequest {
  exercise_id: number;
  mem_id: number;
  exercise_dt: string;
  exercise_time: string;
  intensity_level: string;
  heart_rate: string | null;
  mod_dt: string;
  mod_id: number;
}

interface UpdateMemberExerciseResponse {
  success: boolean;
  message?: string;
}

interface MemberExerciseListResponse {
  success: boolean;
  data: Array<{
    exercise_id: number;
    mem_id: number;
    exercise_dt: string;
    exercise_time: string;
    intensity_level: string;
    heart_rate: string | null;
  }>;
  message?: string;
}

export const insertMemberExercise = async (params: InsertMemberExerciseRequest): Promise<InsertMemberExerciseResponse> => {
  try {
    const response = await axiosInstance.post('/member-exercise/insertMemberExercise', params);
    return response.data;
  } catch (error: any) {
    console.log(error.response?.data);
    console.error('운동 정보 저장 오류:', error);
    throw error;
  }
};

export const getMemberExerciseInfo = async (mem_id: number, exercise_dt: string): Promise<MemberExerciseInfoResponse> => {
  try {
    const response = await axiosInstance.post('/member-exercise/getMemberExerciseInfo', {
      mem_id,
      exercise_dt,
    });
    return response.data;
  } catch (error: any) {
    console.log(error.response?.data || error);
    console.error('운동 정보 조회 오류:', error);
    throw error;
  }
};

export const updateMemberExercise = async (params: UpdateMemberExerciseRequest): Promise<UpdateMemberExerciseResponse> => {
  try {
    const response = await axiosInstance.post('/member-exercise/updateMemberExercise', params);
    return response.data;
  } catch (error: any) {
    console.log(error.response?.data);
    console.error('운동 정보 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 운동 정보 목록 조회
 * @param memId 회원 ID
 * @param yearMonth 년월 (YYYYMM)
 * @param period 기간 (day, week, month, year)
 * @returns 
 */
export const getMemberExerciseList = async (
  memId: number,
  yearMonth: string,
  period: string = 'day',
): Promise<MemberExerciseListResponse> => {
  try {
    const response = await axiosInstance.post('/member-exercise/getMemberExerciseList', {
      mem_id: memId,
      year_month: yearMonth,
      period: period,
    });
    return response.data;
  } catch (error: any) {
    console.error('운동 정보 목록 조회 오류:', error);
    throw error;
  }
};
