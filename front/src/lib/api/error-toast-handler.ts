import { toast } from 'sonner';
import { handleApiError } from './error-handler';

export const handleApiErrorWithToast = (
  error: unknown,
  operation: string = "API operation"
): void => {
  const message = handleApiError(error, operation, false);
  console.error(`${operation} failed:`, error);
  toast.error(message);
};

export const logAndToastError = (
  error: unknown,
  operation: string = "Operation"
): void => {
  console.error(`${operation} failed:`, error);
  const message = typeof error === 'string' 
    ? error 
    : error instanceof Error 
      ? error.message 
      : 'خطای نامشخص رخ داد';
  toast.error(message);
};