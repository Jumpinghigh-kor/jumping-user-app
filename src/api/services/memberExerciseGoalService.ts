import {axiosInstance} from '../config/axiosConfig';

/**
 * 운동 목표 칼로리 등록
 * @param mem_id 회원 ID
 * @param goal_calory 목표 칼로리
 * @param goal_period 목표 기간 (DAY, WEEK, MONTH, YEAR)
 * @returns 
 */
export const insertMemberExerciseGoal = async (
  mem_id: number,
  goal_calory: string,
  goal_period: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await axiosInstance.post('/member-exercise-goal/insertMemberExerciseGoal', {
      mem_id,
      goal_calory,
      goal_period,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * 운동 목표 칼로리 수정
 * @param mem_id 회원 ID
 * @param goal_calory 목표 칼로리
 * @param goal_period 목표 기간 (DAY, WEEK, MONTH, YEAR)
 * @param exercise_goal_id 운동 목표 ID
 * @returns 
 */
export const updateMemberExerciseGoal = async (
  mem_id: number,
  goal_calory: string,
  exercise_goal_id: number,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await axiosInstance.post('/member-exercise-goal/updateMemberExerciseGoal', {
      mem_id,
      goal_calory,
      exercise_goal_id,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * 운동 목표 칼로리 조회
 * @param mem_id 회원 ID
 * @param goal_period 목표 기간 (DAY, WEEK, MONTH, YEAR)
 * @returns 
 */
export const getMemberExerciseGoal = async (
  mem_id: number,
  goal_period: string,
): Promise<{ success: boolean; data?: { goal_calory: string; exercise_goal_id: number; }; message?: string }> => {
  try {
    const response = await axiosInstance.post('/member-exercise-goal/getMemberExerciseGoal', {
      mem_id,
      goal_period,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
}; 