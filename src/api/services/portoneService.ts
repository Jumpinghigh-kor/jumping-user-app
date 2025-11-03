import { axiosInstance } from '../config/axiosConfig';

export interface VerifyPaymentRequest {
  imp_uid: string;
}

export interface CancelPaymentRequest {
  imp_uid: string;
  reason: string;
  amount?: number;
}

export interface PaymentVerificationResponse {
  success: boolean;
  data: {
    imp_uid: string;
    merchant_uid: string;
    pay_method: string;
    channel: string;
    pg_provider: string;
    pg_tid: string;
    pg_id: string;
    escrow: boolean;
    apply_num: string;
    bank_code: string;
    bank_name: string;
    card_code: string;
    card_name: string;
    card_quota: number;
    card_number: string;
    card_type: number;
    vbank_code: string;
    vbank_name: string;
    vbank_num: string;
    vbank_holder: string;
    vbank_date: number;
    name: string;
    amount: number;
    cancel_amount: number;
    currency: string;
    buyer_name: string;
    buyer_email: string;
    buyer_tel: string;
    buyer_addr: string;
    buyer_postcode: string;
    custom_data: string;
    user_agent: string;
    status: string;
    started_at: number;
    paid_at: number;
    failed_at: number;
    cancelled_at: number;
    fail_reason: string;
    cancel_reason: string;
    receipt_url: string;
    cancel_receipt_urls: string[];
    cash_receipt_issued: boolean;
    customer_uid: string;
    customer_uid_usage: string;
  };
}

// 결제 검증
export const verifyPayment = async (data: VerifyPaymentRequest): Promise<PaymentVerificationResponse> => {
  const response = await axiosInstance.post('/portone/verify', data);
  return response.data;
};

// 결제 취소
export const cancelPayment = async (data: CancelPaymentRequest): Promise<PaymentVerificationResponse> => {
  const response = await axiosInstance.post('/portone/refund', data);
  return response.data;
}; 