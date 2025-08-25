"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster 
      position="top-center"
      toastOptions={{
        style: {
          direction: 'rtl',
        },
      }}
      richColors
    />
  );
}