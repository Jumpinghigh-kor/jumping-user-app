import {axiosInstance} from '../config/axiosConfig';

export interface UpdateLogInfo {
  up_app_id: number;
  up_app_version: string;
  up_app_desc: string;
  reg_dt: string;
}

interface GetUpdateLogAppInfoResponse {
  success: boolean;
  message: string;
  data?: UpdateLogInfo;
}

export const getUpdateLogAppInfo = async (): Promise<GetUpdateLogAppInfoResponse> => {
  try {
    const response = await axiosInstance.post('/update-log-app/getUpdateLogAppInfo');
    return response.data;
  } catch (error: any) {
    console.log(error.response.data);
    throw error;
  }
};
