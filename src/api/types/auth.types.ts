export interface LoginRequest {
  mem_app_id: string;
  mem_app_password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token?: string;
    user: {
      mem_id: number;
      mem_app_id: string;
      mem_name: string;
      center_id: number;
      mem_app_status?: string;
    };
    message?: string;
  };
}

export interface ErrorResponse {
  success: boolean;
  message: string;
} 