import {axiosInstance} from '../config/axiosConfig';
import axios from 'axios';

interface CheckinLogRequest {
  year: number;
  month: number;
  mem_id: number;
}

interface InsertCheckinLogRequest {
  mem_id: number;
  ci_password: string;
  memo_id?: number;
  pro_type?: string;
  center_id?: number;
}

interface CheckinLogResponse {
  success: boolean;
  data: Array<{
    ci_date_only: string;
    ci_time_only: string;
  }>;
}

interface InsertCheckinLogResponse {
  success: boolean;
  message?: string;
}

interface CheckinResponse {
  success: boolean;
  message?: string;
}

interface ValidateNumberResponse {
  success: boolean;
  message?: string;
}

export const getCheckinLogList = async (params: CheckinLogRequest): Promise<CheckinLogResponse> => {
  try {
    const response = await axiosInstance.post('/checkinLog/getCheckinLogList', params);
    return response.data;
  } catch (error) {
    throw new Error('관리자에게 문의해주세요.');
  }
};

export const validateMemberNumber = async (params: {
  mem_id: number;
  mem_checkin_number: string;
}): Promise<ValidateNumberResponse> => {
  try {
    const response = await axiosInstance.post('/checkinLog/validateMemberNumber', params);
    return response.data;
  } catch (error) {
    throw new Error('관리자에게 문의해주세요.');
  }
};

export const insertCheckinLog = async (params: InsertCheckinLogRequest): Promise<InsertCheckinLogResponse> => {
  try {
    const response = await axiosInstance.post('/checkinLog/insertCheckinLog', params);
    return response.data;
  } catch (error) {
    throw new Error('관리자에게 문의해주세요.');
  }
};
