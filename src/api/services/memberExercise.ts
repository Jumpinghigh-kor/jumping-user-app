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


export const insertMemberExercise = async (params: InsertMemberExerciseRequest): Promise<InsertMemberExerciseResponse> => {
  try {
    const response = await axiosInstance.post('/member-exercise/insertMemberExercise', params);
    return response.data;
  } catch (error) {
    console.error('운동 정보 저장 오류:', error);
    throw error;
  }
};
