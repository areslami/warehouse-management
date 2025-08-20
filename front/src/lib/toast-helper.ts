type ToastType = "success" | "error" | "info" | "warning";

interface ToastInterface {
  showToast: (message: string, type: ToastType) => void;
}
let toastInstance: ToastInterface | null = null;

export const setToastInstance = (instance: ToastInterface) => {
  toastInstance = instance;
};

export const toast = {
  success: (message: string) => {
    if (toastInstance) {
      toastInstance.showToast(message, "success");
    }
  },
  error: (message: string) => {
    if (toastInstance) {
      toastInstance.showToast(message, "error");
    }
  },
  info: (message: string) => {
    if (toastInstance) {
      toastInstance.showToast(message, "info");
    }
  },
  warning: (message: string) => {
    if (toastInstance) {
      toastInstance.showToast(message, "warning");
    }
  },
};
