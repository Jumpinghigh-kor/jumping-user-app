export interface MemberOrder {
  order_id: number;
  product_name: string;
  start_date?: string;
  end_date?: string;
  order_status?: string;
  memo_pro_name?: string;
  memo_start_date?: string;
  memo_end_date?: string;
  memo_remaining_counts?: number;
  pro_type: string;
  memo_id?: number;
  center_id?: number;
  mem_id?: number;
}

export interface MemberOrderResponse {
  success: boolean;
  message?: string;
  data: MemberOrder[];
}

export interface MemberOrderState {
  orders: MemberOrder[];
  loading: boolean;
  error: string | null;
} 