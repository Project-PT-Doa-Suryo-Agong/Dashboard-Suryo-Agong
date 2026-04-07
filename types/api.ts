export type ApiSuccess<T> = {
  ok: true;
  success: true;
  data: T;
  message: string | null;
};

export type ApiError = {
  ok: false;
  success: false;
  data: null;
  message: string;
  errorCode: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
