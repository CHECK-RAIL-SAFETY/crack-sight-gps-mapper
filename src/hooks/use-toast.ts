
/* 
 * This file was replaced with sonner for toast notifications
 * We're keeping the file for backward compatibility but we're using sonner for notifications
 */

import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  variant?: "default" | "destructive";
};

export const toast = {
  // Forward to sonner
  success: (message: string, options?: any) => {
    return sonnerToast.success(message, options);
  },
  error: (message: string, options?: any) => {
    return sonnerToast.error(message, options);
  },
  warning: (message: string, options?: any) => {
    return sonnerToast.warning(message, options);
  },
  info: (message: string, options?: any) => {
    return sonnerToast.info(message, options);
  },
  // Legacy API compatibility
  toast: (...args: any[]) => {
    // Forward to sonner's default toast
    return sonnerToast(args[0], args[1]);
  }
};

// Stub for backward compatibility
export const useToast = () => {
  return {
    toast,
    toasts: [],
    dismiss: () => {},
  };
};
