// utils/notify.js
import { toast } from 'react-hot-toast';

export const notifySuccess = (msg) =>
  toast.success(msg, {
    icon: '✅',
    duration: 2500,
    style: {
      background: '#f3f4f6',
      color: '#111827',
      border: '1px solid #e5e7eb',
      fontWeight: '500',
    },
  });

export const notifyError = (msg) =>
  toast.error(msg, {
    icon: '⚠️',
    duration: 4000,
    style: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
    },
  });
