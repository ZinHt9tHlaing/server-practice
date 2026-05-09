type AppError = Error & {
  status?: number;
  code?: string;
};

export const createError = (
  message: string,
  status: number,
  errorCode: string
) => {
  const error: AppError = new Error(message);
  error.status = status;
  error.code = errorCode;
  return error;
};
