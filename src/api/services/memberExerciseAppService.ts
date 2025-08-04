import axios from 'axios';
import {axiosInstance} from '../config/axiosConfig';

interface InsertMemberExerciseAppRequest {
  mem_id: number;
  exercise_dt: string;
  jumping_exercise_time: string;
  jumping_intensity_level: string;
  jumping_heart_rate: string | null;
  other_exercise_time: string;
  other_exercise_type: string;
  other_exercise_calory: number;
  reg_dt: string;
  reg_id: number;
  mod_dt: string;
  mod_id: number;
}

interface InsertMemberExerciseAppResponse {
  success: boolean;
  message?: string;
}

interface MemberExerciseAppInfoResponse {
  success: boolean;
  data: Array<{
    exercise_app_id: number;
    mem_id: number;
    exercise_dt: string;
    jumping_exercise_time: string;
    jumping_intensity_level: string;
    jumping_heart_rate: string | null;
    other_exercise_time: string;
    other_exercise_type: string;
    other_exercise_calory: number;
  }>;
}

interface UpdateMemberExerciseAppRequest {
  exercise_app_id: number;
  mem_id: number;
  exercise_dt: string;
  jumping_exercise_time: string;
  jumping_intensity_level: string;
  jumping_heart_rate: string | null;
  other_exercise_time: string;
  other_exercise_type: string;
  other_exercise_calory: number;
  mod_dt: string;
  mod_id: number;
}

interface UpdateMemberExerciseAppResponse {
  success: boolean;
  message?: string;
}

interface MemberExerciseAppListResponse {
  success: boolean;
  data: Array<{
    exercise_app_id: number;
    mem_id: number;
    exercise_dt: string;
    jumping_exercise_time: string;
    jumping_intensity_level: string;
    jumping_heart_rate: string | null;
    other_exercise_time: string;
    other_exercise_type: string;
    other_exercise_calory: number;
  }>;
  message?: string;
}

export const insertMemberExerciseApp = async (params: InsertMemberExerciseAppRequest): Promise<InsertMemberExerciseAppResponse> => {
  try {
    const response = await axiosInstance.post('/member-exercise-app/insertMemberExerciseApp', params);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getMemberExerciseAppInfo = async (mem_id: number, exercise_dt: string): Promise<MemberExerciseAppInfoResponse> => {
  try {
    const response = await axiosInstance.post('/member-exercise-app/getMemberExerciseAppInfo', {
      mem_id,
      exercise_dt,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const updateMemberExerciseApp = async (params: UpdateMemberExerciseAppRequest): Promise<UpdateMemberExerciseAppResponse> => {
  try {
    const response = await axiosInstance.post('/member-exercise-app/updateMemberExerciseApp', params);
    return response.data;
  } catch (error: any) {
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
export const getMemberExerciseAppList = async (
  memId: number,
  yearMonth: string,
  period: string = 'day',
): Promise<MemberExerciseAppListResponse> => {
  try {
    const response = await axiosInstance.post('/member-exercise-app/getMemberExerciseAppList', {
      mem_id: memId,
      year_month: yearMonth,
      period: period,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
