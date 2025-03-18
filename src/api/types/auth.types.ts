export interface LoginRequest {
  mem_email_id: string;
  mem_app_password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token?: string;
    user: {
      mem_id: number;
      mem_email_id: string;
      mem_name: string;
      center_id: number;
    };
    message?: string;
  };
}

export interface ErrorResponse {
  success: boolean;
  message: string;
} 