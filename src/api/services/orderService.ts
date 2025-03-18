import axios from 'axios';
import {MemberOrder} from '../../types/order.types';
import {axiosInstance} from '../config/axiosConfig';

export interface GetMemberOrderResponse {
  success: boolean;
  message?: string;
  data: MemberOrder[];
}

interface MemberOrderRequest {
  mem_id: number;
}

export const getMemberOrdersList = async (params: MemberOrderRequest): Promise<GetMemberOrderResponse> => {
  try {
    const response = await axiosInstance.post('/member-orders/getMemberOrdersList', params);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 