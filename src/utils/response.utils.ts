export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data?: T;
  error?: any;
}

export function successResponse<T>(message: string, data: T): ApiResponse<T> {
  return {
    status: true,
    message,
    data,
  };
}

export function errorResponse(message: string, error?: any): ApiResponse<null> {
  return {
    status: false,
    message,
    error,
  };
}
