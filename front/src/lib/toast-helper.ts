let toastInstance: any = null;

export const setToastInstance = (instance: any) => {
  toastInstance = instance;
};

export const toast = {
  success: (message: string) => {
    if (toastInstance) {
      toastInstance.showToast(message, 'success');
    }
  },
  error: (message: string) => {
    if (toastInstance) {
      toastInstance.showToast(message, 'error');
    }
  },
  info: (message: string) => {
    if (toastInstance) {
      toastInstance.showToast(message, 'info');
    }
  },
  warning: (message: string) => {
    if (toastInstance) {
      toastInstance.showToast(message, 'warning');
    }
  }
};