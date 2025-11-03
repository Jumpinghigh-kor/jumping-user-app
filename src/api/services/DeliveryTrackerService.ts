import { axiosInstance } from '../config/axiosConfig';

// 문의사항 타입 정의
export interface DeliveryTracker {
  trackingNumber: string;
  carrierId: string;
  status: string;
  statusCode: string;
  receiver: string;
  sender: string;
  trackingDetails: any[];
  rawData: any;
}

export const getDeliveryTracker = async (companyName: string, trackingNumber: string): Promise<DeliveryTracker> => {
  const response = await axiosInstance.post(`/delivery-tracker/getTrackingInfo`, {
    companyName: companyName,
    trackingNumber: trackingNumber
  });
  return response.data;
};